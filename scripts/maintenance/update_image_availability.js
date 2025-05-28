#!/usr/bin/env node

/**
 * Image Availability Update Script
 *
 * This script checks for the existence of image files (WebP and PNG) for all parts
 * in the database and updates the img_file field accordingly.
 *
 * The script uses hierarchical matching with strict exact matches at each level:
 *
 * 1. EXACT MATCH: Try the original part number exactly as provided
 * 2. BASE PART MATCH: For variant parts, try to match the base part by stripping:
 *    - Print codes (pr0001, pr0123, etc.)
 *    - Color codes (c01, c02, etc.)
 *    - Pattern codes (pat0001, etc.)
 *    - Letter suffixes (a, b, c, etc.)
 *    - Special suffixes (dummy, LR, RL)
 * 3. LEADING ZERO VARIATIONS: For each candidate, try with/without leading zeros
 *
 * Examples:
 * - "3556pr0001" → tries "3556pr0001", then "3556", "003556", etc.
 * - "3001c01" → tries "3001c01", then "3001", "003001", etc.
 * - "4158a" → tries "4158a", then "4158", "004158", etc.
 *
 * Usage:
 *   node scripts/update_image_availability.js [options]
 *
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --verbose    Show detailed output for each part processed
 *   --debug      Show extra debugging information (implies --verbose)
 *   --batch-size Set the number of parts to process in each batch (default: 1000)
 *   --help       Show this help message
 */

const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
const sqlite3 = require('sqlite3')
const { open } = require('sqlite')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
}

const c = (color, text) => `${colors[color]}${text}${colors.reset}`

// Configuration
const CONFIG = {
  dbPath: path.join(process.cwd(), 'data', 'lego.sqlite'),
  imagesDir: path.join(process.cwd(), 'public', 'data', 'images'),
  batchSize: 2000,
  dryRun: false,
  verbose: false,
  debug: false,
  testing: false,
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
      case '--debug':
        CONFIG.debug = true
        CONFIG.verbose = true // Debug implies verbose
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
in the database and updates the img_file field accordingly.

The script uses hierarchical matching with strict exact matches at each level:

1. EXACT MATCH: Try the original part number exactly as provided
2. BASE PART MATCH: For variant parts, try to match the base part by stripping:
   - Print codes (pr0001, pr0123, etc.)
   - Color codes (c01, c02, etc.)
   - Pattern codes (pat0001, etc.)
   - Letter suffixes (a, b, c, etc.)
   - Special suffixes (dummy, LR, RL)
3. LEADING ZERO VARIATIONS: For each candidate, try with/without leading zeros

Examples:
- "3556pr0001" → tries "3556pr0001", then "3556", "003556", etc.
- "3001c01" → tries "3001c01", then "3001", "003001", etc.
- "4158a" → tries "4158a", then "4158", "004158", etc.

Usage:
  node scripts/update_image_availability.js [options]

Options:
  --dry-run         Show what would be updated without making changes
  --verbose         Show detailed output for each part processed
  --debug           Show extra debugging information (implies --verbose)
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
      console.log(`   ${c('green', '✓')} Found ${imageFilesCache.length} image files`)
    } catch (error) {
      console.error(`   ${c('red', '❌')} Error reading images directory: ${error.message}`)
      imageFilesCache = []
    }
  }
  return imageFilesCache
}

