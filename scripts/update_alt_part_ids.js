/** @format */
const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')

async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'lego.sqlite'),
    driver: sqlite3.Database,
  })
}

async function addAltPartIdsColumn(db) {
  console.log("Adding alt_part_ids column to parts table if it doesn't exist...")
  await db
    .run(
      `
    ALTER TABLE parts
    ADD COLUMN alt_part_ids TEXT DEFAULT NULL
  `
    )
    .catch((err) => {
      // Column might already exist, which is fine
      if (!err.message.includes('duplicate column')) {
        throw err
      }
    })
  console.log('Column added or already exists')
}

async function createIndex(db) {
  console.log('Creating index for alt_part_ids field...')
  await db.run(`
    CREATE INDEX IF NOT EXISTS idx_parts_alt_part_ids ON parts(alt_part_ids)
  `)
  console.log('Index created')
}

async function getAllPartNumbers(db) {
  console.log('Getting all part numbers...')
  const parts = await db.all('SELECT part_num FROM parts')
  return parts.map((p) => p.part_num)
}

async function getAlternatePartIds(db, partNum) {
  // Get all alternate part numbers using the same query from the API
  const alternateIdsQuery = `
    SELECT child_part_num AS alt_id
    FROM part_relationships
    WHERE rel_type IN ('M', 'R', 'T')
    AND parent_part_num = ?

    UNION

    SELECT parent_part_num AS alt_id
    FROM part_relationships
    WHERE rel_type IN ('M', 'R', 'T')
    AND child_part_num = ?
  `

  const alternateIds = await db.all(alternateIdsQuery, [partNum, partNum])

  // Filter out the current part ID
  return alternateIds.map((item) => item.alt_id).filter((altId) => altId !== partNum)
}

async function updateAltPartIds(db, partNum) {
  // Get alternate part IDs for this part
  const altIds = await getAlternatePartIds(db, partNum)

  // Convert array to comma-separated string or null if empty
  const altIdsStr = altIds.length > 0 ? altIds.join(',') : null

  // Update the alt_part_ids field in the database
  await db.run(
    `
    UPDATE parts
    SET alt_part_ids = ?
    WHERE part_num = ?
  `,
    altIdsStr,
    partNum
  )

  return altIds.length
}

async function updateAllAltPartIds(db) {
  console.log('Updating alternate part IDs for all parts...')
  const partNumbers = await getAllPartNumbers(db)

  let totalUpdated = 0
  let partsWithAlts = 0

  for (const partNum of partNumbers) {
    const count = await updateAltPartIds(db, partNum)
    if (count > 0) {
      partsWithAlts++
    }
    totalUpdated++

    // Log progress every 1000 parts
    // if (totalUpdated % 1000 === 0) {
    //   console.log(`Processed ${totalUpdated}/${partNumbers.length} parts...`)
    // }
  }

  console.log(`Updated alternate part IDs for ${totalUpdated} parts (${partsWithAlts} parts have alternates)`)
}

// Export functions for use in API routes
module.exports = {
  openDb,
  updateAltPartIds,
  updateAllAltPartIds,
}

// Only run the script if it's executed directly
if (require.main === module) {
  async function main() {
    try {
      const db = await openDb()
      console.log('Database opened')

      await addAltPartIdsColumn(db)
      await createIndex(db)
      await updateAllAltPartIds(db)

      console.log('All alternate part IDs updated successfully!')
    } catch (error) {
      console.error('Error updating alternate part IDs:', error)
    }
  }

  // Run the main function
  main()
}
