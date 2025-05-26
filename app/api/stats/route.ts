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
    const db = await openDb()

    // Get total number of parts
    const partsResult = await db.get('SELECT COUNT(*) as count FROM parts')
    const totalParts = partsResult?.count || 0

    // Get total number of categories
    const categoriesResult = await db.get('SELECT COUNT(*) as count FROM ba_categories')
    const totalCategories = categoriesResult?.count || 0

    // Get number of top-level categories (parent_id = 0 or NULL)
    const topLevelCategoriesResult = await db.get(
      'SELECT COUNT(*) as count FROM ba_categories WHERE parent_id = 0 OR parent_id IS NULL'
    )
    const topLevelCategories = topLevelCategoriesResult?.count || 0

    // Get number of unique images (distinct image files)
    const uniqueImagesResult = await db.get(
      'SELECT COUNT(DISTINCT img_file) as count FROM parts WHERE has_img = 1 AND img_file IS NOT NULL'
    )
    const uniqueImages = uniqueImagesResult?.count || 0

    return NextResponse.json({
      totalParts,
      totalCategories,
      topLevelCategories,
      uniqueImages,
    })
  } catch (error: unknown) {
    console.error('Stats error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        message: 'An error occurred while fetching statistics',
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
