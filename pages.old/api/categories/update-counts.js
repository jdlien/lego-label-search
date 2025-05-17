/** @format */

const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')
const { updateAllCategoryCounts } = require('../../../scripts/update_category_counts')

// Database connection
async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'data', 'lego.sqlite'),
    driver: sqlite3.Database,
  })
}

export default async function handler(req, res) {
  // Only allow POST requests to trigger updates
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('Opening database connection...')
    const db = await openDb()
    console.log('Database connection opened')

    // Update all category counts
    console.log('Updating all category counts...')
    await updateAllCategoryCounts(db)
    console.log('All category counts updated successfully')

    // Return success
    return res.status(200).json({
      message: 'All category counts updated successfully',
    })
  } catch (error) {
    console.error('Error updating category counts:', error)

    // Return error
    return res.status(500).json({
      message: 'An error occurred while updating category counts',
      error: error.message,
    })
  }
}
