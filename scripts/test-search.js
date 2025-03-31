/** @format */

const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')

// Set this to the query that's failing (e.g., "30")
const TEST_QUERY = '30'

async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'lego.sqlite'),
    driver: sqlite3.Database,
  })
}

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

async function testSearch() {
  console.log(`Testing search with query: "${TEST_QUERY}"`)

  try {
    const db = await openDb()
    console.log('Database opened successfully')

    const q = TEST_QUERY
    const isShortQuery = q.length <= 2

    // Base queries
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

    const baseCountQuery = `
      SELECT COUNT(*) as total
      FROM parts p
    `

    let query, params, countQuery, countParams

    // Special handling for short queries
    if (isShortQuery) {
      query = `${baseQuery} WHERE p.part_num LIKE ? LIMIT 20`
      params = [`${q}%`]

      countQuery = `${baseCountQuery} WHERE p.part_num LIKE ?`
      countParams = [`${q}%`]
    } else {
      const searchTerm = `%${q}%`
      query = `${baseQuery} WHERE p.part_num = ?
              UNION ALL
              SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ? AND p.part_num != ?)
              UNION ALL
              SELECT * FROM (${baseQuery} WHERE (p.name LIKE ? OR p.ba_name LIKE ?) AND p.part_num NOT LIKE ?)
              LIMIT 20`
      params = [q, searchTerm, q, searchTerm, searchTerm, searchTerm]

      countQuery = `${baseCountQuery} WHERE p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?`
      countParams = [searchTerm, searchTerm, searchTerm]
    }

    console.log('Executing query:', query)
    console.log('With params:', params)

    // Execute the main query
    try {
      const results = await db.all(query, ...params)
      console.log(`Query returned ${results.length} results`)
      console.log('First few results:', results.slice(0, 2))
    } catch (err) {
      console.error('Error executing main query:', err)
    }

    // Execute the count query
    try {
      console.log('Executing count query:', countQuery)
      console.log('With params:', countParams)
      const countResult = await db.get(countQuery, ...countParams)
      console.log('Count result:', countResult)
    } catch (err) {
      console.error('Error executing count query:', err)
    }

    await db.close()
    console.log('Database closed')
  } catch (error) {
    console.error('Overall error:', error)
  }
}

testSearch().catch(console.error)
