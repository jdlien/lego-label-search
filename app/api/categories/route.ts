import { NextResponse } from 'next/server'
import path from 'path'
import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'

// Database connection pool
let dbPromise: Promise<Database> | null = null

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
  } catch (error: unknown) {
    console.error('Categories error:', error)
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    const errorStack = error instanceof Error ? error.stack : undefined

    return NextResponse.json(
      {
        message: 'An error occurred while fetching categories',
        error: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    )
  }
}
