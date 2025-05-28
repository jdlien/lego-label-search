#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const MigrationRunner = require('./migrations/migrate')
const DataSeeder = require('./migrations/seed_data')

const DB_PATH = path.join(__dirname, '../data/lego.sqlite')
const BACKUP_PATH = path.join(__dirname, '../data/lego.backup.sqlite')

async function rebuildDatabase() {
  try {
    console.log('🔄 Starting database rebuild...\n')

    // Remove or overwrite existing backup if it exists
    if (fs.existsSync(BACKUP_PATH)) {
      fs.unlinkSync(BACKUP_PATH)
    }

    // Move existing database to backup if it exists
    if (fs.existsSync(DB_PATH)) {
      console.log('🗂️  Backing up existing database to lego.backup.sqlite...')
      fs.renameSync(DB_PATH, BACKUP_PATH)
    }

    // Run migrations
    console.log('📋 Running migrations...')
    const migrationRunner = new MigrationRunner()
    await migrationRunner.run()

    console.log('\n📊 Seeding data...')
    const dataSeeder = new DataSeeder()
    await dataSeeder.seed()

    // Run computed fields update
    console.log('\n🛠️  Updating computed fields...')
    const { spawnSync } = require('child_process')
    const computedFieldsScript = path.join(__dirname, 'maintenance', 'update_computed_fields.js')
    const result = spawnSync('node', [computedFieldsScript], { stdio: 'inherit' })
    if (result.status !== 0) {
      console.error('❌ Computed fields update failed.')
      process.exit(1)
    }

    console.log('\n✅ Database rebuild completed successfully!')
    console.log(`📍 Database location: ${DB_PATH}`)

    // Show database size
    const stats = fs.statSync(DB_PATH)
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)
    console.log(`📏 Database size: ${fileSizeInMB} MB`)
  } catch (error) {
    console.error('❌ Database rebuild failed:', error)
    process.exit(1)
  }
}

// Run rebuild if this script is executed directly
if (require.main === module) {
  rebuildDatabase()
}

module.exports = rebuildDatabase
