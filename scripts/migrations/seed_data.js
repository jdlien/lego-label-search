#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const DB_PATH = path.join(__dirname, '../../data/lego.sqlite')
const DATA_DIR = path.join(__dirname, '../../data')

class DataSeeder {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH)
  }

  async seedColors() {
    console.log('Seeding colors...')
    return new Promise((resolve, reject) => {
      const colors = []

      fs.createReadStream(path.join(DATA_DIR, 'colors.csv'))
        .pipe(csv())
        .on('data', (row) => {
          colors.push([
            parseInt(row.id),
            row.name,
            row.rgb,
            parseInt(row.is_trans) || 0,
            parseInt(row.num_parts) || 0,
            parseInt(row.num_sets) || 0,
            parseInt(row.y1) || null,
            parseInt(row.y2) || null,
          ])
        })
        .on('end', () => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO colors
            (id, name, rgb, is_trans, num_parts, num_sets, y1, y2)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)

          colors.forEach((color) => stmt.run(color))
          stmt.finalize((err) => {
            if (err) reject(err)
            else {
              console.log(`✓ Imported ${colors.length} colors`)
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedPartCategories() {
    console.log('Seeding part categories...')
    return new Promise((resolve, reject) => {
      const categories = []

      fs.createReadStream(path.join(DATA_DIR, 'part_categories.csv'))
        .pipe(csv())
        .on('data', (row) => {
          categories.push([parseInt(row.id), row.name])
        })
        .on('end', () => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO part_categories (id, name) VALUES (?, ?)
          `)

          categories.forEach((cat) => stmt.run(cat))
          stmt.finalize((err) => {
            if (err) reject(err)
            else {
              console.log(`✓ Imported ${categories.length} part categories`)
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedBaCategories() {
    console.log('Seeding Rebrickable categories...')
    return new Promise((resolve, reject) => {
      const categories = []

      fs.createReadStream(path.join(DATA_DIR, 'ba_categories.csv'))
        .pipe(csv())
        .on('data', (row) => {
          categories.push([parseInt(row.id), row.name, row.parent_id ? parseInt(row.parent_id) : null])
        })
        .on('end', () => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO ba_categories (id, name, parent_id) VALUES (?, ?, ?)
          `)

          categories.forEach((cat) => stmt.run(cat))
          stmt.finalize((err) => {
            if (err) reject(err)
            else {
              console.log(`✓ Imported ${categories.length} Rebrickable categories`)
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedParts() {
    console.log('Seeding parts...')
    return new Promise((resolve, reject) => {
      const parts = []

      fs.createReadStream(path.join(DATA_DIR, 'parts.csv'))
        .pipe(csv())
        .on('data', (row) => {
          parts.push([
            row.part_num,
            row.name,
            row.part_cat_id ? parseInt(row.part_cat_id) : null,
            row.part_material || null,
          ])
        })
        .on('end', () => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO parts (part_num, name, part_cat_id, part_material)
            VALUES (?, ?, ?, ?)
          `)

          parts.forEach((part) => stmt.run(part))
          stmt.finalize((err) => {
            if (err) reject(err)
            else {
              console.log(`✓ Imported ${parts.length} parts`)
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedBaParts() {
    console.log('Updating parts with BrickArchitect data...')
    return new Promise((resolve, reject) => {
      const updates = []

      fs.createReadStream(path.join(DATA_DIR, 'ba_parts.csv'))
        .pipe(csv())
        .on('data', (row) => {
          updates.push([row.part_num, row.ba_name, row.ba_cat_id ? parseInt(row.ba_cat_id) : null])
        })
        .on('end', () => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO parts (part_num, name, ba_name, ba_cat_id)
            VALUES (?, COALESCE((SELECT name FROM parts WHERE part_num = ?), ?), ?, ?)
          `)

          updates.forEach((update) => {
            const [part_num, ba_name, ba_cat_id] = update
            stmt.run([part_num, part_num, ba_name, ba_name, ba_cat_id])
          })
          stmt.finalize((err) => {
            if (err) reject(err)
            else {
              console.log(`✓ Updated ${updates.length} parts with BrickArchitect data`)
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedElements() {
    console.log('Seeding elements...')
    return new Promise((resolve, reject) => {
      const elements = []

      fs.createReadStream(path.join(DATA_DIR, 'elements.csv'))
        .pipe(csv())
        .on('data', (row) => {
          elements.push([row.element_id, row.part_num, parseInt(row.color_id), row.design_id || null])
        })
        .on('end', () => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO elements (element_id, part_num, color_id, design_id)
            VALUES (?, ?, ?, ?)
          `)

          elements.forEach((element) => stmt.run(element))
          stmt.finalize((err) => {
            if (err) reject(err)
            else {
              console.log(`✓ Imported ${elements.length} elements`)
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedPartRelationships() {
    console.log('Seeding part relationships...')
    return new Promise((resolve, reject) => {
      const relationships = []

      fs.createReadStream(path.join(DATA_DIR, 'part_relationships.csv'))
        .pipe(csv())
        .on('data', (row) => {
          relationships.push([row.rel_type, row.child_part_num, row.parent_part_num])
        })
        .on('end', () => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO part_relationships (rel_type, child_part_num, parent_part_num)
            VALUES (?, ?, ?)
          `)

          relationships.forEach((rel) => stmt.run(rel))
          stmt.finalize((err) => {
            if (err) reject(err)
            else {
              console.log(`✓ Imported ${relationships.length} part relationships`)
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seed() {
    try {
      console.log('Starting data seeding...')

      await this.seedColors()
      await this.seedPartCategories()
      await this.seedBaCategories()
      await this.seedParts()
      await this.seedBaParts()
      await this.seedElements()
      await this.seedPartRelationships()

      console.log('Creating indexes...')
      await this.createIndexes()

      console.log('✅ All data seeded successfully!')
    } catch (error) {
      console.error('❌ Seeding failed:', error)
      process.exit(1)
    } finally {
      this.db.close()
    }
  }

  async createIndexes() {
    // Create indexes for better performance
    await new Promise((resolve, reject) => {
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_parts_ba_cat_id ON parts(ba_cat_id)`, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    await new Promise((resolve, reject) => {
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_ba_categories_parent_id ON ba_categories(parent_id)`, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    await new Promise((resolve, reject) => {
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_parts_alt_part_ids ON parts(alt_part_ids)`, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })

    await new Promise((resolve, reject) => {
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_parts_example_design_id ON parts(example_design_id)`, (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  }
}

// Run seeder if this script is executed directly
if (require.main === module) {
  const seeder = new DataSeeder()
  seeder.seed()
}

module.exports = DataSeeder
