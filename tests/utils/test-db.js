const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')
const fs = require('fs').promises
const { execSync } = require('child_process')

const TEST_DB_PATH = path.join(__dirname, '../test-lego.sqlite')

let testDb = null

/**
 * Creates a test database using the actual migration scripts
 * @param {boolean} useInMemory - If true, creates an in-memory database instead of file-based
 */
async function createTestDatabase(useInMemory = false) {
  if (!useInMemory) {
    // Remove existing test database if it exists
    try {
      await fs.unlink(TEST_DB_PATH)
    } catch (error) {
      // File doesn't exist, which is fine
    }
  }

  const dbPath = useInMemory ? ':memory:' : TEST_DB_PATH
  
  // If using in-memory, we need to manually run migrations
  if (useInMemory) {
    const db = await open({
      filename: ':memory:',
      driver: sqlite3.Database,
    })
    
    // Run migrations directly on in-memory database
    const MigrationRunner = require(path.join(__dirname, '../../scripts/migrations/migrate.js'))
    const runner = new MigrationRunner()
    runner.db = db.db // Use the underlying sqlite3 database
    await runner.init()
    
    // Manually execute migration files
    const migrationsDir = path.join(__dirname, '../../scripts/migrations')
    const migrationFiles = require('fs').readdirSync(migrationsDir)
      .filter(file => file.match(/^\d{4}_.*\.js$/))
      .sort()
    
    for (const file of migrationFiles) {
      const migration = require(path.join(migrationsDir, file))
      await migration.up(db.db)
    }
    
    return db
  } else {
    // Run the migration script to create a fresh test database
    console.log('Creating test database using migrations...')
    
    // Set environment variable to use test database
    const env = { ...process.env, DB_PATH: TEST_DB_PATH }
    
    // Run the migration script
    execSync('node scripts/migrations/migrate.js', {
      cwd: path.join(__dirname, '../..'),
      env: env,
      stdio: 'inherit'
    })

    console.log('Test database created successfully')
  }
}

/**
 * Opens a connection to the test database
 * @param {boolean} useInMemory - If true, returns the in-memory database connection
 */
async function openTestDatabase(useInMemory = false) {
  if (testDb) return testDb

  if (useInMemory) {
    // For in-memory, createTestDatabase returns the db connection
    return await createTestDatabase(true)
  }

  testDb = await open({
    filename: TEST_DB_PATH,
    driver: sqlite3.Database,
  })

  // Enable foreign keys
  await testDb.run('PRAGMA foreign_keys = ON')

  return testDb
}

/**
 * Sets up a fresh test database with minimal seed data
 * @param {boolean} useInMemory - If true, uses an in-memory database for faster tests
 */
async function setupTestDatabase(useInMemory = false) {
  if (useInMemory) {
    const db = await createTestDatabase(true)
    await seedMinimalTestData(db)
    return db
  } else {
    await createTestDatabase(false)
    const db = await openTestDatabase(false)
    await seedMinimalTestData(db)
    return db
  }
}

/**
 * Clears all data from the test database
 */
async function clearTestDatabase(db) {
  if (!db) return

  // Disable foreign keys temporarily for cleanup
  await db.run('PRAGMA foreign_keys = OFF')

  // Delete data in reverse order of foreign key dependencies
  await db.exec(`
    DELETE FROM part_relationships;
    DELETE FROM elements;
    DELETE FROM parts;
    DELETE FROM ba_categories;
    DELETE FROM part_categories;
    DELETE FROM colors;
  `)

  // Re-enable foreign keys
  await db.run('PRAGMA foreign_keys = ON')
}

/**
 * Closes the test database connection and removes the test database file
 */
async function closeTestDatabase() {
  if (testDb) {
    await testDb.close()
    testDb = null
  }

  // Remove the test database file
  try {
    await fs.unlink(TEST_DB_PATH)
  } catch (error) {
    // File might not exist, which is fine
  }
}

/**
 * Seeds the database with minimal test data for API testing
 * This is a focused subset of data specifically for testing various scenarios
 */
