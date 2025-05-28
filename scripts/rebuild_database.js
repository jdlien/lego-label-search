#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const MigrationRunner = require('./migrations/migrate')
const DataSeeder = require('./migrations/seed_data')

const DB_PATH = path.join(__dirname, '../data/lego.sqlite')
const BACKUP_PATH = path.join(__dirname, '../data/lego.backup.sqlite')

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

async function rebuildDatabase() {
  try {
    const startTime = Date.now()
    console.log(c('cyan', '🔄 LEGO Database Rebuild Tool'))
    console.log()

    // Remove or overwrite existing backup if it exists
    if (fs.existsSync(BACKUP_PATH)) {
      fs.unlinkSync(BACKUP_PATH)
    }

    // Move existing database to backup if it exists
    if (fs.existsSync(DB_PATH)) {
      console.log(c('yellow', '🗂️  Backing up existing database...'))
      fs.renameSync(DB_PATH, BACKUP_PATH)
      console.log(`   ${c('green', '✓')} Saved as lego.backup.sqlite`)
    }

    // Run migrations
    console.log(c('blue', '\n📋 Running migrations...'))
    const migrationRunner = new MigrationRunner()
    await migrationRunner.run()

    // console.log(c('magenta', '\n📊 Seeding data...'))
    console.log()
    const dataSeeder = new DataSeeder()
    await dataSeeder.seed()

    // Run computed fields update
    console.log(c('cyan', '\n🛠️  Updating computed fields...'))
    const { spawnSync } = require('child_process')
    const computedFieldsScript = path.join(__dirname, 'maintenance', 'update_computed_fields.js')
    const result = spawnSync('node', [computedFieldsScript], { stdio: 'inherit' })
    if (result.status !== 0) {
      console.error(c('red', '❌ Computed fields update failed.'))
      process.exit(1)
    }

    const endTime = Date.now()
    const totalDuration = ((endTime - startTime) / 1000).toFixed(1)
    console.log()
    console.log(c('green', '✓ Database Rebuild Complete!'))
    console.log(c('bright', '============================'))

    // Show database info
    const stats = fs.statSync(DB_PATH)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(c('dim', `Location: ${DB_PATH}`))
    console.log(c('dim', `Size: ${fileSizeInMB} MB`))
    console.log(c('dim', `⏱️  Total time: ${totalDuration}s`))
    console.log()
  } catch (error) {
    console.log()
    console.log(c('red', '❌ Database Rebuild Failed!'))
    console.log(c('bright', '==========================='))
    console.error(c('red', error.message))
    process.exit(1)
  }
}

// Run rebuild if this script is executed directly
if (require.main === module) {
  rebuildDatabase()
}

module.exports = rebuildDatabase
