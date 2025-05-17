/** @format */

const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')

// Database connection pool
let dbPromise = null

// Create a database connection
async function openDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(process.cwd(), 'data', 'lego.sqlite'),
      driver: sqlite3.Database,
    })
  }
  return dbPromise
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Category ID is required' })
  }

  try {
    const db = await openDb()

    // Get category details
    const category = await db.get('SELECT id, name, parent_id FROM ba_categories WHERE id = ?', id)

    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }

    // Count all subcategories (direct and indirect)
    const subcategories = await getAllSubcategories(db, id)

    // Return category with count of subcategories (not including self)
    return res.status(200).json({
      ...category,
      subcategories: subcategories.length - 1, // Subtract 1 to exclude the category itself
    })
  } catch (error) {
    console.error('Category info error:', error)
    return res.status(500).json({
      message: 'An error occurred while fetching category info',
      error: error.message,
    })
  }
}

// Function to get a category and all its subcategories recursively
async function getAllSubcategories(db, categoryId) {
  // Start with the requested category
  const result = [categoryId]

  // Helper function to recursively collect subcategories
  async function collectSubcategories(parentId) {
    // Find all direct subcategories of the parent
    const subcategories = await db.all('SELECT id FROM ba_categories WHERE parent_id = ?', parentId)

    // Process each subcategory
    for (const cat of subcategories) {
      result.push(cat.id)
      // Recursively collect subcategories of this category
      await collectSubcategories(cat.id)
    }
  }

  // Start the recursive collection
  await collectSubcategories(categoryId)

  return result
}
