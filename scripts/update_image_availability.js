#!/usr/bin/env node

/**
 * Image Availability Update Script
 *
 * This script checks for the existence of image files (WebP and PNG) for all parts
 * in the database and updates the has_img field accordingly.
 *
 * Usage:
 *   node scripts/update_image_availability.js [options]
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --verbose    Show detailed output for each part processed
 *   --batch-size Set the number of parts to process in each batch (default: 1000)
 *   --help       Show this help message
 */

const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

// Configuration
const CONFIG = {
  dbPath: path.join(process.cwd(), 'data', 'lego.sqlite'),
  imagesDir: path.join(process.cwd(), 'public', 'data', 'images'),
  batchSize: 2000,
  dryRun: false,
  verbose: false,
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)

  for (const arg of args) {
    switch (arg) {
      case '--dry-run':
        CONFIG.dryRun = true
        break
      case '--verbose':
        CONFIG.verbose = true
        break
      case '--help':
        showHelp()
        process.exit(0)
        break
      default:
        if (arg.startsWith('--batch-size=')) {
          const size = parseInt(arg.split('=')[1])
          if (size > 0) {
            CONFIG.batchSize = size
          } else {
            console.error('Invalid batch size. Must be a positive number.')
            process.exit(1)
          }
        } else {
          console.error(`Unknown option: ${arg}`)
          showHelp()
          process.exit(1)
        }
    }
  }
}

function showHelp() {
  console.log(`
Image Availability Update Script

This script checks for the existence of image files (WebP and PNG) for all parts
in the database and updates the has_img field accordingly.

Usage:
  node scripts/update_image_availability.js [options]

Options:
  --dry-run         Show what would be updated without making changes
  --verbose         Show detailed output for each part processed
  --batch-size=N    Set the number of parts to process in each batch (default: 1000)
  --help            Show this help message

Examples:
  node scripts/update_image_availability.js --dry-run --verbose
  node scripts/update_image_availability.js --batch-size=500
`)
}

// Database connection
async function openDb() {
  return open({
    filename: CONFIG.dbPath,
    driver: sqlite3.Database,
  })
}

// Check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

// Global variable to cache image files list
let imageFilesCache = null

// Initialize image files cache
async function initializeImageCache() {
  if (imageFilesCache === null) {
    try {
      console.log('📁 Loading image files list...')
      const allFiles = await fs.readdir(CONFIG.imagesDir)
      // Filter to only image files and remove extensions for easier matching
      imageFilesCache = allFiles
        .filter((file) => /\.(webp|png)$/i.test(file))
        .map((file) => file.replace(/\.(webp|png)$/i, ''))
      console.log(`Found ${imageFilesCache.length} image files`)
    } catch (error) {
      console.error(`Error reading images directory: ${error.message}`)
      imageFilesCache = []
    }
  }
  return imageFilesCache
}

// Check if part has any image and return the best filename
async function checkPartImages(partId) {
  // Ensure cache is initialized
  await initializeImageCache()

  // Try multiple filename variations for this part
  const variations = [
    partId, // Original part ID
    partId.replace(/^0+/, ''), // Strip leading zeros
    partId.padStart(6, '0'), // Pad to 6 digits with leading zeros
  ]

  // Check if any cached image files match our part variations
  let foundFiles = []

  for (const variation of variations) {
    const matchingFiles = imageFilesCache.filter((baseName) => {
      // Check for exact match or files that start with the part number
      return baseName === variation || baseName.startsWith(variation)
    })

    if (matchingFiles.length > 0) {
      foundFiles.push(...matchingFiles)
      break // Found matches, no need to check other variations
    }
  }

  // Remove duplicates and find the best image file
  const uniqueFiles = [...new Set(foundFiles)]
  const bestImageFile = selectBestImageFile(uniqueFiles, partId)

  return {
    hasAny: uniqueFiles.length > 0,
    bestImageFile,
    foundFiles: uniqueFiles,
    variations,
  }
}

// Select the best image file from available options
function selectBestImageFile(files, partId) {
  if (files.length === 0) return null

  // Priority order for selection:
  // 1. Exact match with .webp extension
  // 2. Exact match with .png extension
  // 3. First variant with .webp extension
  // 4. First variant with .png extension
  // 5. Any other file

  const exactMatches = files.filter(
    (f) => f === partId || f === partId.replace(/^0+/, '') || f === partId.padStart(6, '0')
  )
  const variants = files.filter((f) => !exactMatches.includes(f))

  // Check for exact matches first
  for (const file of exactMatches) {
    // Prefer WebP over PNG for exact matches
    if (fsSync.existsSync(path.join(CONFIG.imagesDir, `${file}.webp`))) return `${file}.webp`
    if (fsSync.existsSync(path.join(CONFIG.imagesDir, `${file}.png`))) return `${file}.png`
  }

  // Check variants
  for (const file of variants) {
    // Prefer WebP over PNG for variants
    if (fsSync.existsSync(path.join(CONFIG.imagesDir, `${file}.webp`))) return `${file}.webp`
    if (fsSync.existsSync(path.join(CONFIG.imagesDir, `${file}.png`))) return `${file}.png`
  }

  return null
}

