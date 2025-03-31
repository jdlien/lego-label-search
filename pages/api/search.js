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

  // Change default limit to a large number (10000) to effectively remove the limit for most use cases
  const { q, category, limit = 10000 } = req.query

  try {
    const db = await openDb()

    // Handle empty query
    if (!q && !category) {
      return res.status(400).json({
        message: 'Please provide a search query or category filter',
      })
    }

    let results = []
    let query = ''
    let params = []
    let countQuery = ''
    let countParams = []
    let categoryIds = []

    // If category is provided, get all subcategories
    if (category) {
      categoryIds = await getAllSubcategories(db, category)
    }

    // Base query to select parts with category information
    const baseQuery = `
      SELECT p.part_num as id, p.name, p.part_cat_id as category_id,
             p.part_material, p.label_file, p.ba_cat_id, p.ba_name,
             c.name as category_name, b.name as ba_category_name,
             parent.id as parent_cat_id, parent.name as parent_category,
             grandparent.id as grandparent_cat_id, grandparent.name as grandparent_category
      FROM parts p
      LEFT JOIN part_categories c ON p.part_cat_id = c.id
      LEFT JOIN ba_categories b ON p.ba_cat_id = b.id
      LEFT JOIN ba_categories parent ON b.parent_id = parent.id
      LEFT JOIN ba_categories grandparent ON parent.parent_id = grandparent.id
    `

    // Base query for count - use estimated count for faster performance
    const baseCountQuery = `
      SELECT COUNT(*) as total
      FROM parts p
    `

    if (q) {
      const searchTerm = `%${q}%`
      // Optimize for auto-search - first check exact matches by part number for faster results
      if (!category) {
        query = `${baseQuery} WHERE p.part_num = ?
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ? AND p.part_num != ?)
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE (p.name LIKE ? OR p.ba_name LIKE ?) AND p.part_num NOT LIKE ?)
                `
        params = [q, searchTerm, q, searchTerm, searchTerm, searchTerm]

        countQuery = `${baseCountQuery} WHERE p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?`
        countParams = [searchTerm, searchTerm, searchTerm]
      } else {
        // Add category filter with subcategories
        if (categoryIds.length === 1) {
          // If only one category, use simple WHERE clause
          query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?) AND p.ba_cat_id = ?`
          params = [q, searchTerm, searchTerm, searchTerm, categoryIds[0]]

          countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?) AND p.ba_cat_id = ?`
          countParams = [searchTerm, searchTerm, searchTerm, categoryIds[0]]
        } else {
          // If multiple categories (parent + children), use IN clause
          const placeholders = categoryIds.map(() => '?').join(',')

          query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?) AND p.ba_cat_id IN (${placeholders})`
          params = [q, searchTerm, searchTerm, searchTerm, ...categoryIds]

          countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?) AND p.ba_cat_id IN (${placeholders})`
          countParams = [searchTerm, searchTerm, searchTerm, ...categoryIds]
        }
      }
    } else if (category) {
      // Only filter by category and its subcategories
      if (categoryIds.length === 1) {
        // If only one category, use simple WHERE clause
        query = `${baseQuery} WHERE p.ba_cat_id = ?`
        params = [categoryIds[0]]

        countQuery = `${baseCountQuery} WHERE p.ba_cat_id = ?`
        countParams = [categoryIds[0]]
      } else {
        // If multiple categories (parent + children), use IN clause
        const placeholders = categoryIds.map(() => '?').join(',')

        query = `${baseQuery} WHERE p.ba_cat_id IN (${placeholders})`
        params = [...categoryIds]

        countQuery = `${baseCountQuery} WHERE p.ba_cat_id IN (${placeholders})`
        countParams = [...categoryIds]
      }
    }

    // Add limit if specified
    if (limit) {
      query += ` LIMIT ?`
      params.push(parseInt(limit, 10))
    }

    // Execute query
    results = await db.all(query, ...params)

    // Get total count
    const countResult = await db.get(countQuery, ...countParams)
    const total = countResult ? countResult.total : 0

    return res.status(200).json({
      results,
      total,
      returned: results.length,
      categories: categoryIds,
    })
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({
      message: 'An error occurred during search',
      error: error.message,
    })
  }
}

// Function to get a category and all its subcategories recursively
async function getAllSubcategories(db, categoryId) {
  // Using a single efficient query with recursive Common Table Expression (CTE)
  // This gets the category itself and all of its subcategories at any level of depth
  const results = await db.all(
    `
    WITH RECURSIVE subcategories AS (
      SELECT id FROM ba_categories WHERE id = ?
      UNION ALL
      SELECT c.id FROM ba_categories c JOIN subcategories sc ON c.parent_id = sc.id
    )
    SELECT id FROM subcategories
  `,
    categoryId
  )

  return results.map((row) => row.id)
}