// Generate hierarchical part variations for matching
function generatePartVariations(partId) {
  const allVariations = []

  // Start with the original part ID
  allVariations.push(partId)

  // Generate base part variations by progressively stripping suffixes
  let currentPart = partId
  const strippedVariations = []

  // Strip print codes (pr followed by 4 digits)
  if (/pr\d{4}$/.test(currentPart)) {
    currentPart = currentPart.replace(/pr\d{4}$/, '')
    strippedVariations.push(currentPart)
  }

  // Strip color codes (c followed by 2 digits)
  if (/c\d{2}$/.test(currentPart)) {
    currentPart = currentPart.replace(/c\d{2}$/, '')
    strippedVariations.push(currentPart)
  }

  // Strip pattern codes (pat followed by 4 digits)
  if (/pat\d{4}$/.test(currentPart)) {
    currentPart = currentPart.replace(/pat\d{4}$/, '')
    strippedVariations.push(currentPart)
  }

  // Strip single letter suffixes (a, b, c, etc.)
  if (/[a-z]$/.test(currentPart)) {
    currentPart = currentPart.replace(/[a-z]$/, '')
    strippedVariations.push(currentPart)
  }

  // Strip dummy suffix
  if (/dummy$/.test(currentPart)) {
    currentPart = currentPart.replace(/dummy$/, '')
    strippedVariations.push(currentPart)
  }

  // Strip LR/RL suffixes (left/right variants)
  if (/(LR|RL)$/.test(currentPart)) {
    currentPart = currentPart.replace(/(LR|RL)$/, '')
    strippedVariations.push(currentPart)
  }

  // Add all stripped variations
  allVariations.push(...strippedVariations)

  // For each variation, add leading zero variants
  const finalVariations = []
  for (const variation of allVariations) {
    if (variation && variation.length > 0) {
      // Ensure we don't add empty strings
      finalVariations.push(variation)

      // Add version with leading zeros stripped
      const stripped = variation.replace(/^0+/, '')
      if (stripped && stripped !== variation) {
        finalVariations.push(stripped)
      }

      // Add version padded to 6 digits
      const padded = variation.padStart(6, '0')
      if (padded !== variation) {
        finalVariations.push(padded)
      }
    }
  }

  // Remove duplicates and filter out very short parts (likely invalid)
  return [...new Set(finalVariations)].filter((v) => v && v.length >= 1)
}

// Check if part has any image and return the best filename
async function checkPartImages(partId) {
  // Ensure cache is initialized
  await initializeImageCache()

  // Generate hierarchical variations
  const variations = generatePartVariations(partId)

  // Check if any cached image files match our part variations (EXACT MATCHES ONLY)
  let foundFiles = []
  let matchedVariation = null

  // Try variations in order of preference (exact match first, then base parts)
  for (const variation of variations) {
    const matchingFiles = imageFilesCache.filter((baseName) => {
      // Only allow exact matches - no partial matches
      return baseName === variation
    })

    if (matchingFiles.length > 0) {
      foundFiles.push(...matchingFiles)
      if (!matchedVariation) {
        matchedVariation = variation // Remember the first (highest priority) match
      }
    }
  }

  // Remove duplicates and find the best image file
  const uniqueFiles = [...new Set(foundFiles)]
  const bestImageFile = selectBestImageFile(uniqueFiles, partId, matchedVariation)

  return {
    hasAny: uniqueFiles.length > 0,
    bestImageFile,
    foundFiles: uniqueFiles,
    variations,
    matchedVariation,
    isExactMatch: matchedVariation === partId,
  }
}

// Select the best image file from available options
function selectBestImageFile(files, partId, matchedVariation = null) {
  if (files.length === 0) return null

  // If we have a specific matched variation, prioritize it
  if (matchedVariation && files.includes(matchedVariation)) {
    // For testing, we don't have actual files, so just return the variation
    if (CONFIG.testing) {
      return matchedVariation
    }

    // Check for WebP first, then PNG for the matched variation
    if (fsSync.existsSync(path.join(CONFIG.imagesDir, `${matchedVariation}.webp`))) {
      return `${matchedVariation}.webp`
    }
    if (fsSync.existsSync(path.join(CONFIG.imagesDir, `${matchedVariation}.png`))) {
      return `${matchedVariation}.png`
    }
  }

  // Fallback to original logic if matched variation doesn't have files
  // Create variations of the part ID for priority matching
  const partVariations = [
    partId, // Original part ID (highest priority)
    partId.replace(/^0+/, ''), // Strip leading zeros
    partId.padStart(6, '0'), // Pad to 6 digits with leading zeros
  ]

  // Remove duplicates and prioritize by preference
  const uniqueVariations = [...new Set(partVariations)]

  // Priority order for selection:
  // 1. Original part ID (exact as provided)
  // 2. Stripped leading zeros version
  // 3. Padded version
  // Within each priority level, prefer .webp over .png

  for (const variation of uniqueVariations) {
    if (files.includes(variation)) {
      // For testing, we don't have actual files, so just return the variation
      if (CONFIG.testing) {
        return variation
      }

      // Check for WebP first, then PNG
      if (fsSync.existsSync(path.join(CONFIG.imagesDir, `${variation}.webp`))) {
        return `${variation}.webp`
      }
      if (fsSync.existsSync(path.join(CONFIG.imagesDir, `${variation}.png`))) {
        return `${variation}.png`
      }
    }
  }

  return null
}

