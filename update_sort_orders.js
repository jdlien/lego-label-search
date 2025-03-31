/** @format */

const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')

// Database connection
async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'lego.sqlite'),
    driver: sqlite3.Database,
  })
}

async function updateSortOrders() {
  try {
    console.log('Opening database connection...')
    const db = await openDb()
    console.log('Database connection opened')

    // Get all categories
    const categories = await db.all(`
      SELECT
        id,
        name,
        CASE
          WHEN parent_id = 0 OR parent_id IS NULL THEN ''
          ELSE CAST(parent_id AS TEXT)
        END AS parent_id,
        sort_order
      FROM ba_categories
    `)

    console.log(`Fetched ${categories.length} categories`)

    // Group categories by parent_id
    const categoriesByParent = {}
    categories.forEach((cat) => {
      if (!categoriesByParent[cat.parent_id]) {
        categoriesByParent[cat.parent_id] = []
      }
      categoriesByParent[cat.parent_id].push(cat)
    })

    // For each parent, sort and update sort_order for children
    for (const [parentId, children] of Object.entries(categoriesByParent)) {
      if (parentId === '') continue // Skip top-level categories as they're already done

      console.log(`Processing ${children.length} children for parent ID: ${parentId}`)

      // Sort children by name
      children.sort((a, b) => a.name.localeCompare(b.name))

      // Update sort_order for each child
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const sortOrder = i + 1 // Start at 1

        // Only update if sort_order is different
        if (child.sort_order !== sortOrder) {
          console.log(`Updating ${child.name} (ID: ${child.id}) from ${child.sort_order} to ${sortOrder}`)

          await db.run('UPDATE ba_categories SET sort_order = ? WHERE id = ?', sortOrder, child.id)
        }
      }
    }

    console.log('Sort orders updated successfully')
  } catch (error) {
    console.error('Error updating sort orders:', error)
  }
}

// Run the function
updateSortOrders()