// Get all parts from database
async function getAllParts(db) {
  const query = 'SELECT part_num, has_img, img_file FROM parts ORDER BY part_num'
  return db.all(query)
}

// Update img_file and has_img fields for a part
async function updatePartImageStatus(db, partId, imgFile) {
  if (CONFIG.dryRun) {
    return
  }

  const hasImg = imgFile ? 1 : 0
  const query = 'UPDATE parts SET has_img = ?, img_file = ? WHERE part_num = ?'
  await db.run(query, [hasImg, imgFile, partId])
}

// Process parts in batches
async function processParts(db, parts) {
  const stats = {
    total: parts.length,
    processed: 0,
    updated: 0,
    hasImage: 0,
    noImage: 0,
    errors: 0,
  }

  console.log(`Processing ${stats.total} parts in batches of ${CONFIG.batchSize}...`)

  for (let i = 0; i < parts.length; i += CONFIG.batchSize) {
    const batch = parts.slice(i, i + CONFIG.batchSize)
    const batchNum = Math.floor(i / CONFIG.batchSize) + 1
    const totalBatches = Math.ceil(parts.length / CONFIG.batchSize)

    console.log(`Processing batch ${batchNum}/${totalBatches} (${batch.length} parts)...`)

    for (const part of batch) {
      try {
        const imageInfo = await checkPartImages(part.part_num)
        const currentImgFile = part.img_file
        const newImgFile = imageInfo.bestImageFile
        const shouldHaveImg = imageInfo.hasAny

        stats.processed++

        if (shouldHaveImg) {
          stats.hasImage++
        } else {
          stats.noImage++
        }

        // Update if the database value doesn't match reality
        const needsUpdate = currentImgFile !== newImgFile
        if (needsUpdate) {
          stats.updated++

          if (CONFIG.verbose) {
            const action = CONFIG.dryRun ? '[DRY RUN]' : '[UPDATING]'
            console.log(
              `${action} Part ${part.part_num}: img_file='${currentImgFile || 'null'}' -> '${newImgFile || 'null'}'`
            )
            if (CONFIG.verbose && imageInfo.hasAny && imageInfo.foundFiles.length > 0) {
              console.log(
                `  Found: ${imageInfo.foundFiles.slice(0, 3).join(', ')}${imageInfo.foundFiles.length > 3 ? ` (+${imageInfo.foundFiles.length - 3} more)` : ''}`
              )
            }
          }

          await updatePartImageStatus(db, part.part_num, newImgFile)
        } else if (CONFIG.verbose) {
          console.log(`[OK] Part ${part.part_num}: img_file='${currentImgFile || 'null'}' (correct)`)
        }

        // Progress indicator for large batches
        if (stats.processed % 100 === 0) {
          const progress = ((stats.processed / stats.total) * 100).toFixed(1)
          console.log(`  Progress: ${stats.processed}/${stats.total} (${progress}%)`)
        }
      } catch (error) {
        stats.errors++
        console.error(`Error processing part ${part.part_num}:`, error.message)
      }
    }
  }

  return stats
}

// Main function
async function main() {
  parseArgs()

  console.log('Image Availability Update Script')
  console.log('================================')

  if (CONFIG.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made to the database')
  }

  console.log(`Database: ${CONFIG.dbPath}`)
  console.log(`Images directory: ${CONFIG.imagesDir}`)
  console.log(`Batch size: ${CONFIG.batchSize}`)
  console.log('')

  try {
    // Check if database exists
    try {
      await fs.access(CONFIG.dbPath)
    } catch {
      console.error(`❌ Database not found: ${CONFIG.dbPath}`)
      process.exit(1)
    }

    // Check if images directory exists
    try {
      await fs.access(CONFIG.imagesDir)
    } catch {
      console.error(`❌ Images directory not found: ${CONFIG.imagesDir}`)
      process.exit(1)
    }

    // Open database connection
    console.log('📂 Opening database connection...')
    const db = await openDb()

    // Get all parts
    console.log('📋 Fetching parts from database...')
    const parts = await getAllParts(db)
    console.log(`Found ${parts.length} parts in database`)

    if (parts.length === 0) {
      console.log('No parts found in database. Exiting.')
      await db.close()
      return
    }

    // Process parts
    const startTime = Date.now()
    const stats = await processParts(db, parts)
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    // Close database
    await db.close()

    // Print summary
    console.log('')
    console.log('Summary')
    console.log('=======')
    console.log(`Total parts processed: ${stats.processed}`)
    console.log(`Parts with images: ${stats.hasImage}`)
    console.log(`Parts without images: ${stats.noImage}`)
    console.log(`Database updates needed: ${stats.updated}`)
    console.log(`Errors: ${stats.errors}`)
    console.log(`Processing time: ${duration} seconds`)

    if (CONFIG.dryRun && stats.updated > 0) {
      console.log('')
      console.log('💡 Run without --dry-run to apply these changes to the database')
    }

    if (stats.updated > 0 && !CONFIG.dryRun) {
      console.log('')
      console.log('✅ Database has been updated successfully!')
    }

    if (stats.errors > 0) {
      console.log('')
      console.log(`⚠️  ${stats.errors} errors occurred during processing`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    if (CONFIG.verbose) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { main, checkPartImages, CONFIG }