async function seedMinimalTestData(db) {
  // Insert test colors - minimal set for testing
  await db.exec(`
    INSERT INTO colors (id, name, rgb, is_trans) VALUES
    (0, 'Black', '1B2A34', 0),
    (1, 'Blue', '1E5AA8', 0),
    (4, 'Red', 'DD1A21', 0),
    (7, 'Light Gray', 'B0B0B0', 0),
    (14, 'Yellow', 'FED557', 0),
    (15, 'White', 'FFFFFF', 0),
    (40, 'Trans-Clear', 'FCFCFC', 1),
    (71, 'Light Bluish Gray', 'A0A5A9', 0),
    (72, 'Dark Bluish Gray', '6C6E68', 0);
  `)

  // Insert test part categories
  await db.exec(`
    INSERT INTO part_categories (id, name) VALUES
    (1, 'Basic Bricks'),
    (2, 'Plates'),
    (3, 'Slopes'),
    (4, 'Technic'),
    (5, 'Decorative Elements');
  `)

  // Insert test BA categories with hierarchy for testing recursive queries
  await db.exec(`
    INSERT INTO ba_categories (id, name, parent_id, parts_count, sort_order, level) VALUES
    -- Top level categories
    (1, 'Bricks', NULL, 0, 1, 0),
    (2, 'Plates', NULL, 0, 2, 0),
    (3, 'Slopes', NULL, 0, 3, 0),
    (4, 'Technic', NULL, 0, 4, 0),
    
    -- Subcategories for Bricks
    (10, 'Basic Bricks', 1, 0, 1, 1),
    (11, 'Modified Bricks', 1, 0, 2, 1),
    (12, 'Bricks with Studs on Side', 11, 0, 1, 2),
    
    -- Subcategories for Plates
    (20, 'Basic Plates', 2, 0, 1, 1),
    (21, 'Modified Plates', 2, 0, 2, 1),
    (22, 'Plates with Clips', 21, 0, 1, 2),
    
    -- Subcategories for Technic
    (40, 'Beams', 4, 0, 1, 1),
    (41, 'Pins and Axles', 4, 0, 2, 1);
  `)

  // Insert test parts with various scenarios
  await db.exec(`
    INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, alt_part_ids, ba_name) VALUES
    -- Basic bricks for testing
    ('3001', 'Brick 2 x 4', 1, 10, NULL, 'Brick 2 x 4'),
    ('3002', 'Brick 2 x 3', 1, 10, NULL, 'Brick 2 x 3'),
    ('3003', 'Brick 2 x 2', 1, 10, NULL, 'Brick 2 x 2'),
    ('3004', 'Brick 1 x 2', 1, 10, '3004b', 'Brick 1 x 2'),
    ('3004b', 'Brick 1 x 2 with Embossed Line', 1, 11, '3004', 'Brick 1 x 2 with Line'),
    ('3005', 'Brick 1 x 1', 1, 10, NULL, 'Brick 1 x 1'),
    
    -- Modified bricks for testing categories
    ('3622', 'Brick 1 x 3', 1, 10, NULL, 'Brick 1 x 3'),
    ('87087', 'Brick 1 x 1 with Stud on Side', 1, 12, NULL, 'Brick 1 x 1 with Stud on Side'),
    
    -- Plates for testing
    ('3020', 'Plate 2 x 4', 2, 20, NULL, 'Plate 2 x 4'),
    ('3021', 'Plate 2 x 3', 2, 20, NULL, 'Plate 2 x 3'),
    ('3022', 'Plate 2 x 2', 2, 20, NULL, 'Plate 2 x 2'),
    ('3023', 'Plate 1 x 2', 2, 20, NULL, 'Plate 1 x 2'),
    ('3024', 'Plate 1 x 1', 2, 20, '3024b', 'Plate 1 x 1'),
    ('3024b', 'Plate 1 x 1 Round', 2, 21, '3024', 'Plate 1 x 1 Round'),
    
    -- Plates with dimensions in name for search testing
    ('2420', 'Plate 2 x 2 Corner', 2, 21, NULL, 'Plate 2 x 2 Corner'),
    ('3032', 'Plate 4 x 6', 2, 20, NULL, 'Plate 4 x 6'),
    ('3035', 'Plate 4 x 8', 2, 20, NULL, 'Plate 4 x 8'),
    
    -- Technic parts for testing
    ('3700', 'Technic Brick 1 x 2 with Hole', 4, 40, NULL, 'Technic Brick 1 x 2 with Hole'),
    ('3701', 'Technic Brick 1 x 4 with Holes', 4, 40, NULL, 'Technic Brick 1 x 4 with Holes'),
    ('2780', 'Technic Pin with Friction', 4, 41, NULL, 'Technic Pin with Friction'),
    
    -- Parts with no images for testing
    ('99999', 'Test Part No Image', 1, 10, NULL, 'Test Part No Image'),
    ('88888', 'Another Test No Image', 2, 20, NULL, 'Another Test No Image');
  `)

  // Insert test part relationships
  await db.exec(`
    INSERT INTO part_relationships (rel_type, child_part_num, parent_part_num) VALUES
    ('M', '3004', '3004b'),
    ('M', '3004b', '3004'),
    ('R', '3024', '3024b'),
    ('R', '3024b', '3024');
  `)

  // Insert test elements (part-color combinations)
  await db.exec(`
    INSERT INTO elements (element_id, part_num, color_id, design_id) VALUES
    -- Bricks in various colors
    ('300101', '3001', 0, '3001'),
    ('300115', '3001', 15, '3001'),
    ('300104', '3001', 4, '3001'),
    ('300401', '3004', 0, '3004'),
    ('300415', '3004', 15, '3004'),
    
    -- Plates in various colors
    ('302001', '3020', 0, '3020'),
    ('302015', '3020', 15, '3020'),
    ('302101', '3021', 0, '3021'),
    ('302171', '3021', 71, '3021'),
    
    -- Technic parts
    ('370001', '3700', 0, '3700'),
    ('370071', '3700', 71, '3700'),
    ('278001', '2780', 0, '2780');
  `)

  // Update computed fields for the test data
  // For in-memory database, we need to update computed fields directly
  const isInMemory = db.db ? true : false
  
  if (isInMemory || TEST_DB_PATH === ':memory:') {
    // For in-memory database, update computed fields directly via SQL
    // Update category counts
    await db.exec(`
      UPDATE ba_categories 
      SET parts_count = (
        SELECT COUNT(*) 
        FROM parts 
        WHERE parts.ba_cat_id IN (
          WITH RECURSIVE subcats(id) AS (
            SELECT id FROM ba_categories AS root WHERE root.id = ba_categories.id
            UNION ALL
            SELECT child.id FROM ba_categories child
            JOIN subcats parent ON child.parent_id = parent.id
          )
          SELECT id FROM subcats
        )
      )
    `)
    
    // Update alternate part IDs
    await db.exec(`
      UPDATE parts
      SET alt_part_ids = (
        SELECT GROUP_CONCAT(alt_id)
        FROM (
          SELECT child_part_num AS alt_id
          FROM part_relationships
          WHERE rel_type IN ('M', 'R', 'T')
          AND parent_part_num = parts.part_num
          UNION
          SELECT parent_part_num AS alt_id
          FROM part_relationships
          WHERE rel_type IN ('M', 'R', 'T')
          AND child_part_num = parts.part_num
        )
        WHERE alt_id != parts.part_num
      )
    `)
    
    // Update example design IDs
    await db.exec(`
      UPDATE parts
      SET example_design_id = (
        SELECT design_id
        FROM elements
        WHERE elements.part_num = parts.part_num
        ORDER BY
          CASE color_id
            WHEN 15 THEN 1   -- White
            WHEN 71 THEN 2   -- Light Bluish Gray
            WHEN 72 THEN 3   -- Dark Bluish Gray
            WHEN 0  THEN 4   -- Black
            ELSE 5           -- Others
          END
        LIMIT 1
      )
    `)
  } else {
    // For file-based database, use the external script
    const originalDbPath = process.env.DB_PATH
    process.env.DB_PATH = TEST_DB_PATH
    
    try {
      // Run the update computed fields script
      execSync('node scripts/maintenance/update_computed_fields.js --skip-image-availability --skip-category-sort-order', {
        cwd: path.join(__dirname, '../..'),
        stdio: 'inherit'
      })
    } finally {
      // Restore original DB_PATH
      if (originalDbPath) {
        process.env.DB_PATH = originalDbPath
      } else {
        delete process.env.DB_PATH
      }
    }
  }

  console.log('Test data seeded successfully')
}

