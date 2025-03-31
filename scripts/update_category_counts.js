/** @format */
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const { getParentCategoryChain } = require('./category-utils')

async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'lego.sqlite'),
    driver: sqlite3.Database,
  })
}

async function addPartsCountColumn(db) {
  console.log("Adding parts_count column to ba_categories table if it doesn't exist...")
  await db
    .run(
      `
    ALTER TABLE ba_categories
    ADD COLUMN parts_count INTEGER DEFAULT 0
  `
    )
    .catch((err) => {
      // Column might already exist, which is fine
      if (!err.message.includes('duplicate column')) {
        throw err
      }
    })
  console.log('Column added or already exists')
}

async function getAllCategoryIds(db) {
  console.log('Getting all category IDs...')
  const categories = await db.all('SELECT id FROM ba_categories')
  return categories.map((c) => c.id)
}

async function getChildCategories(db, categoryId) {
  // Get all child categories using recursive CTE
  const children = await db.all(
    `
    WITH RECURSIVE subcats(id) AS (
      SELECT id FROM ba_categories WHERE id = ?
      UNION ALL
      SELECT child.id FROM ba_categories child
      JOIN subcats parent ON child.parent_id = parent.id
    )
    SELECT id FROM subcats
  `,
    categoryId
  )

  return children.map((c) => c.id)
}

async function countPartsForCategories(db, categoryIds) {
  if (categoryIds.length === 0) return 0

  // Use placeholders for all category IDs
  const placeholders = categoryIds.map(() => '?').join(',')

  const result = await db.get(
    `
    SELECT COUNT(*) as count FROM parts
    WHERE ba_cat_id IN (${placeholders})
  `,
    ...categoryIds
  )

  return result.count
}

async function updateCategoryCount(db, categoryId) {
  console.log(`Updating count for category ${categoryId}...`)

  // Get all subcategories including this one
  const allCategories = await getChildCategories(db, categoryId)

  // Count parts in all these categories
  const count = await countPartsForCategories(db, allCategories)

  // Update the count in the database
  await db.run(
    `
    UPDATE ba_categories
    SET parts_count = ?
    WHERE id = ?
  `,
    count,
    categoryId
  )

  return count
}

async function updateAllCategoryCounts(db) {
  console.log('Updating counts for all categories...')
  const categoryIds = await getAllCategoryIds(db)

  let totalUpdated = 0
  for (const categoryId of categoryIds) {
    const count = await updateCategoryCount(db, categoryId)
    console.log(`Category ${categoryId}: ${count} parts`)
    totalUpdated++
  }

  console.log(`Updated counts for ${totalUpdated} categories`)
}

async function createIndexes(db) {
  console.log('Creating indexes for better performance...')

  // Add index on ba_cat_id in the parts table
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_parts_ba_cat_id ON parts(ba_cat_id)
  `)

  // Add index on parent_id in the ba_categories table for hierarchical lookups
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_ba_categories_parent_id ON ba_categories(parent_id)
  `)

  console.log('Indexes created')
}

// Export functions for use in API routes
module.exports = {
  openDb,
  updateCategoryCount,
  getChildCategories,
  updateAllCategoryCounts,
}

// Only run the script if it's executed directly
if (require.main === module) {
  async function main() {
    try {
      const db = await openDb()
      console.log('Database opened')

      await addPartsCountColumn(db)
      await createIndexes(db)
      await updateAllCategoryCounts(db)

      console.log('All category counts updated successfully!')
    } catch (error) {
      console.error('Error updating category counts:', error)
    }
  }

  // Run the main function
  main()
}
