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

    // Get the complete path from current category to root
    const path = await getCategoryPath(db, id)

    return res.status(200).json({
      id,
      path,
    })
  } catch (error) {
    console.error('Category path error:', error)
    return res.status(500).json({
      message: 'An error occurred while fetching category path',
      error: error.message,
    })
  }
}

// Function to get the path from a category to the root
async function getCategoryPath(db, categoryId) {
  const path = []
  let currentId = categoryId

  // Prevent infinite loops with a counter
  let iterations = 0
  const maxIterations = 10 // Reasonable limit for category depth

  while (currentId && iterations < maxIterations) {
    iterations++

    // Get the current category
    const category = await db.get('SELECT id, name, parent_id FROM ba_categories WHERE id = ?', currentId)

    if (!category) break

    // Add to the path (at the beginning since we're walking up)
    path.unshift({
      id: category.id,
      name: category.name,
    })

    // Move to parent
    currentId = category.parent_id || null
  }

  return path
}
