#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose()
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, '../../data/lego.sqlite')
const MIGRATIONS_DIR = __dirname

class MigrationRunner {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH)
  }

  async init() {
    return new Promise((resolve, reject) => {
      // Create migrations table if it doesn't exist
      this.db.run(
        `
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          filename TEXT UNIQUE NOT NULL,
          executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `,
        (err) => {
          if (err) reject(err)
          else resolve()
        }
      )
    })
  }

  async getExecutedMigrations() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT filename FROM migrations ORDER BY id', (err, rows) => {
        if (err) reject(err)
        else resolve(rows.map((row) => row.filename))
      })
    })
  }

  async executeMigration(filename) {
    const migrationPath = path.join(MIGRATIONS_DIR, filename)
    const migration = require(migrationPath)

    return new Promise(async (resolve, reject) => {
      try {
        console.log(`Executing migration: ${filename}`)
        await migration.up(this.db)

        // Record the migration as executed
        this.db.run('INSERT INTO migrations (filename) VALUES (?)', [filename], (err) => {
          if (err) reject(err)
          else {
            console.log(`✓ Migration ${filename} completed`)
            resolve()
          }
        })
      } catch (error) {
        reject(error)
      }
    })
  }

  async run() {
    try {
      await this.init()

      // Get all migration files
      const migrationFiles = fs
        .readdirSync(MIGRATIONS_DIR)
        .filter((file) => file.match(/^\d{4}_.*\.js$/))
        .sort()

      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations()

      // Find pending migrations
      const pendingMigrations = migrationFiles.filter((file) => !executedMigrations.includes(file))

      if (pendingMigrations.length === 0) {
        console.log('No pending migrations')
        return
      }

      console.log(`Found ${pendingMigrations.length} pending migrations`)

      // Execute pending migrations
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration)
      }

      console.log('All migrations completed successfully!')
    } catch (error) {
      console.error('Migration failed:', error)
      process.exit(1)
    } finally {
      this.db.close()
    }
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  const runner = new MigrationRunner()
  runner.run()
}

module.exports = MigrationRunner
