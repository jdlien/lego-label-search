#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const DB_PATH = path.join(__dirname, '../../data/lego.sqlite')

class ComputedFieldsUpdater {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH)
  }

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

  async run(options = {}) {
    try {
      console.log('Starting computed fields update...')

      if (options.modifiedCategories && options.modifiedCategories.length > 0) {
        await this.updateModifiedCategoryCounts(options.modifiedCategories)
      } else {
        await this.updateAllCategoryCounts()
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

  updater.run(options)
}

module.exports = ComputedFieldsUpdater
