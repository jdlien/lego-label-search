/** @format */

const path = require('path')
const sqlite3 = require('sqlite3').verbose()
const { open } = require('sqlite')

// Database connection pool
let dbPromise = null

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

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the part ID from the query
    const { id } = req.query

    if (!id) {
      return res.status(400).json({ error: 'Part ID is required' })
    }

    const db = await openDb()

    // Find the part in the database
    const query = `
      SELECT p.part_num as id, p.name, p.part_cat_id as category_id,
             p.part_material, p.label_file, p.ba_cat_id, p.ba_name,
             c.name as category_name,
             bc.name as ba_category_name
      FROM parts p
      LEFT JOIN part_categories c ON p.part_cat_id = c.id
      LEFT JOIN ba_categories bc ON p.ba_cat_id = bc.id
      WHERE p.part_num = ?
    `

    const part = await db.get(query, id)

    if (!part) {
      return res.status(404).json({ error: 'Part not found' })
    }

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

    const alternateIds = await db.all(alternateIdsQuery, [id, id])

    // Group the alternate IDs by relationship type with descriptions
    if (alternateIds && alternateIds.length > 0) {
      const relationshipDescriptions = {
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

      part.alternatesByType = {}

      // Initialize all relationship types
      Object.keys(relationshipDescriptions).forEach((type) => {
        part.alternatesByType[type] = {
          heading: relationshipDescriptions[type].heading,
          description: relationshipDescriptions[type].description,
          ids: [],
        }
      })

      // Fill with actual data
      alternateIds.forEach((item) => {
        if (item.alt_id !== id && relationshipDescriptions[item.rel_type]) {
          part.alternatesByType[item.rel_type].ids.push(item.alt_id)
        }
      })

      // Also keep the flat list for backward compatibility
      part.alternateIds = alternateIds.map((item) => item.alt_id).filter((altId) => altId !== id)
    } else {
      part.alternateIds = []
      part.alternatesByType = {}
    }

    // Return the part details
    return res.status(200).json(part)
  } catch (error) {
    console.error('Error retrieving part:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
