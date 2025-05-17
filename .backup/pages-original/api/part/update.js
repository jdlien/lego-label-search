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
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the part data from request body
    const { part_num, name, ba_cat_id } = req.body

    if (!part_num) {
      return res.status(400).json({ error: 'Part number is required' })
    }

    const db = await openDb()

    // Find the current part to check for category changes
    const currentPart = await db.get('SELECT ba_cat_id FROM parts WHERE part_num = ?', part_num)

    // If part doesn't exist, return error
    if (!currentPart) {
      return res.status(404).json({ error: 'Part not found' })
    }

    // Build the update query based on provided fields
    let updateFields = []
    let params = []

    if (name) {
      updateFields.push('name = ?')
      params.push(name)
    }

    if (ba_cat_id) {
      updateFields.push('ba_cat_id = ?')
      params.push(ba_cat_id)
    }

    // If no fields to update, return early
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update provided' })
    }

    // Add part_num to params for the WHERE clause
    params.push(part_num)

    // Update the part
    await db.run(`UPDATE parts SET ${updateFields.join(', ')} WHERE part_num = ?`, ...params)

    // If category has changed, update counts for both old and new categories
    if (ba_cat_id && currentPart.ba_cat_id !== ba_cat_id) {
      // Get the parent categories that need to be updated
      const oldParentCategories = await getParentCategoryChain(db, currentPart.ba_cat_id)
      const newParentCategories = await getParentCategoryChain(db, ba_cat_id)

      // Update the old category and its parents
      console.log(`Updating counts for old category ${currentPart.ba_cat_id} and its parents`)
      await updateCategoryCount(db, currentPart.ba_cat_id)
      for (const parentId of oldParentCategories) {
        await updateCategoryCount(db, parentId)
      }

      // Update the new category and its parents
      console.log(`Updating counts for new category ${ba_cat_id} and its parents`)
      await updateCategoryCount(db, ba_cat_id)
      for (const parentId of newParentCategories) {
        await updateCategoryCount(db, parentId)
      }
    }

    // Return success
    return res.status(200).json({
      message: 'Part updated successfully',
      part_num,
    })
  } catch (error) {
    console.error('Error updating part:', error)
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    })
  }
}
