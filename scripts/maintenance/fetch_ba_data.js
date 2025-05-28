const cheerio = require('cheerio')
const fs = require('fs').promises
const path = require('path')

// Use dynamic import for node-fetch (ES module)
let fetch
async function initFetch() {
  if (!fetch) {
    const fetchModule = await import('node-fetch')
    fetch = fetchModule.default
  }
  return fetch
}

// Create data directory if it doesn't exist
const DATA_DIR = path.join(__dirname, '../../data')

// Base URL for the main parts page
const MAIN_PARTS_URL = 'https://brickarchitect.com/parts/'

// Function to fetch root categories from the main parts page
async function fetchRootCategories() {
  const fetchFn = await initFetch()
  console.log('Fetching root categories from main parts page...')

  try {
    const html = await fetchWithRetry(MAIN_PARTS_URL)
    const $ = cheerio.load(html)

    const rootCategories = []
    const categoryItems = $('.categorylistitem')

    categoryItems.each((index, item) => {
      const $item = $(item)
      const nameDiv = $item.find('.categorylistitem_name')
      const summaryDiv = $item.find('.categorylistitem_summary')
      const link = nameDiv.find('a')

      if (link.length > 0) {
        const href = link.attr('href')
        const name = link.text().trim()
        const description = summaryDiv.text().trim()

        // Extract category ID from the URL
        const idMatch = href.match(/category-(\d+)/)
        if (idMatch) {
          const categoryId = parseInt(idMatch[1])
          // Add query parameters for parts style and retired
          const fullUrl = `${href}?&partstyle=1&retired=1`

          rootCategories.push({
            id: categoryId,
            name: name,
            url: fullUrl,
            description: description,
            sort_order: index + 1, // 1-based index for sort order
            level: 0, // Root level categories
          })
        }
      }
    })

    console.log(`Found ${rootCategories.length} root categories`)
    return rootCategories
  } catch (error) {
    console.error('Error fetching root categories:', error.message)
    throw error
  }
}

// Helper function to delay between requests (rate limiting)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to convert object array to CSV string
function arrayToCSV(data, headers) {
  const csvHeaders = headers.map((h) => `"${h}"`).join(',')
  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header]
        // Handle numeric zero specially to avoid converting to empty string
        if (value === 0) return '"0"'
        // For other values, convert to string (empty string for null/undefined)
        return `"${String(value || '').replace(/"/g, '""')}"`
      })
      .join(',')
  )
  return [csvHeaders, ...csvRows].join('\n')
}

// Helper function to write CSV file
async function writeCSV(filename, data, headers) {
  const csvContent = arrayToCSV(data, headers)
  await fs.writeFile(path.join(DATA_DIR, filename), csvContent)
}

async function fetchWithRetry(url, maxRetries = 3) {
  const fetchFn = await initFetch()

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchFn(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BrickArchitect-Parser/1.0)',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.text()
    } catch (error) {
      console.log(`Attempt ${attempt} failed for ${url}: ${error.message}`)
      if (attempt === maxRetries) {
        throw error
      }
      await delay(2000 * attempt) // Exponential backoff
    }
  }
}

