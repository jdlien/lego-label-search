/** @format */

const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const { updateCategoryCount } = require('../../../scripts/update_category_counts')
const { getParentCategoryChain } = require('../../../scripts/category-utils')

// Database connection
async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'lego.sqlite'),
    driver: sqlite3.Database,
  })
}

export default async function handler(req, res) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the part number from query parameters
    const { part_num } = req.query

    if (!part_num) {
      return res.status(400).json({ error: 'Part number is required' })
    }

    const db = await openDb()

    // Check if the part exists and get its category
    const part = await db.get('SELECT ba_cat_id FROM parts WHERE part_num = ?', part_num)

    if (!part) {
      return res.status(404).json({ error: 'Part not found' })
    }

    // Delete the part
    await db.run('DELETE FROM parts WHERE part_num = ?', part_num)

    // Update category counts for the affected category and its parents
    console.log(`Updating count for category ${part.ba_cat_id} and its parents after deletion`)

    // Update the affected category
    await updateCategoryCount(db, part.ba_cat_id)

    // Update all parent categories
    const parentCategories = await getParentCategoryChain(db, part.ba_cat_id)
    for (const parentId of parentCategories) {
      await updateCategoryCount(db, parentId)
    }

    // Return success
    return res.status(200).json({
      message: 'Part deleted successfully',
      part_num,
    })
  } catch (error) {
    console.error('Error deleting part:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    })
  }
}
