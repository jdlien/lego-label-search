#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs').promises
const fsSync = require('fs')

const DB_PATH = path.join(__dirname, '../../data/lego.sqlite')
const IMAGES_DIR = path.join(__dirname, '../../public/data/images')

class ComputedFieldsUpdater {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH)
    this.imageFilesCache = null
  }

  // ===== CATEGORY COUNTS =====
  async updateCategoryCount(categoryId) {
    return new Promise((resolve, reject) => {
      // Get all subcategories including this one using recursive CTE
      this.db.all(
        `
        WITH RECURSIVE subcats(id) AS (
          SELECT id FROM ba_categories WHERE id = ?
          UNION ALL
          SELECT child.id FROM ba_categories child
          JOIN subcats parent ON child.parent_id = parent.id
        )
        SELECT id FROM subcats
      `,
        categoryId,
        (err, subcategories) => {
          if (err) {
            reject(err)
            return
          }

          if (subcategories.length === 0) {
            resolve(0)
            return
          }

          // Count parts in all these categories
          const placeholders = subcategories.map(() => '?').join(',')
          const categoryIds = subcategories.map((c) => c.id)

          this.db.get(
            `
          SELECT COUNT(*) as count FROM parts
          WHERE ba_cat_id IN (${placeholders})
        `,
            ...categoryIds,
            (err, result) => {
              if (err) {
                reject(err)
                return
              }

              const count = result.count

              // Update the count in the database
              this.db.run(
                `
            UPDATE ba_categories
            SET parts_count = ?
            WHERE id = ?
          `,
                count,
                categoryId,
                (err) => {
                  if (err) {
                    reject(err)
                  } else {
                    resolve(count)
                  }
                }
              )
            }
          )
        }
      )
    })
  }

  async updateAllCategoryCounts() {
    console.log('Updating category counts...')
    return new Promise((resolve, reject) => {
      // Get all category IDs
      this.db.all('SELECT id FROM ba_categories', async (err, categories) => {
        if (err) {
          reject(err)
          return
        }

        try {
          let updated = 0
          for (const category of categories) {
            const count = await this.updateCategoryCount(category.id)
            console.log(`Category ${category.id}: ${count} parts`)
            updated++
          }
          console.log(`✓ Updated counts for ${updated} categories`)
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  async updateModifiedCategoryCounts(modifiedCategoryIds = []) {
    console.log('Updating counts for modified categories...')

    if (modifiedCategoryIds.length === 0) {
      console.log('No categories to update')
      return
    }

    try {
      let updated = 0
      for (const categoryId of modifiedCategoryIds) {
        const count = await this.updateCategoryCount(categoryId)
        console.log(`Category ${categoryId}: ${count} parts`)
        updated++
      }
      console.log(`✓ Updated counts for ${updated} modified categories`)
    } catch (error) {
      console.error('Error updating modified category counts:', error)
      throw error
    }
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

            // Log progress every 1000 parts
            if (totalUpdated % 1000 === 0) {
              console.log(`Processed ${totalUpdated}/${parts.length} parts...`)
            }
          }

          console.log(`✓ Updated alternate part IDs for ${totalUpdated} parts (${partsWithAlts} parts have alternates)`)
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
                  `✓ Example design IDs updated: ${stats.parts_with_design_id}/${stats.total_parts} parts have design IDs`
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
    return new Promise((resolve, reject) => {
      // Force update all example_design_ids (useful if color preference logic changes)
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
                  `✓ All example design IDs updated: ${stats.parts_with_design_id}/${stats.total_parts} parts have design IDs`
                )
                resolve()
              }
            }
          )
        }
      )
    })
  }

  // ===== IMAGE AVAILABILITY =====
  async initializeImageCache() {
    if (this.imageFilesCache === null) {
      try {
        console.log('📁 Loading image files list...')
        const allFiles = await fs.readdir(IMAGES_DIR)
        // Filter to only image files and remove extensions for easier matching
        this.imageFilesCache = allFiles
          .filter((file) => /\.(webp|png)$/i.test(file))
          .map((file) => file.replace(/\.(webp|png)$/i, ''))
        console.log(`Found ${this.imageFilesCache.length} image files`)
      } catch (error) {
        console.error(`Error reading images directory: ${error.message}`)
        this.imageFilesCache = []
      }
    }
    return this.imageFilesCache
  }

  async checkPartImages(partId) {
    // Ensure cache is initialized
    await this.initializeImageCache()

    // Try multiple filename variations for this part
    const variations = [
      partId, // Original part ID
      partId.replace(/^0+/, ''), // Strip leading zeros
      partId.padStart(6, '0'), // Pad to 6 digits with leading zeros
    ]

    // Check if any cached image files match our part variations
    let foundFiles = []

    for (const variation of variations) {
      const matchingFiles = this.imageFilesCache.filter((baseName) => {
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
    const bestImageFile = this.selectBestImageFile(uniqueFiles, partId)

    return {
      hasAny: uniqueFiles.length > 0,
      bestImageFile,
      foundFiles: uniqueFiles,
      variations,
    }
  }

  selectBestImageFile(files, partId) {
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
      if (fsSync.existsSync(path.join(IMAGES_DIR, `${file}.webp`))) return `${file}.webp`
      if (fsSync.existsSync(path.join(IMAGES_DIR, `${file}.png`))) return `${file}.png`
    }

    // Check variants
    for (const file of variants) {
      // Prefer WebP over PNG for variants
      if (fsSync.existsSync(path.join(IMAGES_DIR, `${file}.webp`))) return `${file}.webp`
      if (fsSync.existsSync(path.join(IMAGES_DIR, `${file}.png`))) return `${file}.png`
    }

    return null
  }

  async updatePartImageStatus(partId, imgFile) {
    return new Promise((resolve, reject) => {
      const hasImg = imgFile ? 1 : 0
      this.db.run('UPDATE parts SET has_img = ?, img_file = ? WHERE part_num = ?', [hasImg, imgFile, partId], (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }

  async updateAllImageAvailability() {
    console.log('Updating image availability for all parts...')
    return new Promise((resolve, reject) => {
      this.db.all('SELECT part_num, has_img, img_file FROM parts ORDER BY part_num', async (err, parts) => {
        if (err) {
          reject(err)
          return
        }

        try {
          const stats = {
            total: parts.length,
            processed: 0,
            updated: 0,
            hasImage: 0,
            noImage: 0,
            errors: 0,
          }

          console.log(`Processing ${stats.total} parts...`)

          for (const part of parts) {
            try {
              const imageInfo = await this.checkPartImages(part.part_num)
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
                await this.updatePartImageStatus(part.part_num, newImgFile)
              }

              // Progress indicator for large batches
              if (stats.processed % 1000 === 0) {
                const progress = ((stats.processed / stats.total) * 100).toFixed(1)
                console.log(`  Progress: ${stats.processed}/${stats.total} (${progress}%)`)
              }
            } catch (error) {
              stats.errors++
              console.error(`Error processing part ${part.part_num}:`, error.message)
            }
          }

          console.log(
            `✓ Image availability updated: ${stats.updated} changes, ${stats.hasImage} with images, ${stats.noImage} without`
          )
          if (stats.errors > 0) {
            console.log(`⚠️  ${stats.errors} errors occurred during processing`)
          }
          resolve()
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  // ===== MAIN EXECUTION =====
  async run(options = {}) {
    try {
      console.log('Starting computed fields update...')

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

      // Update image availability
      if (options.imageAvailability !== false) {
        await this.updateAllImageAvailability()
      }

      console.log('✅ Computed fields updated successfully!')
    } catch (error) {
      console.error('❌ Update failed:', error)
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
  node scripts/maintenance/update_computed_fields.js --skip-category-counts --skip-alt-part-ids --skip-image-availability
`)
    process.exit(0)
  }

  updater.run(options)
}

module.exports = ComputedFieldsUpdater

// Export convenience functions for backward compatibility and cron jobs
module.exports.updateCategoryCounts = async function () {
  const updater = new ComputedFieldsUpdater()
  try {
    await updater.updateAllCategoryCounts()
    console.log('✅ Category counts updated successfully!')
  } catch (error) {
    console.error('❌ Category counts update failed:', error)
    throw error
  } finally {
    updater.db.close()
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
  const updater = new ComputedFieldsUpdater()
  try {
    await updater.updateAllImageAvailability()
    console.log('✅ Image availability updated successfully!')
  } catch (error) {
    console.error('❌ Image availability update failed:', error)
    throw error
  } finally {
    updater.db.close()
  }
}
