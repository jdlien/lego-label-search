/** @format */

const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')

async function main() {
  console.log('Adding performance indexes to the database...')

  const db = await open({
    filename: path.join(process.cwd(), 'data', 'lego.sqlite'),
    driver: sqlite3.Database,
  })

  // Start a transaction for all operations
  await db.run('BEGIN TRANSACTION')

  try {
    // Create index for part number (if doesn't already exist)
    console.log('Adding index for part_num field...')
    await db.run('CREATE INDEX IF NOT EXISTS idx_parts_part_num ON parts(part_num)')

    // Create index for name field
    console.log('Adding index for name field...')
    await db.run('CREATE INDEX IF NOT EXISTS idx_parts_name ON parts(name)')

    // Create index for ba_name field
    console.log('Adding index for ba_name field...')
    await db.run('CREATE INDEX IF NOT EXISTS idx_parts_ba_name ON parts(ba_name)')

    // Create index for ba_cat_id since it's heavily used in filtering
    console.log('Adding index for ba_cat_id field...')
    await db.run('CREATE INDEX IF NOT EXISTS idx_parts_ba_cat_id ON parts(ba_cat_id)')

    // Commit all changes
    await db.run('COMMIT')
    console.log('All indexes created successfully')

    // Analyze the database to optimize query planning
    console.log('Analyzing database...')
    await db.run('ANALYZE')

    console.log('Database optimization completed!')
  } catch (error) {
    // Rollback in case of any error
    await db.run('ROLLBACK')
    console.error('Error adding indexes:', error)
  } finally {
    await db.close()
  }
}

main().catch(console.error)
