import { NextRequest, NextResponse } from 'next/server'
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

type RelationshipType = 'A' | 'M' | 'R' | 'T'

interface RelationshipDescription {
  heading: string
  description: string
  ids: string[]
}

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
  example_design_id: string
  image_url?: string
  description?: string
  category?: string
  alternateIds?: string[]
  alternatesByType?: Record<RelationshipType, RelationshipDescription>
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: partId } = await params

  if (!partId) {
    return NextResponse.json({ error: 'Part ID is required' }, { status: 400 })
  }

  console.log(`Looking up part ID: ${partId}`)

  try {
    console.log(`Opening database connection for part ${partId}`)
    const db = await openDb()

    // Find the part in the database with the same query structure as search API
    const query = `
      SELECT p.part_num as id, p.name, p.part_cat_id as category_id,
             p.part_material, p.label_file, p.ba_cat_id, p.ba_name,
             c.name as category_name, b.name as ba_category_name,
             parent.id as parent_cat_id, parent.name as parent_category,
             grandparent.id as grandparent_cat_id, grandparent.name as grandparent_category,
             p.alt_part_ids, p.example_design_id
      FROM parts p
      LEFT JOIN part_categories c ON p.part_cat_id = c.id
      LEFT JOIN ba_categories b ON p.ba_cat_id = b.id
      LEFT JOIN ba_categories parent ON b.parent_id = parent.id
      LEFT JOIN ba_categories grandparent ON parent.parent_id = grandparent.id
      WHERE p.part_num = ?
    `

    console.log(`Executing query for part ${partId}`)
    const part: Part | undefined = await db.get(query, partId)

    if (!part) {
      console.log(`Part ${partId} not found in database`)
      return NextResponse.json({ error: 'Part not found' }, { status: 404 })
    }

    console.log(`Found part ${partId}: ${part.name}`)

    // Enhance the part data for the modal
    part.description = part.ba_category_name || part.category_name
    part.category = part.category_name

    // Generate image URL (same logic as PartCard)
    const normalizedPartId = part.id.replace(/^0+/, '')
    part.image_url = `/data/images/${normalizedPartId}.webp`

    // Get alternate part numbers (parts that are functionally equivalent)
    const alternateIdsQuery = `
      SELECT child_part_num AS alt_id, rel_type
      FROM part_relationships
      WHERE rel_type IN ('A', 'M', 'R', 'T')
      AND parent_part_num = ?

      UNION

      SELECT parent_part_num AS alt_id, rel_type
      FROM part_relationships
      WHERE rel_type IN ('A', 'M', 'R', 'T')
      AND child_part_num = ?
    `

    const alternateIds: { alt_id: string; rel_type: RelationshipType }[] = await db.all(alternateIdsQuery, [
      partId,
      partId,
    ])

    // Group the alternate IDs by relationship type with descriptions
    if (alternateIds && alternateIds.length > 0) {
      const relationshipDescriptions: Record<RelationshipType, { heading: string; description: string }> = {
        R: {
          heading: 'Replacement',
          description: 'LEGO replacement part that supersedes this one.',
        },
        M: {
          heading: 'Mold Variant',
          description: 'Same function with minor mold changes.',
        },
        T: {
          heading: 'Alias',
          description: 'Alternative part number, with no difference.',
        },
        A: {
          heading: 'Alternate Part',
          description: 'Other parts that may perform the same function.',
        },
      }

      part.alternatesByType = {} as Record<RelationshipType, RelationshipDescription>

      // Initialize all relationship types
      Object.keys(relationshipDescriptions).forEach((type) => {
        const relType = type as RelationshipType
        part.alternatesByType![relType] = {
          heading: relationshipDescriptions[relType].heading,
          description: relationshipDescriptions[relType].description,
          ids: [],
        }
      })

      // Fill with actual data
      alternateIds.forEach((item) => {
        if (item.alt_id !== partId && relationshipDescriptions[item.rel_type]) {
          part.alternatesByType![item.rel_type].ids.push(item.alt_id)
        }
      })

      // Also keep the flat list for backward compatibility
      part.alternateIds = alternateIds.map((item) => item.alt_id).filter((altId) => altId !== partId)
    } else {
      part.alternateIds = []
      part.alternatesByType = {} as Record<RelationshipType, RelationshipDescription>
    }

    // Return the part details
    return NextResponse.json(part)
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Error retrieving part:', err)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      { status: 500 }
    )
  }
}
