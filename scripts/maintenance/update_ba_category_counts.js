#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/lego.sqlite')

class BaCategoryCountUpdater {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH)
  }

  /**
   * Get all subcategory IDs for a given category (including the category itself)
   * Uses recursive CTE to find all descendants
   */
  async getSubcategoryIds(categoryId) {
    return new Promise((resolve, reject) => {
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
          } else {
            resolve(subcategories.map((c) => c.id))
          }
        }
      )
    })
  }

  /**
   * Count parts for a specific category (including all subcategories)
   */
  async updateCategoryCount(categoryId) {
    try {
      // Get all subcategory IDs including this one
      const subcategoryIds = await this.getSubcategoryIds(categoryId)

      if (subcategoryIds.length === 0) {
        return 0
      }

      // Count parts in all these categories
      const placeholders = subcategoryIds.map(() => '?').join(',')

      return new Promise((resolve, reject) => {
        this.db.get(
          `
          SELECT COUNT(*) as count FROM parts
          WHERE ba_cat_id IN (${placeholders})
        `,
          ...subcategoryIds,
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
      })
    } catch (error) {
      throw error
    }
  }

  /**
   * Update counts for all categories
   */
  async updateAllCategoryCounts() {
    console.log('Updating category counts...')
    return new Promise((resolve, reject) => {
      // Get all category IDs
      this.db.all('SELECT id, name, level FROM ba_categories ORDER BY sort_order', async (err, categories) => {
        if (err) {
          reject(err)
          return
        }

        try {
          let updated = 0
          let nonZeroCounts = 0

          for (const category of categories) {
            const count = await this.updateCategoryCount(category.id)
            if (count > 0) {
              nonZeroCounts++
              console.log(`Category ${category.id} "${category.name}" (Level ${category.level}): ${count} parts`)
            }
            updated++

            // Progress indicator for large datasets
            if (updated % 50 === 0) {
              console.log(`Progress: ${updated}/${categories.length} categories processed...`)
            }
          }

          console.log(`\n✓ Updated counts for ${updated} categories`)
          console.log(`✓ ${nonZeroCounts} categories have parts (including subcategories)`)
          resolve({ total: updated, nonZero: nonZeroCounts })
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * Update counts for specific categories only
   */
  async updateSpecificCategoryCounts(categoryIds) {
    console.log(`Updating counts for ${categoryIds.length} specific categories...`)

    try {
      let updated = 0
      for (const categoryId of categoryIds) {
        const count = await this.updateCategoryCount(categoryId)
        console.log(`Category ${categoryId}: ${count} parts`)
        updated++
      }
      console.log(`✓ Updated counts for ${updated} categories`)
      return updated
    } catch (error) {
      console.error('Error updating category counts:', error)
      throw error
    }
  }

  /**
   * Get statistics about category counts
   */
  async getCountStatistics() {
    return new Promise((resolve, reject) => {
      this.db.all(
        `
        SELECT 
          level,
          COUNT(*) as total_categories,
          COUNT(CASE WHEN parts_count > 0 THEN 1 END) as categories_with_parts,
          SUM(parts_count) as total_parts
        FROM ba_categories
        GROUP BY level
        ORDER BY level
      `,
        (err, stats) => {
          if (err) {
            reject(err)
          } else {
            resolve(stats)
          }
        }
      )
    })
  }

  /**
   * Close database connection
   */
  close() {
    this.db.close()
  }
}

// Main execution when run directly
if (require.main === module) {
  const updater = new BaCategoryCountUpdater()

  // Parse command line arguments
  const args = process.argv.slice(2)
  const showHelp = args.includes('--help') || args.includes('-h')
  const showStats = args.includes('--stats')
  const categoryIds = []

  // Parse specific category IDs if provided
  const categoryIndex = args.indexOf('--categories')
  if (categoryIndex !== -1 && args[categoryIndex + 1]) {
    const ids = args[categoryIndex + 1].split(',').map((id) => parseInt(id.trim()))
    categoryIds.push(...ids.filter((id) => !isNaN(id)))
  }

  if (showHelp) {
    console.log(`
BrickArchitect Category Count Updater

Updates the parts_count field for categories in the ba_categories table.
The count includes parts from all subcategories (recursive).

Usage: node scripts/maintenance/update_ba_category_counts.js [options]

Options:
  --categories <ids>   Update only specific category IDs (comma-separated)
  --stats             Show category count statistics
  --help, -h          Show this help message

Examples:
  # Update all categories
  node scripts/maintenance/update_ba_category_counts.js

  # Update specific categories
  node scripts/maintenance/update_ba_category_counts.js --categories 1,2,3

  # Show statistics
  node scripts/maintenance/update_ba_category_counts.js --stats

Note: Many categories legitimately have 0 parts. The count includes parts
from all subcategories, so parent categories show the total of all their
children.
`)
    process.exit(0)
  }

  async function run() {
    try {
      if (showStats) {
        const stats = await updater.getCountStatistics()
        console.log('\nCategory Count Statistics:')
        console.log('==========================')
        stats.forEach((stat) => {
          console.log(
            `Level ${stat.level}: ${stat.categories_with_parts}/${stat.total_categories} categories have parts (${stat.total_parts} total parts)`
          )
        })
      } else if (categoryIds.length > 0) {
        await updater.updateSpecificCategoryCounts(categoryIds)
      } else {
        await updater.updateAllCategoryCounts()
      }

      console.log('\n✅ Category count update completed successfully!')
    } catch (error) {
      console.error('❌ Update failed:', error)
      process.exit(1)
    } finally {
      updater.close()
    }
  }

  run()
}

module.exports = BaCategoryCountUpdater