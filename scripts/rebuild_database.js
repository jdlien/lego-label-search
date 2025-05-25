#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const MigrationRunner = require('./migrations/migrate')
const DataSeeder = require('./migrations/seed_data')

const DB_PATH = path.join(__dirname, '../data/lego.sqlite')

async function rebuildDatabase() {
  try {
    console.log('🔄 Starting database rebuild...\n')

    // Remove existing database if it exists
    if (fs.existsSync(DB_PATH)) {
      console.log('🗑️  Removing existing database...')
      fs.unlinkSync(DB_PATH)
    }

    // Run migrations
    console.log('📋 Running migrations...')
    const migrationRunner = new MigrationRunner()
    await migrationRunner.run()

    console.log('\n📊 Seeding data...')
    const dataSeeder = new DataSeeder()
    await dataSeeder.seed()

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
