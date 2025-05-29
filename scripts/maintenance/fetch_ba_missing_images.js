#!/usr/bin/env node

/**
 * Fetch Missing Images from BrickArchitect
 *
 * This script fetches missing part images from BrickArchitect and converts them to WebP format.
 * It queries for parts that have a ba_cat_id (indicating they exist on BrickArchitect) but
 * are missing image files locally.
 *
 * The script will:
 * 1. Query the database for parts missing images but available on BrickArchitect
 * 2. Fetch images from https://brickarchitect.com/content/parts-large/{part_num}.png
 * 3. Convert downloaded images to WebP format
 * 4. Update the database with image availability information
 *
 * Usage:
 *   node scripts/fetch-missing-images.js [options]
 *
 * Options:
 *   --dry-run       Show what would be downloaded without fetching images
 *   --limit=N       Limit the number of images to fetch (default: unlimited)
 *   --delay=N       Delay between requests in milliseconds (default: 1000)
 *   --verbose       Show detailed output for each part processed
 *   --help          Show this help message
 */

const fs = require('fs').promises
const fsSync = require('fs')
const path = require('path')
const https = require('https')
const { spawn } = require('child_process')
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
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
}

const c = (color, text) => `${colors[color]}${text}${colors.reset}`

// Configuration
const CONFIG = {
  dbPath: path.join(process.cwd(), 'data', 'lego.sqlite'),
  imagesDir: path.join(process.cwd(), 'public', 'data', 'images'),
  baseUrl: 'https://brickarchitect.com/content/parts-large/',
  delay: 100, // ms delay between requests
  limit: null, // No limit by default
  dryRun: false,
  verbose: false,
  userAgent: 'Mozilla/5.0 (compatible; LEGO-Label-Search/1.0; +https://github.com/user/lego-label-search)',
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
        if (arg.startsWith('--limit=')) {
          const limit = parseInt(arg.split('=')[1])
          if (limit > 0) {
            CONFIG.limit = limit
          } else {
            console.error('Invalid limit. Must be a positive number.')
            process.exit(1)
          }
        } else if (arg.startsWith('--delay=')) {
          const delay = parseInt(arg.split('=')[1])
          if (delay >= 0) {
            CONFIG.delay = delay
          } else {
            console.error('Invalid delay. Must be a non-negative number.')
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
Fetch Missing Images from BrickArchitect

This script fetches missing part images from BrickArchitect and converts them to WebP format.
It queries for parts that have a ba_cat_id (indicating they exist on BrickArchitect) but
are missing image files locally.

The script will:
1. Query the database for parts missing images but available on BrickArchitect
2. Fetch images from https://brickarchitect.com/content/parts-large/{part_num}.png
3. Convert downloaded images to WebP format
4. Update the database with image availability information

Usage:
  node scripts/fetch-missing-images.js [options]

Options:
  --dry-run       Show what would be downloaded without fetching images
  --limit=N       Limit the number of images to fetch (default: unlimited)
  --delay=N       Delay between requests in milliseconds (default: 1000)
  --verbose       Show detailed output for each part processed
  --help          Show this help message

Examples:
  node scripts/fetch-missing-images.js --dry-run --verbose
  node scripts/fetch-missing-images.js --limit=10 --delay=2000
`)
}

// Database connection
async function openDb() {
  return open({
    filename: CONFIG.dbPath,
    driver: sqlite3.Database,
  })
}

// Get parts missing images that exist on BrickArchitect
async function getMissingImageParts(db) {
  const query = `
    SELECT part_num, name, ba_cat_id
    FROM parts
    WHERE ba_cat_id IS NOT NULL
      AND (img_file IS NULL OR img_file = '')
    ORDER BY part_num
    ${CONFIG.limit ? `LIMIT ${CONFIG.limit}` : ''}
  `
  return db.all(query)
}

// Download image from URL
function downloadImage(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fsSync.createWriteStream(outputPath)

    const request = https.get(
      url,
      {
        headers: {
          'User-Agent': CONFIG.userAgent,
          Accept: 'image/png, image/jpeg, image/webp, image/*',
        },
      },
      (response) => {
        // Check if the response is successful
        if (response.statusCode === 200) {
          response.pipe(file)

          file.on('finish', () => {
            file.close()
            resolve({ success: true, statusCode: response.statusCode })
          })

          file.on('error', (err) => {
            fsSync.unlink(outputPath, () => {}) // Delete partial file
            reject(new Error(`File write error: ${err.message}`))
          })
        } else {
          file.close()
          fsSync.unlink(outputPath, () => {}) // Delete empty file
          resolve({ success: false, statusCode: response.statusCode })
        }
      }
    )

    request.on('error', (err) => {
      file.close()
      fsSync.unlink(outputPath, () => {}) // Delete partial file
      reject(new Error(`Request error: ${err.message}`))
    })

    request.setTimeout(30000, () => {
      request.abort()
      file.close()
      fsSync.unlink(outputPath, () => {}) // Delete partial file
      reject(new Error('Request timeout'))
    })
  })
}

// Convert PNG to WebP using sharp or imagemagick
async function convertToWebp(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    // Try using imagemagick convert command first
    const convert = spawn('convert', [inputPath, '-quality', '85', outputPath])

    let stderr = ''
    convert.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    convert.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`ImageMagick convert failed (code ${code}): ${stderr}`))
      }
    })

    convert.on('error', (err) => {
      // If ImageMagick is not available, try using sharp (if available)
      if (err.code === 'ENOENT') {
        try {
          const sharp = require('sharp')
          sharp(inputPath).webp({ quality: 85 }).toFile(outputPath).then(resolve).catch(reject)
        } catch (sharpErr) {
          reject(new Error(`Neither ImageMagick nor Sharp available for WebP conversion: ${err.message}`))
        }
      } else {
        reject(err)
      }
    })
  })
}

// Sleep function for throttling
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Process a single part
async function processPart(part, index, total) {
  const partNum = part.part_num
  const url = `${CONFIG.baseUrl}${partNum}.png`
  const pngPath = path.join(CONFIG.imagesDir, `${partNum}.png`)
  const webpPath = path.join(CONFIG.imagesDir, `${partNum}.webp`)

  const progress = `${index + 1}/${total}`
  const progressStr = c('cyan', `[${progress}]`)

  if (CONFIG.verbose) {
    console.log(`${progressStr} Processing part ${c('bright', partNum)}: ${part.name}`)
    console.log(`  URL: ${url}`)
  }

  if (CONFIG.dryRun) {
    if (CONFIG.verbose) {
      console.log(`  ${c('yellow', '[DRY RUN]')} Would download to: ${pngPath}`)
      console.log(`  ${c('yellow', '[DRY RUN]')} Would convert to: ${webpPath}`)
    }
    return { success: true, downloaded: false, converted: false }
  }

  try {
    // Download the PNG image
    const downloadResult = await downloadImage(url, pngPath)

    if (!downloadResult.success) {
      if (CONFIG.verbose) {
        console.log(`  ${c('yellow', '⚠️')} Image not found (HTTP ${downloadResult.statusCode})`)
      }
      return { success: true, downloaded: false, converted: false, statusCode: downloadResult.statusCode }
    }

    if (CONFIG.verbose) {
      console.log(`  ${c('green', '✓')} Downloaded PNG successfully`)
    }

    // Convert to WebP
    try {
      await convertToWebp(pngPath, webpPath)
      if (CONFIG.verbose) {
        console.log(`  ${c('green', '✓')} Converted to WebP successfully`)
      }

      // Optional: Remove the original PNG file to save space
      // await fs.unlink(pngPath)

      return { success: true, downloaded: true, converted: true }
    } catch (conversionError) {
      if (CONFIG.verbose) {
        console.log(`  ${c('yellow', '⚠️')} WebP conversion failed: ${conversionError.message}`)
        console.log(`  ${c('blue', 'ℹ️')} PNG file retained: ${pngPath}`)
      }
      return { success: true, downloaded: true, converted: false, conversionError: conversionError.message }
    }
  } catch (error) {
    if (CONFIG.verbose) {
      console.log(`  ${c('red', '❌')} Error: ${error.message}`)
    }
    return { success: false, error: error.message }
  }
}

// Update progress on single line
function updateProgress(current, total, stats) {
  if (!CONFIG.verbose) {
    const percent = Math.round((current / total) * 100)
    const progressBar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2))
    const statusText = `${current}/${total} (${percent}%) | Downloaded: ${c('green', stats.downloaded)} | Failed: ${c('red', stats.failed)} | Not found: ${c('yellow', stats.notFound)}`
    process.stdout.write(`\r${c('cyan', 'Progress:')} [${progressBar}] ${statusText}`)
  }
}

// Main processing function
async function processParts(db, parts) {
  const stats = {
    total: parts.length,
    processed: 0,
    downloaded: 0,
    converted: 0,
    failed: 0,
    notFound: 0,
    errors: [],
  }

  console.log(`\n${c('cyan', '🔄 Starting image download process...')}\n`)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]

    updateProgress(i, parts.length, stats)

    const result = await processPart(part, i, parts.length)

    stats.processed++

    if (result.success) {
      if (result.downloaded) {
        stats.downloaded++
        if (result.converted) {
          stats.converted++
        }
      } else if (result.statusCode === 404) {
        stats.notFound++
      }
    } else {
      stats.failed++
      stats.errors.push(`${part.part_num}: ${result.error}`)
    }

    // Throttle requests to be respectful
    if (i < parts.length - 1 && CONFIG.delay > 0) {
      await sleep(CONFIG.delay)
    }
  }

  // Final progress update
  updateProgress(parts.length, parts.length, stats)
  if (!CONFIG.verbose) {
    console.log() // New line after progress bar
  }

  return stats
}

// Run the image availability update script
async function updateImageAvailability() {
  return new Promise((resolve, reject) => {
    console.log(`\n${c('cyan', '🔄 Updating image availability in database...')}`)

    const updateScript = spawn('node', ['scripts/maintenance/update_image_availability.js'], {
      stdio: 'inherit',
    })

    updateScript.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Update script failed with code ${code}`))
      }
    })

    updateScript.on('error', reject)
  })
}

