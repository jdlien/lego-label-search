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

// Define URLs to process
const urls = [
  'https://brickarchitect.com/parts/category-1?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-2?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-3?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-7?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-8?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-106?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-10?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-11?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-9?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-12?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-13?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-14?&partstyle=1&retired=1',
  'https://brickarchitect.com/parts/category-89?&partstyle=1&retired=1',
]

// Helper function to delay between requests (rate limiting)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Helper function to convert object array to CSV string
function arrayToCSV(data, headers) {
  const csvHeaders = headers.map((h) => `"${h}"`).join(',')
  const csvRows = data.map((row) =>
    headers.map((header) => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
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

async function processUrl(url) {
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

    // Add main category to categories list
    categories.push({
      id: mainCategoryId,
      name: mainCategoryName,
      parent_id: '',
    })

    // Find all subcategories (h2 elements with class partcategoryname)
    const subcategoryH2s = $('h2.partcategoryname')

    subcategoryH2s.each((_, h2Element) => {
      const $h2 = $(h2Element)

      // Extract subcategory ID from the id attribute
      const h2Id = $h2.attr('id')
      if (!h2Id) {
        console.log('Missing id attribute in subcategory h2')
        return
      }

      const idMatch = h2Id.match(/category-(\d+)/)
      if (!idMatch) {
        console.log(`Could not extract subcategory ID from h2 id: ${h2Id}`)
        return
      }

      const subcategoryId = parseInt(idMatch[1])

      // Extract subcategory name (text inside the a tag)
      const aElement = $h2.find('a')
      if (aElement.length === 0) {
        console.log('Missing a element in subcategory h2')
        return
      }

      const subcategoryName = aElement.text().trim()

      // Add subcategory to categories list
      categories.push({
        id: subcategoryId,
        name: subcategoryName,
        parent_id: mainCategoryId,
      })

      // Find the part_category div containing this h2
      const partCategoryDiv = $h2.closest('.part_category')
      if (partCategoryDiv.length === 0) {
        console.log(`Could not find parent part_category div for subcategory ${subcategoryName}`)
        return
      }

      // Find all the parts in this category (inside tbody div)
      const tbody = partCategoryDiv.find('.tbody')
      if (tbody.length === 0) {
        console.log(`No parts found for subcategory ${subcategoryName}`)
        return
      }

      // Find all parts (a elements which contain tr divs)
      const trContainers = tbody.find('a')

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

        // Add to temporary parts data with category level 2
        partsData.push({
          part_num: partNum,
          ba_name: partName,
          ba_cat_id: subcategoryId,
          category_level: 2, // Level 2 = subcategory
        })
      })

      // Also check for subcategories (h3 elements with class partcategoryname)
      const subcategoryH3s = partCategoryDiv.find('h3.partcategoryname')

      subcategoryH3s.each((_, h3Element) => {
        const $h3 = $(h3Element)

        // Extract subsubcategory ID from the id attribute
        const h3Id = $h3.attr('id')
        if (!h3Id) {
          console.log('Missing id attribute in subsubcategory h3')
          return
        }

        const idMatch = h3Id.match(/category-(\d+)/)
        if (!idMatch) {
          console.log(`Could not extract subsubcategory ID from h3 id: ${h3Id}`)
          return
        }

        const subsubcategoryId = parseInt(idMatch[1])

        // For the subsubcategory name, we only want the text inside the a tag
        const aElement = $h3.find('a')
        if (aElement.length === 0) {
          console.log('Missing a element in subsubcategory h3')
          return
        }

        // Get just the text from the a element
        const subsubcategoryName = aElement.text().trim()

        // Add subsubcategory to categories list
        categories.push({
          id: subsubcategoryId,
          name: subsubcategoryName,
          parent_id: subcategoryId,
        })

        // Find the tbody element that belongs to this specific h3
        // Look for the tbody that follows this h3 and comes before the next h3 or h2
        let nextElement = $h3.next()
        let foundTbody = null

        while (nextElement.length > 0 && !nextElement.is('h2, h3')) {
          if (nextElement.is('div') && nextElement.hasClass('tbody')) {
            foundTbody = nextElement
            break
          }
          nextElement = nextElement.next()
        }

        if (!foundTbody) {
          // Try another approach - find the tbody within the same div as h3
          foundTbody = partCategoryDiv.find('.tbody').first()
        }

        if (!foundTbody || foundTbody.length === 0) {
          console.log(`No parts found for subsubcategory ${subsubcategoryName}`)
          return
        }

        // Find all parts (a elements which contain tr divs)
        const trContainers = foundTbody.find('a')

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

          // Add to temporary parts data with category level 3
          partsData.push({
            part_num: partNum,
            ba_name: partName,
            ba_cat_id: subsubcategoryId,
            category_level: 3, // Level 3 = subsubcategory
          })
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

    // Process all URLs
    for (const url of urls) {
      const result = await processUrl(url)
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

    // Write categories to CSV with proper quoting
    await writeCSV('ba_categories.csv', uniqueCategories, ['id', 'name', 'parent_id'])

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