// Get all parts from database
async function getAllParts(db) {
  const query = 'SELECT part_num, img_file FROM parts ORDER BY part_num'
  return db.all(query)
}

// Update img_file field for a part
async function updatePartImageStatus(db, partId, imgFile) {
  if (CONFIG.dryRun) {
    return
  }

  const query = 'UPDATE parts SET img_file = ? WHERE part_num = ?'
  await db.run(query, [imgFile, partId])
}

// Process parts in batches
async function processParts(db, parts) {
  const stats = {
    total: parts.length,
    processed: 0,
    updated: 0,
    hasImage: 0,
    noImage: 0,
    exactMatches: 0,
    baseMatches: 0,
    errors: 0,
  }

  // Progress display formatting

  const totalBatches = Math.ceil(parts.length / CONFIG.batchSize)

  for (let i = 0; i < parts.length; i += CONFIG.batchSize) {
    const batch = parts.slice(i, i + CONFIG.batchSize)
    const batchNum = Math.floor(i / CONFIG.batchSize) + 1

    for (let j = 0; j < batch.length; j++) {
      const part = batch[j]
      try {
        const imageInfo = await checkPartImages(part.part_num)
        const currentImgFile = part.img_file
        const newImgFile = imageInfo.bestImageFile
        const shouldHaveImg = imageInfo.hasAny

        stats.processed++

        if (shouldHaveImg) {
          stats.hasImage++
          if (imageInfo.isExactMatch) {
            stats.exactMatches++
          } else {
            stats.baseMatches++
          }
        } else {
          stats.noImage++
        }

        // Update if the database value doesn't match reality
        const needsUpdate = currentImgFile !== newImgFile
        if (needsUpdate) {
          stats.updated++

          if (CONFIG.verbose) {
            const action = CONFIG.dryRun ? '[DRY RUN]' : '[UPDATING]'
            const matchType = imageInfo.isExactMatch ? 'EXACT' : 'BASE'
            console.log(
              `${action} Part ${part.part_num}: img_file='${currentImgFile || 'null'}' -> '${newImgFile || 'null'}' (${matchType})`
            )
            if (imageInfo.hasAny && imageInfo.foundFiles.length > 0) {
              if (!imageInfo.isExactMatch && imageInfo.matchedVariation) {
                console.log(`  Base part match: ${imageInfo.matchedVariation}`)
              }
              console.log(`  Found files: ${imageInfo.foundFiles.join(', ')}`)
            }
          }

          await updatePartImageStatus(db, part.part_num, newImgFile)
        } else if (CONFIG.verbose) {
          console.log(`[OK] Part ${part.part_num}: img_file='${currentImgFile || 'null'}' (correct)`)
        }

        // Debug logging for potential issues
        if (CONFIG.debug && imageInfo.hasAny) {
          console.log(`[DEBUG] Part ${part.part_num}:`)
          console.log(
            `  Variations checked: ${imageInfo.variations.slice(0, 10).join(', ')}${imageInfo.variations.length > 10 ? ` (+${imageInfo.variations.length - 10} more)` : ''}`
          )
          console.log(`  Files found: ${imageInfo.foundFiles.join(', ')}`)
          console.log(`  Matched variation: ${imageInfo.matchedVariation}`)
          console.log(`  Is exact match: ${imageInfo.isExactMatch}`)
          console.log(`  Best file selected: ${imageInfo.bestImageFile || 'none'}`)
        }

        // Single-line progress indicator (if not verbose)
        if (!CONFIG.verbose) {
          process.stdout.write(
            `\r${c('green', `Processing: ${stats.processed}/${stats.total} parts (Batch ${batchNum}/${totalBatches})`)}`
          )
        }
      } catch (error) {
        stats.errors++
        console.error(`Error processing part ${part.part_num}:`, error.message)
      }
    }
  }

  // At the end, clear the progress line and print the final summary
  if (!CONFIG.verbose) {
    process.stdout.write('\r\x1b[2K') // Clear the line
  }

  return stats
}

