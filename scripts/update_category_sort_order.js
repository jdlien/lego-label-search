const sqlite3 = require('sqlite3').verbose()
const path = require('path')

// Database path
const dbPath = path.join(__dirname, '..', 'data', 'lego.sqlite')

// Helper function to extract numeric prefix from category name
function extractNumericPrefix(name) {
  const match = name.match(/^(\d+)\./)
  return match ? parseInt(match[1]) : 999 // Put categories without numeric prefix at the end
}

// Helper function to build category hierarchy and perform depth-first traversal
function buildHierarchyAndSort(categories) {
  const categoryMap = new Map()
  const childrenMap = new Map()
  const rootCategories = []

  // Build maps for quick lookup
  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat)
    if (!cat.parent_id) {
      rootCategories.push(cat)
    } else {
      if (!childrenMap.has(cat.parent_id)) {
        childrenMap.set(cat.parent_id, [])
      }
      childrenMap.get(cat.parent_id).push(cat)
    }
  })

  // Sort root categories by their numeric prefix
  rootCategories.sort((a, b) => {
    const numA = extractNumericPrefix(a.name)
    const numB = extractNumericPrefix(b.name)
    if (numA !== numB) return numA - numB
    return a.name.localeCompare(b.name)
  })

  // Depth-first traversal to assign sort orders
  const sortedCategories = []
  let currentSortOrder = 1

  function traverseDepthFirst(categoryId, level = 0) {
    const category = categoryMap.get(categoryId)
    if (!category) return

    // Assign sort order and level to this category
    category.sort_order = currentSortOrder++
    category.level = level
    sortedCategories.push(category)

    console.log(`${'  '.repeat(level)}${category.sort_order}: ${category.name} (ID: ${category.id}, Level: ${level})`)

    // Get children and sort them alphabetically
    const children = childrenMap.get(categoryId) || []
    children.sort((a, b) => a.name.localeCompare(b.name))

    // Recursively process children
    children.forEach((child) => {
      traverseDepthFirst(child.id, level + 1)
    })
  }

  // Start traversal from root categories
  rootCategories.forEach((rootCat) => {
    traverseDepthFirst(rootCat.id, 0)
  })

  return sortedCategories
}

async function updateCategorySortOrder() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err.message)
        reject(err)
        return
      }
      console.log('Connected to the SQLite database.')
    })

    db.serialize(() => {
      // First, check if level column exists, if not add it
      db.run(`ALTER TABLE ba_categories ADD COLUMN level INTEGER DEFAULT 0`, (err) => {
        // Ignore error if column already exists
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding level column:', err.message)
          reject(err)
          return
        }

        if (!err) {
          console.log('Added level column to ba_categories table')
        }

        // Get all categories
        db.all('SELECT id, name, parent_id FROM ba_categories ORDER BY id', (err, categories) => {
          if (err) {
            console.error('Error fetching categories:', err.message)
            reject(err)
            return
          }

          console.log(`Found ${categories.length} categories`)
          console.log('Building hierarchy and assigning sort orders...\n')

          // Build hierarchy and assign sort orders using depth-first traversal
          const sortedCategories = buildHierarchyAndSort(categories)

          // Prepare updates
          console.log(`\nExecuting ${sortedCategories.length} updates...`)

          const stmt = db.prepare('UPDATE ba_categories SET sort_order = ?, level = ? WHERE id = ?')

          let completed = 0
          sortedCategories.forEach((category) => {
            stmt.run([category.sort_order, category.level, category.id], (err) => {
              if (err) {
                console.error(`Error updating category ${category.id}:`, err.message)
              }
              completed++
              if (completed === sortedCategories.length) {
                stmt.finalize()

                // Verify the updates
                db.all(
                  `
                    SELECT id, name, parent_id, sort_order, level
                    FROM ba_categories
                    ORDER BY sort_order
                  `,
                  (err, result) => {
                    if (err) {
                      console.error('Error verifying updates:', err.message)
                      reject(err)
                      return
                    }

                    console.log('\nVerification - Categories in sort order (first 30):')
                    result.slice(0, 30).forEach((cat) => {
                      const indent = '  '.repeat(cat.level || 0)
                      console.log(`${indent}${cat.sort_order}: ${cat.name} (ID: ${cat.id}, Level: ${cat.level})`)
                    })

                    if (result.length > 30) {
                      console.log(`... and ${result.length - 30} more`)
                    }

                    db.close((err) => {
                      if (err) {
                        console.error('Error closing database:', err.message)
                        reject(err)
                      } else {
                        console.log('\nDatabase connection closed.')
                        console.log('Sort order update completed successfully!')
                        resolve()
                      }
                    })
                  }
                )
              }
            })
          })
        })
      })
    })
  })
}

// Run the update
updateCategorySortOrder()
  .then(() => {
    console.log('Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })
