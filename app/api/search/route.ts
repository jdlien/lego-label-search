import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

// Types
interface Part {
  id: string
  name: string
  category_id: string
  part_material: string
  label_file: string
  ba_cat_id: string
  ba_name: string
  category_name: string
  ba_category_name: string
  parent_cat_id: string
  parent_category: string
  grandparent_cat_id: string
  grandparent_category: string
  alt_part_ids: string
}

interface SearchResult {
  results: Part[]
  total: number
  returned: number
  categories: string[]
}

interface QueryData {
  query: string
  params: any[]
  countQuery: string
  countParams: any[]
}

interface MultiWordSearch {
  isMultiWord: boolean
  original: string
  terms: string[]
}

interface CombinedSearch {
  dimensions: string[]
  terms: string[]
  hasBoth: boolean
}

interface SearchAnalysis {
  searchTerm: string
  isExactDimension: boolean
  hasDimensionsWithin: boolean
  isMultipleFormats: boolean
  allDimensionFormats: string[] | null
  multiWordSearch: MultiWordSearch
  isMultiWord: boolean
  combinedSearch: CombinedSearch | null
  hasCombinedSearch: boolean
}

// Database connection pool
let dbPromise: Promise<any> | null = null

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

// =================== DIMENSION UTILITIES ===================