async function processUrl(url, rootCategoryInfo = null) {
  console.log(`Processing ${url}`)

  // Extract main category ID from URL
  const urlMatch = url.match(/category-(\d+)/)
  if (!urlMatch) {
    console.log(`Could not extract category ID from URL: ${url}`)
    return { categories: [], parts: [] }
  }

  const mainCategoryId = parseInt(urlMatch[1])
  const categories = []
  const partsData = []

  // Initialize counters for hierarchical sort_order
  const rootSortOrder = rootCategoryInfo?.sort_order ? rootCategoryInfo.sort_order * 10000 : null
  let level1Counter = 1 // Counter for level 1 subcategories (will be multiplied by 100)
  const level2Counters = new Map() // Track level 2 counters per parent category

  try {
    // Fetch the page content with retry logic
    const html = await fetchWithRetry(url)
    const $ = cheerio.load(html)

    // Find the main category name from the resultsheadercount div
    const headerDiv = $('.resultsheadercount')
    if (headerDiv.length === 0) {
      console.log(`Could not find main category header in ${url}`)
      return { categories: [], parts: [] }
    }

    // Extract from the <strong> tag
    const strongElement = headerDiv.find('strong')
    if (strongElement.length === 0) {
      console.log(`Could not find strong element with category name in ${url}`)
      return { categories: [], parts: [] }
    }

    const mainCategoryName = strongElement.text().trim()

    // Add main category to categories list with additional fields from rootCategoryInfo
    categories.push({
      id: mainCategoryId,
      name: mainCategoryName,
      parent_id: '',
      level: 0,
      sort_order: rootSortOrder,
      description: rootCategoryInfo?.description || '',
    })

    // Find all part_category divs
    const partCategoryDivs = $('.part_category')

    partCategoryDivs.each((_, categoryDiv) => {
      const $categoryDiv = $(categoryDiv)

      // Find the category header - could be h2 or h3 with class partcategoryname
      const categoryHeader = $categoryDiv.find('.partcategoryname').first()

      if (categoryHeader.length === 0) {
        console.log('No category header found in part_category div')
        return
      }

      // Extract category ID from the id attribute
      const headerId = categoryHeader.attr('id')
      if (!headerId) {
        console.log('Missing id attribute in category header')
        return
      }

      const idMatch = headerId.match(/category-(\d+)/)
      if (!idMatch) {
        console.log(`Could not extract category ID from header id: ${headerId}`)
        return
      }

      const categoryId = parseInt(idMatch[1])

      // Extract category name from the a tag
      const aElement = categoryHeader.find('a')
      if (aElement.length === 0) {
        console.log('Missing a element in category header')
        return
      }

      const categoryName = aElement.text().trim()

      // Determine the parent ID and level based on the header type and content
      let parentId = mainCategoryId
      let level = 1

      // Check if this is an h2 or h3
      if (categoryHeader.is('h2')) {
        // h2 elements are direct subcategories of the main category
        parentId = mainCategoryId
        level = 1
      } else if (categoryHeader.is('h3')) {
        // h3 elements might be sub-subcategories
        // Check if this h3 has a parent category by looking for › in the full text
        const fullText = categoryHeader.text()
        const arrowCount = (fullText.match(/›/g) || []).length

        if (arrowCount > 0) {
          // This is a sub-subcategory, need to parse parent from the text
          // Extract the parent category name from before the ›
          const textBeforeArrow = fullText.split('›')[0].trim()

          // Find the parent category by searching backwards through our categories
          const parentCategory = categories
            .slice()
            .reverse()
            .find((cat) => cat.name === textBeforeArrow && cat.level === 1)

          if (parentCategory) {
            parentId = parentCategory.id
            level = 2
          } else {
            // If we can't find parent, default to main category
            parentId = mainCategoryId
            level = 1
          }
        } else {
          // h3 without arrow is a direct subcategory
          parentId = mainCategoryId
          level = 1
        }
      }

      // Calculate sort_order based on hierarchy level
      let sortOrder = null
      if (rootSortOrder) {
        if (level === 1) {
          // Level 1: rootSortOrder + (counter * 100)
          sortOrder = rootSortOrder + level1Counter * 100
          level1Counter++
        } else if (level === 2) {
          // Level 2: Find parent's sort_order and increment from parent's base
          const parentCategory = categories.find((cat) => cat.id === parentId)
          if (parentCategory && parentCategory.sort_order) {
            // Get or initialize counter for this parent
            if (!level2Counters.has(parentId)) {
              level2Counters.set(parentId, 1)
            }
            const counter = level2Counters.get(parentId)
            sortOrder = parentCategory.sort_order + counter
            level2Counters.set(parentId, counter + 1)
          }
        }
      }

      // Add category to categories list with hierarchical sort_order
      categories.push({
        id: categoryId,
        name: categoryName,
        parent_id: parentId,
        level: level,
        sort_order: sortOrder,
        description: '',
      })

      // Find all parts in this category (inside tbody div)
      const tbody = $categoryDiv.find('.tbody').first()
      if (tbody.length === 0) {
        console.log(`No parts found for category ${categoryName}`)
        return
      }

      // Find all parts (a elements which contain tr divs)
      const trContainers = tbody.find('> a')

      trContainers.each((_, container) => {
        const $container = $(container)
        const tr = $container.find('.tr')
        if (tr.length === 0) {
          return
        }

        // Find part name and part number from the td span elements
        const partNameTd = tr.find('span.td.part_name')
        if (partNameTd.length === 0) {
          return
        }

        // Find the partname and partnum spans
        const partNameElem = partNameTd.find('span.partname')
        const partNumElem = partNameTd.find('span.partnum')

        if (partNameElem.length === 0 || partNumElem.length === 0) {
          return
        }

        const partName = partNameElem.text().trim()
        const partNum = partNumElem.text().trim()

        // Add part with the correct category ID
        partsData.push({
          part_num: partNum,
          ba_name: partName,
          ba_cat_id: categoryId,
          category_level: level + 1, // Parts are one level below their category
        })
      })
    })

    // Add rate limiting delay between requests
    await delay(1000)

    return { categories, parts: partsData }
  } catch (error) {
    console.error(`Error processing ${url}: ${error.message}`)
    return { categories: [], parts: [] }
  }
}

