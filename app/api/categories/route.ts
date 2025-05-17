import { NextResponse } from 'next/server'
import path from 'path'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

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

export async function GET() {
  try {
    console.log('Opening database connection...')
    const db = await openDb()
    console.log('Database connection opened')

    // Get all categories from the ba_categories table
    // Use the cached parts_count column that's updated by our background script
    console.log('Fetching categories from ba_categories table...')
    const categories = await db.all(`
      SELECT
        id,
        name,
        CASE
          WHEN parent_id = 0 OR parent_id IS NULL THEN ''
          ELSE CAST(parent_id AS TEXT)
        END AS parent_id,
        sort_order,
        parts_count
      FROM ba_categories
      ORDER BY sort_order, name
    `)
    console.log(`Fetched ${categories.length} categories`)

    // Return all categories
    return NextResponse.json({
      categories,
      total: categories.length,
    })
  } catch (error: any) {
    console.error('Categories error:', error)
    // Return more detailed error information
    return NextResponse.json(
      {
        message: 'An error occurred while fetching categories',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
