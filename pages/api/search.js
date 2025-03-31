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

// Function to normalize dimension format for searching
// Handles formats like "2x2", "2 x 2", "2×2", "2 × 2", etc.
function normalizeDimensions(searchTerm) {
  // Check if the search term looks like a dimension pattern
  const dimensionPattern = /^\d+\s*[x×]\s*\d+$/i
  if (!dimensionPattern.test(searchTerm)) {
    return searchTerm // Not a dimension pattern, return as is
  }

  // Extract the numbers from the dimension pattern
  const numbers = searchTerm.match(/\d+/g)
  if (numbers && numbers.length === 2) {
    // Create additional search patterns to catch all variations
    return [
      searchTerm, // Original format
      `${numbers[0]}x${numbers[1]}`, // No spaces: 2x2
      `${numbers[0]} x ${numbers[1]}`, // With spaces: 2 x 2
      `${numbers[0]}×${numbers[1]}`, // Unicode multiplication: 2×2
      `${numbers[0]} × ${numbers[1]}`, // Unicode multiplication with spaces: 2 × 2
    ]
  }

  return searchTerm
}

// Function to look for dimension patterns within a search string
// Extracts and normalizes dimensions like "1x4", "1 x 4", etc. from within larger strings
function extractDimensionPatterns(searchTerm) {
  // Pattern to find dimensions within a string - matches digits followed by x/× then digits
  const dimensionRegex = /(\d+)\s*[x×]\s*(\d+)/gi
  const matches = [...searchTerm.matchAll(dimensionRegex)]

  if (matches.length === 0) {
    return null
  }

  const dimensions = []

  // For each dimension pattern found
  matches.forEach((match) => {
    const num1 = match[1]
    const num2 = match[2]

    // Add all variations of this dimension pattern
    dimensions.push(
      `${num1}x${num2}`, // No spaces: 2x2
      `${num1} x ${num2}`, // With spaces: 2 x 2
      `${num1}×${num2}`, // Unicode multiplication: 2×2
      `${num1} × ${num2}` // Unicode multiplication with spaces: 2 × 2
    )
  })

  return dimensions.length > 0 ? dimensions : null
}

// Function to prepare search terms for multi-word searches
// This splits a search query into individual words and prepares them for AND search
function prepareMultiWordSearch(searchTerm) {
  // If the search term is a dimension pattern, don't split it
  const dimensionPattern = /^\d+\s*[x×]\s*\d+$/i
  if (dimensionPattern.test(searchTerm)) {
    return {
      isMultiWord: false,
      original: searchTerm,
      terms: [searchTerm],
    }
  }

  // Split the search term into individual words, filtering out empty strings
  const words = searchTerm.split(/\s+/).filter((word) => word.trim().length > 0)

  // If there's only one word, no need for multi-word search
  if (words.length <= 1) {
    return {
      isMultiWord: false,
      original: searchTerm,
      terms: [searchTerm],
    }
  }

  // Return the original search term and individual words
  return {
    isMultiWord: true,
    original: searchTerm,
    terms: words,
  }
}

