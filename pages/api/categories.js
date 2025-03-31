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

  try {
    console.log('Opening database connection...')
    const db = await openDb()
    console.log('Database connection opened')

    // Get all categories from the ba_categories table
    // Cast parent_id to TEXT to handle empty values properly
    console.log('Fetching categories from ba_categories table...')
    const categories = await db.all(`
      SELECT
        id,
        name,
        CASE
          WHEN parent_id = 0 OR parent_id IS NULL THEN ''
          ELSE CAST(parent_id AS TEXT)
        END AS parent_id
      FROM ba_categories
      ORDER BY name
    `)
    console.log(`Fetched ${categories.length} categories`)

    // Return all categories
    return res.status(200).json({
      categories,
      total: categories.length,
    })
  } catch (error) {
    console.error('Categories error:', error)
    // Return more detailed error information
    return res.status(500).json({
      message: 'An error occurred while fetching categories',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    })
  }
}
