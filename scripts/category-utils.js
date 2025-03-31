/** @format */

/**
 * Get a chain of parent categories for a given category
 * @param {Object} db - Database connection
 * @param {number|string} categoryId - The category ID to start from
 * @returns {Promise<Array>} Array of parent category IDs
 */
async function getParentCategoryChain(db, categoryId) {
  const parents = []
  let currentId = categoryId

  // Prevent infinite loops
  let iterations = 0
  const maxIterations = 10

  while (currentId && iterations < maxIterations) {
    iterations++

    // Get the parent of the current category
    const category = await db.get('SELECT parent_id FROM ba_categories WHERE id = ?', currentId)

    if (!category || !category.parent_id) break

    // Add parent to the chain
    parents.push(category.parent_id)
    currentId = category.parent_id
  }

  return parents
}

module.exports = {
  getParentCategoryChain,
}
