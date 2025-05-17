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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the part data from request body
    const {
      part_num,
      name,
      ba_cat_id,
      part_cat_id = null,
      part_material = null,
      label_file = null,
      ba_name = null,
    } = req.body

    // Validate required fields
    if (!part_num || !name) {
      return res.status(400).json({ error: 'Part number and name are required' })
    }

    // ba_cat_id is required to properly categorize the part
    if (!ba_cat_id) {
      return res.status(400).json({ error: 'Category ID (ba_cat_id) is required' })
    }

    const db = await openDb()

    // Check if part already exists
    const existingPart = await db.get('SELECT part_num FROM parts WHERE part_num = ?', part_num)
    if (existingPart) {
      return res.status(409).json({ error: 'Part already exists' })
    }

    // Check if the category exists
    const categoryExists = await db.get('SELECT id FROM ba_categories WHERE id = ?', ba_cat_id)
    if (!categoryExists) {
      return res.status(400).json({ error: 'Category does not exist' })
    }

    // Insert the new part
    await db.run(
      `INSERT INTO parts (part_num, name, part_cat_id, part_material, label_file, ba_cat_id, ba_name)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      part_num,
      name,
      part_cat_id,
      part_material,
      label_file,
      ba_cat_id,
      ba_name || name // Use ba_name if provided, otherwise use name
    )

    // Update category counts
    console.log(`Updating count for category ${ba_cat_id} and its parents`)

    // Update the category
    await updateCategoryCount(db, ba_cat_id)

    // Update all parent categories
    const parentCategories = await getParentCategoryChain(db, ba_cat_id)
    for (const parentId of parentCategories) {
      await updateCategoryCount(db, parentId)
    }

    // Return success
    return res.status(201).json({
      message: 'Part created successfully',
      part_num,
    })
  } catch (error) {
    console.error('Error creating part:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    })
  }
}