// Main function
async function main() {
  parseArgs()

  console.log(c('cyan', '🖼️  Image Availability Update'))

  if (CONFIG.dryRun) {
    console.log(c('yellow', '🔍 DRY RUN MODE - No changes will be made to the database'))
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
      console.error(c('red', `❌ Database not found: ${CONFIG.dbPath}`))
      process.exit(1)
    }

    // Check if images directory exists
    try {
      await fs.access(CONFIG.imagesDir)
    } catch {
      console.error(c('red', `❌ Images directory not found: ${CONFIG.imagesDir}`))
      process.exit(1)
    }

    // Open database connection
    const db = await openDb()

    // Get all parts
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
    console.log(c('cyan', 'Summary'))
    console.log(c('bright', '======='))
    console.log(`Total parts processed: ${stats.processed}`)
    console.log(`Parts with images: ${stats.hasImage}`)
    console.log(`  - Exact matches: ${stats.exactMatches}`)
    console.log(`  - Base part matches: ${stats.baseMatches}`)
    console.log(`Parts without images: ${stats.noImage}`)
    console.log(`Database updates needed: ${stats.updated}`)
    console.log(`Errors: ${stats.errors}`)
    console.log(`Processing time: ${duration} seconds`)

    if (CONFIG.dryRun && stats.updated > 0) {
      console.log('')
      console.log(c('cyan', '💡 Run without --dry-run to apply these changes to the database'))
    }

    if (stats.updated > 0 && !CONFIG.dryRun) {
      console.log('')
      console.log(c('green', '✅ Database has been updated successfully!'))
    }

    if (stats.errors > 0) {
      console.log('')
      console.log(c('yellow', `⚠️  ${stats.errors} errors occurred during processing`))
      process.exit(1)
    }
  } catch (error) {
    console.error(c('red', '❌ Fatal error:'), error.message)
    if (CONFIG.verbose) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Test function to verify matching logic
async function testMatching() {
  console.log('Testing image matching logic...')

  // Enable testing mode
  CONFIG.testing = true

  // Mock some test data - this simulates various matching scenarios
  imageFilesCache = ['3556', '35563', '003556', '123456', '0001', '1', '3001', '4158', '2456']

  const testCases = [
    { partId: '3556', expectedMatch: '3556', description: 'Exact match' },
    { partId: '003556', expectedMatch: '003556', description: 'Exact match with leading zeros' },
    { partId: '1', expectedMatch: '1', description: 'Simple exact match' },
    { partId: '0001', expectedMatch: '0001', description: 'Exact match with leading zeros' },
    { partId: '123456', expectedMatch: '123456', description: 'Six digit exact match' },
    { partId: '35563', expectedMatch: '35563', description: 'Should NOT match 3556 (this was the bug)' },
    { partId: '9999', expectedMatch: null, description: 'No match available' },
    // Test hierarchical matching
    { partId: '3556pr0001', expectedMatch: '3556', description: 'Printed part should match base part' },
    { partId: '3001c01', expectedMatch: '3001', description: 'Color variant should match base part' },
    { partId: '4158a', expectedMatch: '4158', description: 'Letter suffix should match base part' },
    { partId: '2456pat0001', expectedMatch: '2456', description: 'Pattern part should match base part' },
    { partId: '3001c01pr0001', expectedMatch: '3001', description: 'Complex part should match base part' },
    { partId: '1234pr0001', expectedMatch: null, description: 'Printed part with no base match' },
  ]

  for (const testCase of testCases) {
    const result = await checkPartImages(testCase.partId)
    const match = result.bestImageFile
    const status = match === testCase.expectedMatch ? '✅' : '❌'
    const matchType = result.isExactMatch ? 'EXACT' : 'BASE'
    console.log(
      `${status} Part ${testCase.partId}: expected ${testCase.expectedMatch}, got ${match} (${matchType}) - ${testCase.description}`
    )
    if (match !== testCase.expectedMatch) {
      console.log(
        `  Variations: ${result.variations.slice(0, 5).join(', ')}${result.variations.length > 5 ? ` (+${result.variations.length - 5} more)` : ''}`
      )
      console.log(`  Found files: ${result.foundFiles.join(', ')}`)
      console.log(`  Matched variation: ${result.matchedVariation}`)
    }
  }
}

// Run the script
if (require.main === module) {
  // Check for test mode
  if (process.argv.includes('--test')) {
    testMatching()
  } else {
    main()
  }
}

module.exports = { main, checkPartImages, generatePartVariations, testMatching, CONFIG }