async function main() {
  try {
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true })

    const allCategories = []
    const allPartsData = []

    // First, fetch the root categories from the main page
    const rootCategories = await fetchRootCategories()

    // Process all URLs from the dynamically fetched root categories
    for (const rootCategory of rootCategories) {
      const result = await processUrl(rootCategory.url, rootCategory)
      allCategories.push(...result.categories)
      allPartsData.push(...result.parts)
    }

    // Remove duplicate categories (same logic as Python version)
    const uniqueCategories = []
    const seenCategoryIds = new Set()

    for (const cat of allCategories) {
      if (!seenCategoryIds.has(cat.id)) {
        uniqueCategories.push(cat)
        seenCategoryIds.add(cat.id)
      }
    }

    // Create a clean list of parts, keeping only the most specific category for each part
    const uniqueParts = new Map() // Use Map for better performance

    for (const part of allPartsData) {
      const partKey = `${part.part_num}|${part.ba_name}`

      // If we haven't seen this part before, or it has a more specific (higher level) category, update it
      if (!uniqueParts.has(partKey) || part.category_level > uniqueParts.get(partKey).category_level) {
        uniqueParts.set(partKey, {
          part_num: part.part_num,
          ba_name: part.ba_name,
          ba_cat_id: part.ba_cat_id,
          category_level: part.category_level,
        })
      }
    }

    // Convert the map back to an array for output
    const finalParts = Array.from(uniqueParts.values()).map((partData) => ({
      part_num: partData.part_num,
      ba_name: partData.ba_name,
      ba_cat_id: partData.ba_cat_id,
    }))

    // Clean up parts data for correct category assignment
    // First, collect all the unique part category IDs from our categories list
    const validCategoryIds = new Set(uniqueCategories.map((cat) => cat.id))

    // Filter out parts with invalid category IDs - these might be malformed from the HTML parsing
    const cleanedParts = finalParts.filter((part) => validCategoryIds.has(part.ba_cat_id))

    // Ensure all fields have proper values and convert to proper types for CSV
    uniqueCategories.forEach((cat) => {
      // For root categories, ensure level is 0 (numeric)
      if (!cat.parent_id) {
        cat.level = 0
      }
      // Ensure level is a number
      if (cat.level === undefined || cat.level === '') {
        cat.level = cat.parent_id ? 1 : 0 // Default based on whether it has a parent
      }
      // Ensure sort_order is properly set (all categories should have sort_order now)
      if (cat.sort_order === undefined || cat.sort_order === null) {
        cat.sort_order = '' // Empty string if not set
      }
      // Ensure other fields
      if (cat.description === undefined) cat.description = ''
      if (cat.parent_id === undefined) cat.parent_id = ''
    })

    // Write categories to CSV with proper quoting and new fields
    await writeCSV('ba_categories.csv', uniqueCategories, [
      'id',
      'name',
      'parent_id',
      'level',
      'sort_order',
      'description',
    ])

    // Write parts to CSV with proper quoting
    await writeCSV('ba_parts.csv', cleanedParts, ['part_num', 'ba_name', 'ba_cat_id'])

    console.log(`Processed ${uniqueCategories.length} categories and ${allPartsData.length} raw parts`)
    console.log(`After removing duplicates: ${cleanedParts.length} unique parts`)
    console.log('Files saved to data/ba_categories.csv and data/ba_parts.csv')
  } catch (error) {
    console.error('Fatal error:', error)
    process.exit(1)
  }
}

// Run the script
if (require.main === module) {
  main()
}

module.exports = { main, processUrl }