// Function to combine regular search terms with dimension patterns
// This ensures that results must match both regular terms AND dimension patterns
function combineSearchWithDimensions(searchTerms, dimensionFormats) {
  if (!dimensionFormats || !Array.isArray(dimensionFormats) || dimensionFormats.length === 0) {
    return null
  }

  // Check if we have non-dimension search terms
  if (!searchTerms || !searchTerms.terms || searchTerms.terms.length === 0) {
    return null
  }

  // Filter out any dimension patterns from the search terms
  const dimensionPattern = /^\d+\s*[x×]\s*\d+$/i
  const nonDimensionTerms = searchTerms.terms.filter((term) => !dimensionPattern.test(term))

  // If after filtering, we don't have any non-dimension terms, skip combining
  if (nonDimensionTerms.length === 0) {
    return null
  }

  return {
    dimensions: dimensionFormats,
    terms: nonDimensionTerms,
    hasBoth: true,
  }
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
      // First check for a perfect dimension pattern
      const dimensionFormats = normalizeDimensions(q)
      const isExactDimension = Array.isArray(dimensionFormats)

      // Next look for dimension patterns within the search string
      const extractedDimensions = extractDimensionPatterns(q)
      const hasDimensionsWithin = extractedDimensions !== null

      // Combine both approaches
      const isMultipleFormats = isExactDimension || hasDimensionsWithin
      const allDimensionFormats = isExactDimension ? dimensionFormats : hasDimensionsWithin ? extractedDimensions : null

      // Check if we have a multi-word search
      const multiWordSearch = prepareMultiWordSearch(q)
      const isMultiWord = multiWordSearch.isMultiWord

      // See if we need to combine regular search terms with dimension search
      const combinedSearch =
        isMultipleFormats && isMultiWord ? combineSearchWithDimensions(multiWordSearch, allDimensionFormats) : null
      const hasCombinedSearch = combinedSearch && combinedSearch.hasBoth

      // Basic search term (still needed for non-dimension searches and partial matching)
      const searchTerm = `%${q}%`

      // Build the query based on search type
      if (!category) {
        if (hasCombinedSearch) {
          // Handle the case where we have both dimension patterns and regular search terms
          // We need to AND them together

          // First, build the dimension conditions
          const dimensionConditions = combinedSearch.dimensions.map(() => 'p.name LIKE ? OR p.ba_name LIKE ?')
          const dimensionOrCondition = `(${dimensionConditions.join(' OR ')})`

          // Next, build the regular term conditions
          const termConditions = combinedSearch.terms.map(() => '(p.name LIKE ? OR p.ba_name LIKE ?)')
          const termAndCondition = termConditions.join(' AND ')

          // Combine both sets of conditions with AND
          // This ensures results must match at least one dimension format AND all regular terms
          const combinedCondition = `(${dimensionOrCondition}) AND (${termAndCondition})`

          // Build the params array
          const nameParams = []
          // Add dimension params
          combinedSearch.dimensions.forEach((format) => {
            nameParams.push(`%${format}%`, `%${format}%`)
          })
          // Add term params
          combinedSearch.terms.forEach((term) => {
            nameParams.push(`%${term}%`, `%${term}%`)
          })

          query = `${baseQuery} WHERE p.part_num = ?
                  UNION ALL
                  SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ? AND p.part_num != ?)
                  UNION ALL
                  SELECT * FROM (${baseQuery} WHERE (${combinedCondition}) AND p.part_num NOT LIKE ?)
                  `
          params = [q, searchTerm, q, ...nameParams, searchTerm]

          countQuery = `${baseCountQuery} WHERE p.part_num LIKE ? OR (${combinedCondition})`
          countParams = [searchTerm, ...nameParams]
        } else if (isMultipleFormats) {
          // Dimension search handling (only dimensions, no regular terms to AND with)
          const nameLikeConditions = allDimensionFormats.map(() => 'p.name LIKE ? OR p.ba_name LIKE ?').join(' OR ')
          const nameParams = []
          allDimensionFormats.forEach((format) => {
            nameParams.push(`%${format}%`, `%${format}%`)
          })

          query = `${baseQuery} WHERE p.part_num = ?
                  UNION ALL
                  SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ? AND p.part_num != ?)
                  UNION ALL
                  SELECT * FROM (${baseQuery} WHERE (${nameLikeConditions}) AND p.part_num NOT LIKE ?)
                  `
          params = [q, searchTerm, q, ...nameParams, searchTerm]

          countQuery = `${baseCountQuery} WHERE p.part_num LIKE ? OR ${nameLikeConditions}`
          countParams = [searchTerm, ...nameParams]
        } else if (isMultiWord) {
          // Handle multi-word search (words in any order)
          const nameConditions = []
          const nameParams = []

          // For each word, we need both name and ba_name to contain it
          multiWordSearch.terms.forEach((term) => {
            // Add conditions for this word
            nameConditions.push(`(p.name LIKE ? OR p.ba_name LIKE ?)`)
            nameParams.push(`%${term}%`, `%${term}%`)
          })

          // Combine conditions with AND to require all words to be present
          const combinedNameCondition = nameConditions.join(' AND ')

          query = `${baseQuery} WHERE p.part_num = ?
                  UNION ALL
                  SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ? AND p.part_num != ?)
                  UNION ALL
                  SELECT * FROM (${baseQuery} WHERE (${combinedNameCondition}) AND p.part_num NOT LIKE ?)
                  `
          params = [q, searchTerm, q, ...nameParams, searchTerm]

          // Count query needs to use the same logic
          countQuery = `${baseCountQuery} WHERE p.part_num LIKE ? OR (${combinedNameCondition})`
          countParams = [searchTerm, ...nameParams]
        } else {
          // Original query for single-word searches
          query = `${baseQuery} WHERE p.part_num = ?
                  UNION ALL
                  SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ? AND p.part_num != ?)
                  UNION ALL
                  SELECT * FROM (${baseQuery} WHERE (p.name LIKE ? OR p.ba_name LIKE ?) AND p.part_num NOT LIKE ?)
                  `
          params = [q, searchTerm, q, searchTerm, searchTerm, searchTerm]

          countQuery = `${baseCountQuery} WHERE p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?`
          countParams = [searchTerm, searchTerm, searchTerm]
        }
      } else {
        // With category filter
        if (categoryIds.length === 1) {
          // Single category
          if (hasCombinedSearch) {
            // Both dimension patterns and regular search terms with single category

            // First, build the dimension conditions
            const dimensionConditions = combinedSearch.dimensions.map(() => 'p.name LIKE ? OR p.ba_name LIKE ?')
            const dimensionOrCondition = `(${dimensionConditions.join(' OR ')})`

            // Next, build the regular term conditions
            const termConditions = combinedSearch.terms.map(() => '(p.name LIKE ? OR p.ba_name LIKE ?)')
            const termAndCondition = termConditions.join(' AND ')

            // Combine both sets of conditions with AND
            const combinedCondition = `(${dimensionOrCondition}) AND (${termAndCondition})`

            // Build the params array
            const nameParams = []
            // Add dimension params
            combinedSearch.dimensions.forEach((format) => {
              nameParams.push(`%${format}%`, `%${format}%`)
            })
            // Add term params
            combinedSearch.terms.forEach((term) => {
              nameParams.push(`%${term}%`, `%${term}%`)
            })

            query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR (${combinedCondition})) AND p.ba_cat_id = ?`
            params = [q, searchTerm, ...nameParams, categoryIds[0]]

            countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR (${combinedCondition})) AND p.ba_cat_id = ?`
            countParams = [searchTerm, ...nameParams, categoryIds[0]]
          } else if (isMultipleFormats) {
            // Dimension formats with category
            const nameLikeConditions = allDimensionFormats.map(() => 'p.name LIKE ? OR p.ba_name LIKE ?').join(' OR ')
            const nameParams = []
            allDimensionFormats.forEach((format) => {
              nameParams.push(`%${format}%`, `%${format}%`)
            })

            query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR (${nameLikeConditions})) AND p.ba_cat_id = ?`
            params = [q, searchTerm, ...nameParams, categoryIds[0]]

            countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR ${nameLikeConditions}) AND p.ba_cat_id = ?`
            countParams = [searchTerm, ...nameParams, categoryIds[0]]
          } else if (isMultiWord) {
            // Multi-word search with single category
            const nameConditions = []
            const nameParams = []

            // For each word, we need both name and ba_name to contain it
            multiWordSearch.terms.forEach((term) => {
              nameConditions.push(`(p.name LIKE ? OR p.ba_name LIKE ?)`)
              nameParams.push(`%${term}%`, `%${term}%`)
            })

            // Combine with AND
            const combinedNameCondition = nameConditions.join(' AND ')

            query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR (${combinedNameCondition})) AND p.ba_cat_id = ?`
            params = [q, searchTerm, ...nameParams, categoryIds[0]]

            countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR (${combinedNameCondition})) AND p.ba_cat_id = ?`
            countParams = [searchTerm, ...nameParams, categoryIds[0]]
          } else {
            // Original query with one category (unchanged)
            query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?) AND p.ba_cat_id = ?`
            params = [q, searchTerm, searchTerm, searchTerm, categoryIds[0]]

            countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?) AND p.ba_cat_id = ?`
            countParams = [searchTerm, searchTerm, searchTerm, categoryIds[0]]
          }
        } else {
          // Multiple categories
          const placeholders = categoryIds.map(() => '?').join(',')

          if (hasCombinedSearch) {
            // Both dimension patterns and regular search terms with multiple categories

            // First, build the dimension conditions
            const dimensionConditions = combinedSearch.dimensions.map(() => 'p.name LIKE ? OR p.ba_name LIKE ?')
            const dimensionOrCondition = `(${dimensionConditions.join(' OR ')})`

            // Next, build the regular term conditions
            const termConditions = combinedSearch.terms.map(() => '(p.name LIKE ? OR p.ba_name LIKE ?)')
            const termAndCondition = termConditions.join(' AND ')

            // Combine both sets of conditions with AND
            const combinedCondition = `(${dimensionOrCondition}) AND (${termAndCondition})`

            // Build the params array
            const nameParams = []
            // Add dimension params
            combinedSearch.dimensions.forEach((format) => {
              nameParams.push(`%${format}%`, `%${format}%`)
            })
            // Add term params
            combinedSearch.terms.forEach((term) => {
              nameParams.push(`%${term}%`, `%${term}%`)
            })

            query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR (${combinedCondition})) AND p.ba_cat_id IN (${placeholders})`
            params = [q, searchTerm, ...nameParams, ...categoryIds]

            countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR (${combinedCondition})) AND p.ba_cat_id IN (${placeholders})`
            countParams = [searchTerm, ...nameParams, ...categoryIds]
          } else if (isMultipleFormats) {
            // Dimension formats with multiple categories
            const nameLikeConditions = allDimensionFormats.map(() => 'p.name LIKE ? OR p.ba_name LIKE ?').join(' OR ')
            const nameParams = []
            allDimensionFormats.forEach((format) => {
              nameParams.push(`%${format}%`, `%${format}%`)
            })

            query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR (${nameLikeConditions})) AND p.ba_cat_id IN (${placeholders})`
            params = [q, searchTerm, ...nameParams, ...categoryIds]

            countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR ${nameLikeConditions}) AND p.ba_cat_id IN (${placeholders})`
            countParams = [searchTerm, ...nameParams, ...categoryIds]
          } else if (isMultiWord) {
            // Multi-word search with multiple categories
            const nameConditions = []
            const nameParams = []

            // For each word, we need both name and ba_name to contain it
            multiWordSearch.terms.forEach((term) => {
              nameConditions.push(`(p.name LIKE ? OR p.ba_name LIKE ?)`)
              nameParams.push(`%${term}%`, `%${term}%`)
            })

            // Combine with AND
            const combinedNameCondition = nameConditions.join(' AND ')

            query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR (${combinedNameCondition})) AND p.ba_cat_id IN (${placeholders})`
            params = [q, searchTerm, ...nameParams, ...categoryIds]

            countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR (${combinedNameCondition})) AND p.ba_cat_id IN (${placeholders})`
            countParams = [searchTerm, ...nameParams, ...categoryIds]
          } else {
            // Original query with multiple categories (unchanged)
            query = `${baseQuery} WHERE (p.part_num = ? OR p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?) AND p.ba_cat_id IN (${placeholders})`
            params = [q, searchTerm, searchTerm, searchTerm, ...categoryIds]

            countQuery = `${baseCountQuery} WHERE (p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?) AND p.ba_cat_id IN (${placeholders})`
            countParams = [searchTerm, searchTerm, searchTerm, ...categoryIds]
          }
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