/**
 * Seeds additional test data for specific test scenarios
 */
async function seedScenarioData(db, scenario) {
  switch (scenario) {
    case 'large-search-results':
      // Add many parts for pagination testing
      const partInserts = []
      for (let i = 1; i <= 100; i++) {
        partInserts.push(`('TEST${i.toString().padStart(4, '0')}', 'Test Part ${i}', 1, 10, NULL, 'Test Part ${i}')`)
      }
      await db.exec(`
        INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, alt_part_ids, ba_name) VALUES
        ${partInserts.join(',\n')}
      `)
      break

    case 'complex-relationships':
      // Add parts with complex relationship chains
      await db.exec(`
        INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, alt_part_ids, ba_name) VALUES
        ('REL001', 'Relationship Test 1', 1, 10, NULL, 'Relationship Test 1'),
        ('REL002', 'Relationship Test 2', 1, 10, NULL, 'Relationship Test 2'),
        ('REL003', 'Relationship Test 3', 1, 10, NULL, 'Relationship Test 3');
        
        INSERT INTO part_relationships (rel_type, child_part_num, parent_part_num) VALUES
        ('M', 'REL001', 'REL002'),
        ('M', 'REL002', 'REL003'),
        ('R', 'REL003', 'REL001');
      `)
      break

    case 'special-characters':
      // Add parts with special characters in names
      await db.exec(`
        INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, alt_part_ids, ba_name) VALUES
        ('SPEC001', 'Part with "Quotes"', 1, 10, NULL, 'Part with "Quotes"'),
        ('SPEC002', "Part with 'Apostrophe'", 1, 10, NULL, "Part with 'Apostrophe'"),
        ('SPEC003', 'Part with & Ampersand', 1, 10, NULL, 'Part with & Ampersand'),
        ('SPEC004', 'Part with < > Brackets', 1, 10, NULL, 'Part with < > Brackets');
      `)
      break
  }
}

module.exports = {
  TEST_DB_PATH,
  openTestDatabase,
  setupTestDatabase,
  clearTestDatabase,
  closeTestDatabase,
  seedMinimalTestData,
  seedScenarioData,
  createTestDatabase,
}