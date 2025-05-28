#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')
const { spawn } = require('child_process')
const updateImageAvailabilityScript = require('../update_image_availability.js')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/lego.sqlite')
const IMAGES_DIR = path.join(__dirname, '../../public/data/images')

// ANSI color codes for better output formatting
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
}

const c = (color, text) => `${colors[color]}${text}${colors.reset}`

class ComputedFieldsUpdater {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH)
  }

  // ===== CATEGORY COUNTS =====
  async updateAllCategoryCounts() {
    console.log('Updating category counts...')
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'update_ba_category_counts.js')
      const child = spawn('node', [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'], // Capture output so we can format it
        cwd: path.dirname(scriptPath),
      })

      let currentCategory = ''
      let totalCategories = 0
      let processedCategories = 0

      // Parse output to show cleaner progress
      child.stdout.on('data', (data) => {
        const output = data.toString()
        const lines = output.split('\n')

        lines.forEach((line) => {
          if (line.includes('Category ') && line.includes(' parts')) {
            processedCategories++
            const match = line.match(/Category \d+ "([^"]+)".*?(\d+) parts/)
            if (match) {
              currentCategory = match[1]
              const partCount = match[2]
              process.stdout.write(
                `\r\x1b[K   ${c('dim', `Processing category ${processedCategories}/193:`)} ${c('cyan', currentCategory)} ${c('bright', partCount)} parts `
              )
            }
          } else if (line.includes('categories processed')) {
            // Extract total from progress messages like "Progress: 50/193 categories processed..."
            const progressMatch = line.match(/Progress: \d+\/(\d+)/)
            if (progressMatch) {
              totalCategories = parseInt(progressMatch[1])
            }
          }
        })
      })

      child.stderr.on('data', (data) => {
        // Still show errors
        console.error(data.toString())
      })

      child.on('close', (code) => {
        // Move to next line when done
        process.stdout.write('\n')

        if (code === 0) {
          console.log(`${c('green', '✓')} Category counts updated successfully`)
          resolve()
        } else {
          reject(new Error(`Category count update script exited with code ${code}`))
        }
      })

      child.on('error', (error) => {
        reject(new Error(`Failed to run category count update script: ${error.message}`))
      })
    })
  }

  async updateModifiedCategoryCounts(modifiedCategoryIds = []) {
    console.log('Updating modified category counts...')

    if (modifiedCategoryIds.length === 0) {
      console.log('No categories to update')
      return
    }

    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'update_ba_category_counts.js')
      const args = ['--categories', modifiedCategoryIds.join(',')]
      const child = spawn('node', [scriptPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'], // Capture output so we can format it
        cwd: path.dirname(scriptPath),
      })

      let processedCategories = 0

      // Parse output to show cleaner progress
      child.stdout.on('data', (data) => {
        const output = data.toString()
        const lines = output.split('\n')

        lines.forEach((line) => {
          if (line.includes('Category ') && line.includes(' parts')) {
            processedCategories++
            const match = line.match(/Category \d+ "([^"]+)".*?(\d+) parts/)
            if (match) {
              const currentCategory = match[1]
              const partCount = match[2]
              process.stdout.write(
                `\r\x1b[K   ${c('dim', `Processing category ${processedCategories}/${modifiedCategoryIds.length}:`)} ${c('cyan', currentCategory)} ${c('bright', partCount)} parts `
              )
            }
          }
        })
      })

      child.stderr.on('data', (data) => {
        // Still show errors
        console.error(data.toString())
      })

      child.on('close', (code) => {
        // Move to next line when done
        process.stdout.write('\n')

        if (code === 0) {
          console.log(`${c('green', '✓')} Modified category counts updated successfully`)
          resolve()
        } else {
          reject(new Error(`Category count update script exited with code ${code}`))
        }
      })

      child.on('error', (error) => {
        reject(new Error(`Failed to run category count update script: ${error.message}`))
      })
    })
  }

  // ===== ALTERNATE PART IDS =====
  async getAlternatePartIds(partNum) {
    return new Promise((resolve, reject) => {
      // Get all alternate part numbers using the same query from the API
      const alternateIdsQuery = `
        SELECT child_part_num AS alt_id
        FROM part_relationships
        WHERE rel_type IN ('M', 'R', 'T')
        AND parent_part_num = ?

        UNION

        SELECT parent_part_num AS alt_id
        FROM part_relationships
        WHERE rel_type IN ('M', 'R', 'T')
        AND child_part_num = ?
      `

      this.db.all(alternateIdsQuery, [partNum, partNum], (err, alternateIds) => {
        if (err) {
          reject(err)
          return
        }

        // Filter out the current part ID
        const altIds = alternateIds.map((item) => item.alt_id).filter((altId) => altId !== partNum)
        resolve(altIds)
      })
    })
  }

  async updateAltPartIds(partNum) {
    // Get alternate part IDs for this part
    const altIds = await this.getAlternatePartIds(partNum)

    // Convert array to comma-separated string or null if empty
    const altIdsStr = altIds.length > 0 ? altIds.join(',') : null

    return new Promise((resolve, reject) => {
      // Update the alt_part_ids field in the database
      this.db.run(
        `
        UPDATE parts
        SET alt_part_ids = ?
        WHERE part_num = ?
      `,
        altIdsStr,
        partNum,
        (err) => {
          if (err) {
            reject(err)
          } else {
            resolve(altIds.length)
          }
        }
      )
    })
  }

  async updateAllAltPartIds() {
    console.log('Updating alternate part IDs for all parts...')
    return new Promise((resolve, reject) => {
      this.db.all('SELECT part_num FROM parts', async (err, parts) => {
        if (err) {
          reject(err)
          return
        }

        try {
          let totalUpdated = 0
          let partsWithAlts = 0

          for (const part of parts) {
            const count = await this.updateAltPartIds(part.part_num)
            if (count > 0) {
              partsWithAlts++
            }
            totalUpdated++

            // Update progress on same line every 1000 parts
            if (totalUpdated % 1000 === 0 || totalUpdated === parts.length) {
              const percentage = Math.round((totalUpdated / parts.length) * 100)
              process.stdout.write(
                `\r\x1b[K   ${c('dim', 'Processing alternate part IDs:')} ${c('cyan', totalUpdated.toLocaleString())}${c('dim', '/')}${c('bright', parts.length.toLocaleString())} ${c('dim', `(${percentage}%)`)} `
              )
            }
          }

          // Move to next line when done
          process.stdout.write('\n')

          console.log(
            `${c('green', '✓')} Updated alternate part IDs for ${c('bright', totalUpdated.toLocaleString())} parts (${c('cyan', partsWithAlts.toLocaleString())} parts have alternates)`
          )
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  // ===== EXAMPLE DESIGN IDS =====
  async updateExampleDesignIds() {
    console.log('Updating example design IDs...')
    return new Promise((resolve, reject) => {
      // Update parts that don't have an example_design_id yet or need refreshing
      this.db.run(
        `
        UPDATE parts
        SET example_design_id = (
            SELECT design_id
            FROM elements
            WHERE elements.part_num = parts.part_num
            ORDER BY
                CASE color_id
                    WHEN 15 THEN 1   -- White
                    WHEN 71 THEN 2   -- Light Bluish Gray
                    WHEN 72 THEN 3   -- Dark Bluish Gray
                    WHEN 0  THEN 4   -- Black
                    ELSE 5           -- Others
                END
            LIMIT 1
        )
        WHERE example_design_id IS NULL
      `,
        (err) => {
          if (err) {
            reject(err)
            return
          }

          // Get statistics
          this.db.get(
            `
            SELECT
                COUNT(*) as total_parts,
                COUNT(example_design_id) as parts_with_design_id,
                COUNT(*) - COUNT(example_design_id) as parts_without_design_id
            FROM parts
          `,
            (err, stats) => {
              if (err) {
                reject(err)
              } else {
                console.log(
                  `${c('green', '✓')} Example design IDs updated: ${c('bright', stats.parts_with_design_id.toLocaleString())}/${c('bright', stats.total_parts.toLocaleString())} parts have design IDs`
                )
                resolve()
              }
            }
          )
        }
      )
    })
  }

  async forceUpdateAllExampleDesignIds() {
    console.log('Force updating ALL example design IDs...')
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      // Force update all example_design_ids using optimized JOIN-based query
      // This completely avoids correlated subqueries and should be much faster with indexes
      this.db.run(
        `
        UPDATE parts
        SET example_design_id = (
          SELECT design_id
          FROM (
            SELECT
              part_num,
              design_id,
              ROW_NUMBER() OVER (
                PARTITION BY part_num
                ORDER BY
                  CASE color_id
                    WHEN 15 THEN 1   -- White
                    WHEN 71 THEN 2   -- Light Bluish Gray
                    WHEN 72 THEN 3   -- Dark Bluish Gray
                    WHEN 0  THEN 4   -- Black
                    ELSE 5           -- Others
                  END,
                  design_id
              ) as rn
            FROM elements
          ) ranked_elements
          WHERE ranked_elements.part_num = parts.part_num
            AND ranked_elements.rn = 1
        )
        WHERE EXISTS (
          SELECT 1 FROM elements WHERE elements.part_num = parts.part_num
        )
      `,
        (err) => {
          if (err) {
            reject(err)
            return
          }

          // Get statistics
          this.db.get(
            `
            SELECT
                COUNT(*) as total_parts,
                COUNT(example_design_id) as parts_with_design_id,
                COUNT(*) - COUNT(example_design_id) as parts_without_design_id
            FROM parts
          `,
            (err, stats) => {
              if (err) {
                reject(err)
              } else {
                const duration = ((Date.now() - startTime) / 1000).toFixed(1)
                console.log(
                  `${c('green', '✓')} All example design IDs updated: ${c('bright', stats.parts_with_design_id.toLocaleString())}/${c('bright', stats.total_parts.toLocaleString())} parts have design IDs in ${c('cyan', duration + 's')}`
                )
                resolve()
              }
            }
          )
        }
      )
    })
  }

  // ===== CATEGORY SORT ORDER =====
  // Sort order is now generated directly from BrickArchitect data during fetch_ba_data.js
  // No longer needs to be updated as a computed field

  // ===== MAIN EXECUTION =====
  async run(options = {}) {
    try {
      console.log('Starting computed fields update...')

      // Category sort order is now set directly from BrickArchitect data during import

      // Handle specific category updates
      if (options.modifiedCategories && options.modifiedCategories.length > 0) {
        await this.updateModifiedCategoryCounts(options.modifiedCategories)
      } else if (options.categoryCounts !== false) {
        await this.updateAllCategoryCounts()
      }

      // Update alternate part IDs
      if (options.altPartIds !== false) {
        await this.updateAllAltPartIds()
      }

      // Update example design IDs
      if (options.exampleDesignIds !== false) {
        if (options.forceExampleDesignIds) {
          await this.forceUpdateAllExampleDesignIds()
        } else {
          await this.updateExampleDesignIds()
        }
      }

      // Update image availability using the more sophisticated script
      if (options.imageAvailability !== false) {
        console.log()
        await updateImageAvailabilityScript.main()
      }

      console.log(c('green', '✓ Computed fields updated successfully!'))
    } catch (error) {
      console.error(c('red', '❌ Update failed:'), error)
      process.exit(1)
    } finally {
      this.db.close()
    }
  }
}

// Run updater if this script is executed directly
if (require.main === module) {
  const updater = new ComputedFieldsUpdater()

  // Parse command line arguments
  const args = process.argv.slice(2)
  const options = {}

  if (args.includes('--categories')) {
    const categoryIndex = args.indexOf('--categories')
    if (categoryIndex !== -1 && args[categoryIndex + 1]) {
      options.modifiedCategories = args[categoryIndex + 1].split(',').map((id) => parseInt(id.trim()))
    }
  }

  if (args.includes('--skip-category-counts')) {
    options.categoryCounts = false
  }

  if (args.includes('--skip-alt-part-ids')) {
    options.altPartIds = false
  }

  if (args.includes('--skip-example-design-ids')) {
    options.exampleDesignIds = false
  }

  if (args.includes('--force-example-design-ids')) {
    options.forceExampleDesignIds = true
  }

  if (args.includes('--skip-image-availability')) {
    options.imageAvailability = false
  }

  if (args.includes('--help')) {
    console.log(`
Usage: node scripts/maintenance/update_computed_fields.js [options]

Options:
  --categories <ids>           Update only specific category IDs (comma-separated)
  --skip-category-sort-order   Skip updating category sort order
  --skip-category-counts       Skip updating category counts
  --skip-alt-part-ids         Skip updating alternate part IDs
  --skip-example-design-ids   Skip updating example design IDs
  --force-example-design-ids  Force update all example design IDs
  --skip-image-availability   Skip updating image availability
  --help                      Show this help message

Examples:
  # Update all computed fields
  node scripts/maintenance/update_computed_fields.js

  # Update only specific categories
  node scripts/maintenance/update_computed_fields.js --categories 1,2,3

  # Skip image availability update (faster)
  node scripts/maintenance/update_computed_fields.js --skip-image-availability

  # Only update example design IDs
  node scripts/maintenance/update_computed_fields.js --skip-category-sort-order --skip-category-counts --skip-alt-part-ids --skip-image-availability
`)
    process.exit(0)
  }

  updater.run(options)
}

module.exports = ComputedFieldsUpdater

// Export convenience functions for backward compatibility and cron jobs
module.exports.updateCategoryCounts = async function () {
  try {
    const BaCategoryCountUpdater = require('./update_ba_category_counts')
    const updater = new BaCategoryCountUpdater()
    await updater.updateAllCategoryCounts()
    updater.close()
    console.log('✅ Category counts updated successfully!')
  } catch (error) {
    console.error('❌ Category counts update failed:', error)
    throw error
  }
}

module.exports.updateAltPartIds = async function () {
  const updater = new ComputedFieldsUpdater()
  try {
    await updater.updateAllAltPartIds()
    console.log('✅ Alternate part IDs updated successfully!')
  } catch (error) {
    console.error('❌ Alternate part IDs update failed:', error)
    throw error
  } finally {
    updater.db.close()
  }
}

module.exports.updateImageAvailability = async function () {
  try {
    await require('../update_image_availability.js').main()
    console.log('✅ Image availability updated successfully!')
  } catch (error) {
    console.error('❌ Image availability update failed:', error)
    throw error
  }
}
