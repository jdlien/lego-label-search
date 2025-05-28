#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const DB_PATH = path.join(__dirname, '../../data/lego.sqlite')
const DATA_DIR = path.join(__dirname, '../../data')

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

const c = (color, text) => `${colors[color]}${text}${colors.reset}`

// Progress bar function (for future use)
const progressBar = (current, total, label) => {
  const percentage = Math.round((current / total) * 100)
  const barLength = 20
  const filledLength = Math.round((barLength * current) / total)
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength)
  return `${c('dim', label)} ${c('cyan', bar)} ${c('bright', percentage + '%')} ${c('dim', `(${current.toLocaleString()}/${total.toLocaleString()})`)}`
}

class DataSeeder {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH)
  }

  async seedColors() {
    console.log(c('yellow', '🎨 Seeding colors...'))
    const startTime = Date.now()

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
              const duration = ((Date.now() - startTime) / 1000).toFixed(1)
              console.log(
                `   ${c('green', '✓')} Imported ${c('bright', colors.length.toLocaleString())} colors in ${c('cyan', duration + 's')}`
              )
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedPartCategories() {
    console.log(c('blue', '📂 Seeding part categories...'))
    const startTime = Date.now()

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
              const duration = ((Date.now() - startTime) / 1000).toFixed(1)
              console.log(
                `   ${c('green', '✓')} Imported ${c('bright', categories.length.toLocaleString())} part categories in ${c('cyan', duration + 's')}`
              )
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedBaCategories() {
    console.log(c('magenta', '🏗️  Seeding BrickArchitect categories...'))
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      const categories = []

      fs.createReadStream(path.join(DATA_DIR, 'ba_categories.csv'))
        .pipe(csv())
        .on('data', (row) => {
          categories.push([
            parseInt(row.id),
            row.name,
            row.parent_id ? parseInt(row.parent_id) : null,
            row.level ? parseInt(row.level) : 0,
            row.sort_order ? parseInt(row.sort_order) : null,
            row.description || null,
          ])
        })
        .on('end', () => {
          const stmt = this.db.prepare(`
            INSERT OR REPLACE INTO ba_categories (id, name, parent_id, level, sort_order, description)
            VALUES (?, ?, ?, ?, ?, ?)
          `)

          categories.forEach((cat) => stmt.run(cat))
          stmt.finalize((err) => {
            if (err) reject(err)
            else {
              const duration = ((Date.now() - startTime) / 1000).toFixed(1)
              console.log(
                `   ${c('green', '✓')} Imported ${c('bright', categories.length.toLocaleString())} BrickArchitect categories in ${c('cyan', duration + 's')}`
              )
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedParts() {
    console.log(c('red', '🧱 Seeding parts...'))
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      let count = 0
      const batchSize = 10000 // Larger batch size for better performance
      let batch = []

      // First, clear the parts table since we're doing a fresh load
      this.db.run('DELETE FROM parts', (err) => {
        if (err) {
          reject(err)
          return
        }

        // Set pragmas for maximum insert performance
        this.db.serialize(() => {
          this.db.run('PRAGMA synchronous = OFF')
          this.db.run('PRAGMA journal_mode = MEMORY')
          this.db.run('PRAGMA cache_size = 10000')
          this.db.run('PRAGMA locking_mode = EXCLUSIVE')
          this.db.run('PRAGMA temp_store = MEMORY')

          // Start a transaction for much faster bulk inserts
          this.db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              reject(err)
              return
            }

            const stmt = this.db.prepare(`
              INSERT INTO parts (part_num, name, part_cat_id, part_material)
              VALUES (?, ?, ?, ?)
            `)

            const processBatch = () => {
              batch.forEach((part) => stmt.run(part))
              count += batch.length
              batch = []
            }

            fs.createReadStream(path.join(DATA_DIR, 'parts.csv'))
              .pipe(csv())
              .on('data', (row) => {
                batch.push([
                  row.part_num,
                  row.name,
                  row.part_cat_id ? parseInt(row.part_cat_id) : null,
                  row.part_material || null,
                ])

                // Process batch when it reaches the size limit
                if (batch.length >= batchSize) {
                  processBatch()
                }
              })
              .on('end', () => {
                // Process any remaining parts
                if (batch.length > 0) {
                  processBatch()
                }

                stmt.finalize((err) => {
                  if (err) {
                    this.db.run('ROLLBACK', () => reject(err))
                  } else {
                    // Commit the transaction
                    this.db.run('COMMIT', (err) => {
                      if (err) reject(err)
                      else {
                        // Reset pragmas back to safe defaults
                        this.db.serialize(() => {
                          this.db.run('PRAGMA synchronous = NORMAL')
                          this.db.run('PRAGMA journal_mode = DELETE')
                          this.db.run('PRAGMA locking_mode = NORMAL')

                          const duration = ((Date.now() - startTime) / 1000).toFixed(1)
                          console.log(
                            `   ${c('green', '✓')} Imported ${c('bright', count.toLocaleString())} parts in ${c('cyan', duration + 's')}`
                          )
                          resolve()
                        })
                      }
                    })
                  }
                })
              })
              .on('error', (err) => {
                this.db.run('ROLLBACK', () => reject(err))
              })
          })
        })
      })
    })
  }

  async seedBaParts() {
    console.log(c('cyan', '🔄 Updating parts with BrickArchitect data...'))
    const startTime = Date.now()

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
              const duration = ((Date.now() - startTime) / 1000).toFixed(1)
              console.log(
                `   ${c('green', '✓')} Updated ${c('bright', updates.length.toLocaleString())} parts with BrickArchitect data in ${c('cyan', duration + 's')}`
              )
              resolve()
            }
          })
        })
        .on('error', reject)
    })
  }

  async seedElements() {
    console.log(c('green', '⚛️  Seeding elements...'))
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      let count = 0
      const batchSize = 10000 // Larger batch size for better performance
      let batch = []

      // First, clear the elements table since we're doing a fresh load
      this.db.run('DELETE FROM elements', (err) => {
        if (err) {
          reject(err)
          return
        }

        // Set pragmas for maximum insert performance
        this.db.serialize(() => {
          this.db.run('PRAGMA synchronous = OFF')
          this.db.run('PRAGMA journal_mode = MEMORY')
          this.db.run('PRAGMA cache_size = 10000')
          this.db.run('PRAGMA locking_mode = EXCLUSIVE')
          this.db.run('PRAGMA temp_store = MEMORY')

          // Start a transaction for much faster bulk inserts
          this.db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              reject(err)
              return
            }

            const stmt = this.db.prepare(`
              INSERT INTO elements (element_id, part_num, color_id, design_id)
              VALUES (?, ?, ?, ?)
            `)

            const processBatch = () => {
              batch.forEach((element) => stmt.run(element))
              count += batch.length
              batch = []
            }

            fs.createReadStream(path.join(DATA_DIR, 'elements.csv'))
              .pipe(csv())
              .on('data', (row) => {
                batch.push([row.element_id, row.part_num, parseInt(row.color_id), row.design_id || null])

                // Process batch when it reaches the size limit
                if (batch.length >= batchSize) {
                  processBatch()
                }
              })
              .on('end', () => {
                // Process any remaining elements
                if (batch.length > 0) {
                  processBatch()
                }

                stmt.finalize((err) => {
                  if (err) {
                    this.db.run('ROLLBACK', () => reject(err))
                  } else {
                    // Commit the transaction
                    this.db.run('COMMIT', (err) => {
                      if (err) reject(err)
                      else {
                        // Reset pragmas back to safe defaults
                        this.db.serialize(() => {
                          this.db.run('PRAGMA synchronous = NORMAL')
                          this.db.run('PRAGMA journal_mode = DELETE')
                          this.db.run('PRAGMA locking_mode = NORMAL')

                          const duration = ((Date.now() - startTime) / 1000).toFixed(1)
                          console.log(
                            `   ${c('green', '✓')} Imported ${c('bright', count.toLocaleString())} elements in ${c('cyan', duration + 's')}`
                          )
                          resolve()
                        })
                      }
                    })
                  }
                })
              })
              .on('error', (err) => {
                this.db.run('ROLLBACK', () => reject(err))
              })
          })
        })
      })
    })
  }

  async seedPartRelationships() {
    console.log(c('white', '🔗 Seeding part relationships...'))
    const startTime = Date.now()

    return new Promise((resolve, reject) => {
      let count = 0
      const batchSize = 10000
      let batch = []

      // First, clear the part_relationships table since we're doing a fresh load
      this.db.run('DELETE FROM part_relationships', (err) => {
        if (err) {
          reject(err)
          return
        }

        // Set pragmas for maximum insert performance
        this.db.serialize(() => {
          this.db.run('PRAGMA synchronous = OFF')
          this.db.run('PRAGMA journal_mode = MEMORY')
          this.db.run('PRAGMA cache_size = 10000')
          this.db.run('PRAGMA locking_mode = EXCLUSIVE')
          this.db.run('PRAGMA temp_store = MEMORY')

          // Start a transaction for much faster bulk inserts
          this.db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              reject(err)
              return
            }

            const stmt = this.db.prepare(`
              INSERT INTO part_relationships (rel_type, child_part_num, parent_part_num)
              VALUES (?, ?, ?)
            `)

            const processBatch = () => {
              batch.forEach((rel) => stmt.run(rel))
              count += batch.length
              batch = []
            }

            fs.createReadStream(path.join(DATA_DIR, 'part_relationships.csv'))
              .pipe(csv())
              .on('data', (row) => {
                batch.push([row.rel_type, row.child_part_num, row.parent_part_num])

                // Process batch when it reaches the size limit
                if (batch.length >= batchSize) {
                  processBatch()
                }
              })
              .on('end', () => {
                // Process any remaining relationships
                if (batch.length > 0) {
                  processBatch()
                }

                stmt.finalize((err) => {
                  if (err) {
                    this.db.run('ROLLBACK', () => reject(err))
                  } else {
                    // Commit the transaction
                    this.db.run('COMMIT', (err) => {
                      if (err) reject(err)
                      else {
                        // Reset pragmas back to safe defaults
                        this.db.serialize(() => {
                          this.db.run('PRAGMA synchronous = NORMAL')
                          this.db.run('PRAGMA journal_mode = DELETE')
                          this.db.run('PRAGMA locking_mode = NORMAL')

                          const duration = ((Date.now() - startTime) / 1000).toFixed(1)
                          console.log(
                            `   ${c('green', '✓')} Imported ${c('bright', count.toLocaleString())} part relationships in ${c('cyan', duration + 's')}`
                          )
                          resolve()
                        })
                      }
                    })
                  }
                })
              })
              .on('error', (err) => {
                this.db.run('ROLLBACK', () => reject(err))
              })
          })
        })
      })
    })
  }

  async seed() {
    try {
      console.log(c('cyan', '📊 Data Seeding'))
      console.log()
      const totalStartTime = Date.now()

      await this.seedColors()
      await this.seedPartCategories()
      await this.seedBaCategories()
      await this.seedParts()
      await this.seedBaParts()
      await this.seedElements()
      await this.seedPartRelationships()

      console.log(c('dim', '🔧 Creating indexes...'))
      await this.createIndexes()

      const totalDuration = ((Date.now() - totalStartTime) / 1000).toFixed(1)
      console.log()
      console.log(c('green', '✓ Seeding Complete!'))
      console.log(c('dim', `⏱️  Total time: ${totalDuration}s`))
      console.log()
    } catch (error) {
      console.log()
      console.log(c('red', '❌ Seeding Failed!'))
      console.log(c('bright', '==============='))
      console.error(c('red', error.message))
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
