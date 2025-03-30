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
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the part ID from the query
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Part ID is required' })
    }

    const db = await openDb()

    // Find the part in the database
    const query = `
      SELECT p.part_num as id, p.name, p.part_cat_id as category_id,
             p.part_material, p.label_file, p.ba_cat_id, p.ba_name,
             c.name as category_name,
             bc.name as ba_category_name
      FROM parts p
      LEFT JOIN part_categories c ON p.part_cat_id = c.id
      LEFT JOIN ba_categories bc ON p.ba_cat_id = bc.id
      WHERE p.part_num = ?
    `

    const part = await db.get(query, id)

    if (!part) {
      return res.status(404).json({ error: 'Part not found' })
    }

    // Return the part details
    return res.status(200).json(part)
  } catch (error) {
    console.error('Error retrieving part:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