// Function to normalize dimension format for searching
// Handles formats like "2x2", "2 x 2", "2×2", "2 × 2", etc.
function normalizeDimensions(searchTerm: string): string | string[] {
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
function extractDimensionPatterns(searchTerm: string): string[] | null {
  // Pattern to find dimensions within a string - matches digits followed by x/× then digits
  const dimensionRegex = /(\d+)\s*[x×]\s*(\d+)/gi
  const matches = [...searchTerm.matchAll(dimensionRegex)]

  if (matches.length === 0) {
    return null
  }

  const dimensions: string[] = []

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

// =================== SEARCH TERM UTILITIES ===================

// Function to prepare search terms for multi-word searches
// This splits a search query into individual words and prepares them for AND search
function prepareMultiWordSearch(searchTerm: string): MultiWordSearch {
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
function combineSearchWithDimensions(
  searchTerms: MultiWordSearch,
  dimensionFormats: string[] | null
): CombinedSearch | null {
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

// =================== CATEGORY UTILITIES ===================

// Function to get a category and all its subcategories recursively
async function getAllSubcategories(db: any, categoryId: string): Promise<string[]> {
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

  return results.map((row: { id: string }) => row.id)
}

// =================== QUERY BUILDER FUNCTIONS ===================

// Get base queries for selecting parts
function getBaseQueries() {
  const baseQuery = `
    SELECT p.part_num as id, p.name, p.part_cat_id as category_id,
           p.part_material, p.label_file, p.ba_cat_id, p.ba_name,
           c.name as category_name, b.name as ba_category_name,
           parent.id as parent_cat_id, parent.name as parent_category,
           grandparent.id as grandparent_cat_id, grandparent.name as grandparent_category,
           p.alt_part_ids
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

  return { baseQuery, baseCountQuery }
}

// Build query for single-term search (no dimensions or multi-word)
function buildBasicSearch(baseQuery: string, searchTerm: string, q: string): QueryData {
  const query = `${baseQuery} WHERE p.part_num = ?
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ? AND p.part_num != ?)
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE (p.name LIKE ? OR p.ba_name LIKE ?) AND p.part_num NOT LIKE ?)
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE p.alt_part_ids LIKE ? AND p.part_num != ?)
                `
  const params = [q, searchTerm, q, searchTerm, searchTerm, searchTerm, searchTerm, q]

  const countQuery = `${
    getBaseQueries().baseCountQuery
  } WHERE p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ? OR p.alt_part_ids LIKE ?`
  const countParams = [searchTerm, searchTerm, searchTerm, searchTerm]

  return { query, params, countQuery, countParams }
}

// Build query for dimension search
function buildDimensionSearch(baseQuery: string, searchTerm: string, q: string, dimensionFormats: string[]): QueryData {
  // Create both name-based conditions and part-number conditions
  const nameLikeConditions = dimensionFormats.map(() => 'p.name LIKE ? OR p.ba_name LIKE ?').join(' OR ')
  const nameParams: string[] = []
  dimensionFormats.forEach((format) => {
    nameParams.push(`%${format}%`, `%${format}%`)
  })

  // Check if the original query contains additional terms besides dimensions
  // This handles cases where someone searches for a part number AND a dimension
  const terms = q.split(/\s+/).filter((term) => term.trim().length > 0)
  const hasPossiblePartNum = terms.length > 1

  let query: string
  let params: any[]
  let countQuery: string
  let countParams: any[]

  if (hasPossiblePartNum) {
    // Enhanced search that allows matching dimensions AND other terms (potentially part numbers)
    const otherTerms = terms.filter((term) => {
      // Exclude terms that look like dimension patterns
      const dimensionPattern = /^\d+\s*[x×]\s*\d+$/i
      return !dimensionPattern.test(term)
    })

    if (otherTerms.length > 0) {
      // Create conditions for non-dimension terms
      const otherConditions: string[] = []
      const otherParams: string[] = []

      otherTerms.forEach((term) => {
        // Allow term to match part_num, name or ba_name
        otherConditions.push('(p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?)')
        otherParams.push(`%${term}%`, `%${term}%`, `%${term}%`)
      })

      // Combine dimension condition with other terms using AND
      const otherConditionsSQL = otherConditions.join(' AND ')
      const combinedCondition = `(${nameLikeConditions}) AND (${otherConditionsSQL})`

      // Build query that requires both dimension match AND other term matches
      query = `${baseQuery} WHERE p.part_num = ?
              UNION ALL
              SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ?)
              UNION ALL
              SELECT * FROM (${baseQuery} WHERE (${combinedCondition}))
              UNION ALL
              SELECT * FROM (${baseQuery} WHERE p.alt_part_ids LIKE ?)
              `
      params = [q, searchTerm, ...nameParams, ...otherParams, searchTerm]

      countQuery = `${
        getBaseQueries().baseCountQuery
      } WHERE p.part_num LIKE ? OR ((${nameLikeConditions}) AND (${otherConditionsSQL})) OR p.alt_part_ids LIKE ?`
      countParams = [searchTerm, ...nameParams, ...otherParams, searchTerm]

      return { query, params, countQuery, countParams }
    }
  }

  // Standard dimension-only search if no part number is detected
  query = `${baseQuery} WHERE p.part_num = ?
          UNION ALL
          SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ?)
          UNION ALL
          SELECT * FROM (${baseQuery} WHERE (${nameLikeConditions}))
          UNION ALL
          SELECT * FROM (${baseQuery} WHERE p.alt_part_ids LIKE ?)
          `
  params = [q, searchTerm, ...nameParams, searchTerm]

  countQuery = `${
    getBaseQueries().baseCountQuery
  } WHERE p.part_num LIKE ? OR (${nameLikeConditions}) OR p.alt_part_ids LIKE ?`
  countParams = [searchTerm, ...nameParams, searchTerm]

  return { query, params, countQuery, countParams }
}

// Build query for multi-word search
function buildMultiWordSearch(
  baseQuery: string,
  searchTerm: string,
  q: string,
  multiWordSearch: MultiWordSearch
): QueryData {
  const nameConditions: string[] = []
  const nameParams: string[] = []

  // Process each search term, with special handling for dimension patterns
  multiWordSearch.terms.forEach((term) => {
    // Check if term is a dimension pattern
    const dimensionPattern = /^\d+\s*[x×]\s*\d+$/i
    if (dimensionPattern.test(term)) {
      // For dimension patterns, use the dimension normalization to catch all formats
      const dimensionFormats = normalizeDimensions(term)

      if (Array.isArray(dimensionFormats)) {
        // Create a condition that matches any of the dimension formats
        const dimensionConditions = dimensionFormats.map(() => 'p.name LIKE ? OR p.ba_name LIKE ?').join(' OR ')
        nameConditions.push(`(${dimensionConditions})`)

        // Add params for each dimension format
        dimensionFormats.forEach((format) => {
          nameParams.push(`%${format}%`, `%${format}%`)
        })
      } else {
        // Fallback if normalization didn't return formats
        nameConditions.push(`(p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?)`)
        nameParams.push(`%${term}%`, `%${term}%`, `%${term}%`)
      }
    } else {
      // For non-dimension terms, include part_num, name and ba_name in search
      nameConditions.push(`(p.part_num LIKE ? OR p.name LIKE ? OR p.ba_name LIKE ?)`)
      nameParams.push(`%${term}%`, `%${term}%`, `%${term}%`)
    }
  })

  // Combine conditions with AND to require all words to be present
  const combinedNameCondition = nameConditions.join(' AND ')

  // Simplified query with less restrictive filtering - we'll handle duplicates with DISTINCT later
  const query = `${baseQuery} WHERE p.part_num = ?
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ?)
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE (${combinedNameCondition}))
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE p.alt_part_ids LIKE ?)
                `
  const params = [q, searchTerm, ...nameParams, searchTerm]

  // Count query needs to use the same logic
  const countQuery = `${
    getBaseQueries().baseCountQuery
  } WHERE p.part_num LIKE ? OR (${combinedNameCondition}) OR p.alt_part_ids LIKE ?`
  const countParams = [searchTerm, ...nameParams, searchTerm]

  return { query, params, countQuery, countParams }
}

// Build query for combined search (dimensions AND multi-word)
function buildCombinedSearch(
  baseQuery: string,
  searchTerm: string,
  q: string,
  combinedSearch: CombinedSearch
): QueryData {
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
  const nameParams: string[] = []
  // Add dimension params
  combinedSearch.dimensions.forEach((format) => {
    nameParams.push(`%${format}%`, `%${format}%`)
  })
  // Add term params
  combinedSearch.terms.forEach((term) => {
    nameParams.push(`%${term}%`, `%${term}%`)
  })

  const query = `${baseQuery} WHERE p.part_num = ?
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE p.part_num LIKE ? AND p.part_num != ?)
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE (${combinedCondition}) AND p.part_num NOT LIKE ?)
                UNION ALL
                SELECT * FROM (${baseQuery} WHERE p.alt_part_ids LIKE ? AND p.part_num != ?)
                `
  const params = [q, searchTerm, q, ...nameParams, searchTerm, searchTerm, q]

  const countQuery = `${
    getBaseQueries().baseCountQuery
  } WHERE p.part_num LIKE ? OR (${combinedCondition}) OR p.alt_part_ids LIKE ?`
  const countParams = [searchTerm, ...nameParams, searchTerm]

  return { query, params, countQuery, countParams }
}

// Add category filters to a query
function addCategoryFilter(queryData: QueryData, categoryIds: string[]): QueryData {
  let { query, params, countQuery, countParams } = queryData

  if (categoryIds.length === 1) {
    // Single category filter
    query = query.replace('WHERE', 'WHERE p.ba_cat_id = ? AND ')
    params.unshift(categoryIds[0])

    countQuery = countQuery.replace('WHERE', 'WHERE p.ba_cat_id = ? AND ')
    countParams.unshift(categoryIds[0])
  } else {
    // Multiple categories filter
    const placeholders = categoryIds.map(() => '?').join(',')
    query = query.replace('WHERE', `WHERE p.ba_cat_id IN (${placeholders}) AND `)
    params.unshift(...categoryIds)

    countQuery = countQuery.replace('WHERE', `WHERE p.ba_cat_id IN (${placeholders}) AND `)
    countParams.unshift(...categoryIds)
  }

  return { query, params, countQuery, countParams }
}

// Build category-only filter query (no search term)
function buildCategoryOnlyQuery(baseQuery: string, categoryIds: string[]): QueryData {
  let query: string
  let params: string[]
  let countQuery: string
  let countParams: string[]

  if (categoryIds.length === 1) {
    // If only one category, use simple WHERE clause
    query = `${baseQuery} WHERE p.ba_cat_id = ?`
    params = [categoryIds[0]]

    countQuery = `${getBaseQueries().baseCountQuery} WHERE p.ba_cat_id = ?`
    countParams = [categoryIds[0]]
  } else {
    // If multiple categories (parent + children), use IN clause
    const placeholders = categoryIds.map(() => '?').join(',')

    query = `${baseQuery} WHERE p.ba_cat_id IN (${placeholders})`
    params = [...categoryIds]

    countQuery = `${getBaseQueries().baseCountQuery} WHERE p.ba_cat_id IN (${placeholders})`
    countParams = [...categoryIds]
  }

  return { query, params, countQuery, countParams }
}

// Apply sorting to query
function applySorting(query: string, sort?: string): string {
  if (sort === 'alt_ids_length') {
    return (
      query +
      `
    ORDER BY
      CASE
        WHEN alt_part_ids IS NULL THEN 0
        WHEN LENGTH(TRIM(alt_part_ids)) = 0 THEN 0
        WHEN INSTR(alt_part_ids, ',') = 0 THEN 1  -- If no commas but has content, count as 1 item
        ELSE (
          -- Count commas and add 1 to get the number of items
          LENGTH(alt_part_ids) - LENGTH(REPLACE(alt_part_ids, ',', '')) + 1
        )
      END DESC,
      id`
    )
  } else if (sort === 'id') {
    return query + ` ORDER BY id`
  } else if (sort === 'name') {
    return query + ` ORDER BY name`
  } else {
    // Default fallback sorting
    return query + ` ORDER BY id`
  }
}

// Apply limit to query
function applyLimit(query: string, params: any[], limit?: string): { query: string; params: any[] } {
  if (limit) {
    return {
      query: query + ` LIMIT ?`,
      params: [...params, parseInt(limit, 10)],
    }
  }
  return { query, params }
}

// Analyze a search term and determine what type of search to perform
function analyzeSearchTerm(q: string): SearchAnalysis {
  const searchTerm = `%${q}%`

  // First check if this is a multi-word search
  const terms = q.split(/\s+/).filter((term) => term.trim().length > 0)
  const isRawMultiWord = terms.length > 1

  // Check for exact dimension pattern
  const dimensionFormats = normalizeDimensions(q)
  const isExactDimension = Array.isArray(dimensionFormats)

  // Check for dimensions within the search string
  const extractedDimensions = extractDimensionPatterns(q)
  const hasDimensionsWithin = extractedDimensions !== null

  // Check if any term is a dimension pattern
  const hasDimensionTerm =
    isRawMultiWord &&
    terms.some((term) => {
      const dimensionPattern = /^\d+\s*[x×]\s*\d+$/i
      return dimensionPattern.test(term)
    })

  // Combine dimension formats
  const isMultipleFormats = isExactDimension || hasDimensionsWithin
  const allDimensionFormats = isExactDimension
    ? (dimensionFormats as string[])
    : hasDimensionsWithin
    ? extractedDimensions
    : null

  // Special case: if it's multiple words and contains a dimension pattern,
  // treat it as a multi-word search rather than a dimension search
  if (isRawMultiWord && hasDimensionTerm) {
    const multiWordSearch = {
      isMultiWord: true,
      original: q,
      terms: terms,
    }

    return {
      searchTerm,
      isExactDimension: false,
      hasDimensionsWithin: false,
      isMultipleFormats: false,
      allDimensionFormats: null,
      multiWordSearch,
      isMultiWord: true,
      combinedSearch: null,
      hasCombinedSearch: false,
    }
  }

  // Standard checks
  const multiWordSearch = prepareMultiWordSearch(q)
  const isMultiWord = multiWordSearch.isMultiWord

  // Check if combining regular terms with dimension search
  const combinedSearch =
    isMultipleFormats && isMultiWord ? combineSearchWithDimensions(multiWordSearch, allDimensionFormats) : null
  const hasCombinedSearch = combinedSearch !== null && combinedSearch.hasBoth

  return {
    searchTerm,
    isExactDimension,
    hasDimensionsWithin,
    isMultipleFormats,
    allDimensionFormats,
    multiWordSearch,
    isMultiWord,
    combinedSearch,
    hasCombinedSearch,
  }
}

// =================== MAIN HANDLER ===================

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Get query parameters
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''
  const category = searchParams.get('category')
  const limit = searchParams.get('limit') || '10000' // Default limit to a large number
  const sort = searchParams.get('sort') || 'alt_ids_length'

  try {
    const db = await openDb()

    // Handle empty query
    if (!q && !category) {
      return NextResponse.json({ message: 'Please provide a search query or category filter' }, { status: 400 })
    }

    let queryData: QueryData = { query: '', params: [], countQuery: '', countParams: [] }
    let categoryIds: string[] = []
    const { baseQuery } = getBaseQueries()

    // If category is provided, get all subcategories
    if (category) {
      categoryIds = await getAllSubcategories(db, category)
    }

    // Build query based on the search parameters
    if (q) {
      // Analyze the search term to determine search strategy
      const analysis = analyzeSearchTerm(q.trim())

      // Choose the appropriate query builder based on the analysis
      if (analysis.hasCombinedSearch && analysis.combinedSearch) {
        queryData = buildCombinedSearch(baseQuery, analysis.searchTerm, q, analysis.combinedSearch)
      } else if (analysis.isMultipleFormats && analysis.allDimensionFormats) {
        queryData = buildDimensionSearch(baseQuery, analysis.searchTerm, q, analysis.allDimensionFormats)
      } else if (analysis.isMultiWord) {
        queryData = buildMultiWordSearch(baseQuery, analysis.searchTerm, q, analysis.multiWordSearch)
      } else {
        queryData = buildBasicSearch(baseQuery, analysis.searchTerm, q)
      }

      // Add category filter if needed
      if (category) {
        queryData = addCategoryFilter(queryData, categoryIds)
      }
    } else if (category) {
      // Only filtering by category
      queryData = buildCategoryOnlyQuery(baseQuery, categoryIds)
    }

    // Wrap the query in a subquery to apply sorting consistently and eliminate duplicates
    let { query, params, countQuery, countParams } = queryData
    query = `SELECT DISTINCT * FROM (${query}) results_with_alt_ids`

    // Apply sorting and limit
    query = applySorting(query, sort)
    const { query: finalQuery, params: finalParams } = applyLimit(query, params, limit)

    // Execute query
    const results = await db.all(finalQuery, ...finalParams)

    // Get total count
    const countResult = await db.get(countQuery, ...countParams)
    const total = countResult ? countResult.total : 0

    const response: SearchResult = {
      results,
      total,
      returned: results.length,
      categories: categoryIds,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      {
        message: 'An error occurred during search',
        error: error.message,
      },
      { status: 500 }
    )
  }
}