// Main function
async function main() {
  parseArgs()

  console.log(c('cyan', '🖼️  Fetch Missing Images from BrickArchitect'))
  console.log(c('bright', '=============================================='))

  if (CONFIG.dryRun) {
    console.log(c('yellow', '🔍 DRY RUN MODE - No images will be downloaded'))
  }

  console.log(`Database: ${CONFIG.dbPath}`)
  console.log(`Images directory: ${CONFIG.imagesDir}`)
  console.log(`Base URL: ${CONFIG.baseUrl}`)
  console.log(`Request delay: ${CONFIG.delay}ms`)
  if (CONFIG.limit) {
    console.log(`Limit: ${CONFIG.limit} images`)
  }

  try {
    // Check if database exists
    try {
      await fs.access(CONFIG.dbPath)
    } catch {
      console.error(c('red', `❌ Database not found: ${CONFIG.dbPath}`))
      process.exit(1)
    }

    // Check if images directory exists, create if it doesn't
    try {
      await fs.access(CONFIG.imagesDir)
    } catch {
      console.log(c('yellow', `📁 Creating images directory: ${CONFIG.imagesDir}`))
      await fs.mkdir(CONFIG.imagesDir, { recursive: true })
    }

    // Open database connection
    const db = await openDb()

    // Get parts missing images
    const parts = await getMissingImageParts(db)
    console.log(`\nFound ${c('bright', parts.length)} parts missing images that exist on BrickArchitect`)

    if (parts.length === 0) {
      console.log(c('green', '✅ No missing images found! All parts have images.'))
      await db.close()
      return
    }

    // Show sample of parts to be processed
    if (CONFIG.verbose && parts.length > 0) {
      console.log('\nSample parts to process:')
      parts.slice(0, 5).forEach((part) => {
        console.log(`  - ${part.part_num}: ${part.name}`)
      })
      if (parts.length > 5) {
        console.log(`  ... and ${parts.length - 5} more`)
      }
    }

    // Process parts
    const startTime = Date.now()
    const stats = await processParts(db, parts)
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)

    // Close database
    await db.close()

    // Print summary
    console.log(`\n${c('cyan', 'Summary')}`)
    console.log(c('bright', '======='))
    console.log(`Total parts processed: ${stats.processed}`)
    console.log(`Images downloaded: ${c('green', stats.downloaded)}`)
    console.log(`Converted to WebP: ${c('green', stats.converted)}`)
    console.log(`Not found on server: ${c('yellow', stats.notFound)}`)
    console.log(`Failed downloads: ${c('red', stats.failed)}`)
    console.log(`Processing time: ${duration} seconds`)

    if (stats.errors.length > 0) {
      console.log(`\n${c('red', 'Errors:')}`)
      stats.errors.slice(0, 10).forEach((error) => {
        console.log(`  ${c('red', '❌')} ${error}`)
      })
      if (stats.errors.length > 10) {
        console.log(`  ... and ${stats.errors.length - 10} more errors`)
      }
    }

    // Update database with new image availability if we downloaded any images
    if (stats.downloaded > 0 && !CONFIG.dryRun) {
      try {
        await updateImageAvailability()
        console.log(c('green', '✅ Database updated with new image availability'))
      } catch (error) {
        console.log(c('yellow', `⚠️  Failed to update database: ${error.message}`))
        console.log(c('blue', 'ℹ️  You can manually run: node scripts/maintenance/update_image_availability.js'))
      }
    }

    if (CONFIG.dryRun && parts.length > 0) {
      console.log(`\n${c('cyan', '💡 Run without --dry-run to download these images')}`)
    }

    if (stats.downloaded > 0 && !CONFIG.dryRun) {
      console.log(
        `\n${c('green', '🎉 Successfully downloaded and processed')} ${stats.downloaded} ${stats.downloaded === 1 ? 'image' : 'images'}!`
      )
    }
  } catch (error) {
    console.error(c('red', '❌ Fatal error:'), error.message)
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

module.exports = { main, processPart, getMissingImageParts, CONFIG }
