const testData = require('./test-data')

/**
 * Seeds the database with comprehensive test data
 */
async function seedFullTestData(db) {
  const statements = testData.generateInsertStatements()
  
  // Insert all data in the correct order
  await db.exec(statements.colors)
  await db.exec(statements.partCategories)
  await db.exec(statements.baCategories)
  await db.exec(statements.parts)
  await db.exec(statements.partRelationships)
  await db.exec(statements.elements)
}

/**
 * Seeds data for testing search functionality
 */
async function seedSearchTestData(db) {
  // Insert minimal colors
  await db.exec(`
    INSERT INTO colors (id, name, rgb, is_trans) VALUES
    (0, 'Black', '1B2A34', 0),
    (15, 'White', 'FFFFFF', 0),
    (71, 'Light Bluish Gray', 'A0A5A9', 0);
  `)

  // Insert categories
  await db.exec(`
    INSERT INTO part_categories (id, name) VALUES
    (1, 'Basic Bricks'),
    (2, 'Plates');
    
    INSERT INTO ba_categories (id, name, parent_id, sort_order, level) VALUES
    (1, 'Bricks', NULL, 1, 0),
    (2, 'Plates', NULL, 2, 0),
    (10, 'Basic Bricks', 1, 1, 1),
    (20, 'Basic Plates', 2, 1, 1);
  `)

  // Insert parts with various search patterns
  await db.exec(`
    INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, sort_order) VALUES
    -- Parts with dimensions
    ('3001', 'Brick 2 x 4', 1, 10, 1),
    ('3020', 'Plate 2 x 4', 2, 20, 2),
    ('3021', 'Plate 2 x 3', 2, 20, 3),
    ('3022', 'Plate 2 x 2', 2, 20, 4),
    ('3034', 'Plate 2 x 8', 2, 20, 5),
    ('3035', 'Plate 4 x 8', 2, 20, 6),
    ('3032', 'Plate 4 x 6', 2, 20, 7),
    
    -- Different dimension formats
    ('TEST01', 'Part 2x4 No Spaces', 1, 10, 10),
    ('TEST02', 'Part 2 x 4 With Spaces', 1, 10, 11),
    ('TEST03', 'Part 2×4 Unicode', 1, 10, 12),
    ('TEST04', 'Part 2 × 4 Unicode Spaces', 1, 10, 13),
    
    -- Multi-word search
    ('TEST10', 'Red Brick with Studs', 1, 10, 20),
    ('TEST11', 'Blue Brick with Studs', 1, 10, 21),
    ('TEST12', 'Red Plate with Clips', 2, 20, 22),
    ('TEST13', 'Blue Plate with Rails', 2, 20, 23),
    
    -- Special characters
    ('SPEC01', 'Part with "Quotes"', 1, 10, 30),
    ('SPEC02', "Part with 'Apostrophe'", 1, 10, 31),
    ('SPEC03', 'Part with & Ampersand', 1, 10, 32);
  `)
}

/**
 * Seeds data for testing category hierarchy
 */
async function seedCategoryTestData(db) {
  // Insert colors (minimal)
  await db.exec(`
    INSERT INTO colors (id, name, rgb, is_trans) VALUES
    (0, 'Black', '1B2A34', 0),
    (15, 'White', 'FFFFFF', 0);
  `)

  // Insert part categories
  await db.exec(`
    INSERT INTO part_categories (id, name) VALUES
    (1, 'Test Category');
  `)

  // Insert complex category hierarchy
  await db.exec(`
    INSERT INTO ba_categories (id, name, parent_id, sort_order, level) VALUES
    -- Root categories
    (1, 'Category A', NULL, 1, 0),
    (2, 'Category B', NULL, 2, 0),
    (3, 'Category C', NULL, 3, 0),
    
    -- Level 1 subcategories
    (10, 'A.1', 1, 1, 1),
    (11, 'A.2', 1, 2, 1),
    (20, 'B.1', 2, 1, 1),
    (21, 'B.2', 2, 2, 1),
    
    -- Level 2 subcategories
    (100, 'A.1.1', 10, 1, 2),
    (101, 'A.1.2', 10, 2, 2),
    (110, 'A.2.1', 11, 1, 2),
    (200, 'B.1.1', 20, 1, 2),
    
    -- Level 3 subcategories
    (1000, 'A.1.1.1', 100, 1, 3),
    (1001, 'A.1.1.2', 100, 2, 3);
  `)

  // Insert parts in various categories
  await db.exec(`
    INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, sort_order) VALUES
    -- Parts in root categories
    ('P001', 'Part in A', 1, 1, 1),
    ('P002', 'Part in B', 1, 2, 2),
    ('P003', 'Part in C', 1, 3, 3),
    
    -- Parts in subcategories
    ('P010', 'Part in A.1', 1, 10, 10),
    ('P011', 'Part in A.2', 1, 11, 11),
    ('P020', 'Part in B.1', 1, 20, 20),
    
    -- Parts in deep subcategories
    ('P100', 'Part in A.1.1', 1, 100, 100),
    ('P101', 'Part in A.1.2', 1, 101, 101),
    ('P1000', 'Part in A.1.1.1', 1, 1000, 1000),
    ('P1001', 'Part in A.1.1.2', 1, 1001, 1001);
  `)
}

/**
 * Seeds data for testing part relationships
 */
async function seedRelationshipTestData(db) {
  // Insert minimal colors
  await db.exec(`
    INSERT INTO colors (id, name, rgb, is_trans) VALUES
    (0, 'Black', '1B2A34', 0),
    (15, 'White', 'FFFFFF', 0);
  `)

  // Insert categories
  await db.exec(`
    INSERT INTO part_categories (id, name) VALUES (1, 'Test');
    INSERT INTO ba_categories (id, name, parent_id, sort_order, level) VALUES (1, 'Test', NULL, 1, 0);
  `)

  // Insert parts with complex relationships
  await db.exec(`
    INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, sort_order) VALUES
    -- Main parts
    ('A001', 'Part A', 1, 1, 1),
    ('B001', 'Part B', 1, 1, 2),
    ('C001', 'Part C', 1, 1, 3),
    ('D001', 'Part D', 1, 1, 4),
    ('E001', 'Part E', 1, 1, 5),
    
    -- Parts for chain relationships
    ('CHAIN1', 'Chain Part 1', 1, 1, 10),
    ('CHAIN2', 'Chain Part 2', 1, 1, 11),
    ('CHAIN3', 'Chain Part 3', 1, 1, 12),
    ('CHAIN4', 'Chain Part 4', 1, 1, 13),
    
    -- Parts for circular relationships
    ('CIRC1', 'Circular Part 1', 1, 1, 20),
    ('CIRC2', 'Circular Part 2', 1, 1, 21),
    ('CIRC3', 'Circular Part 3', 1, 1, 22);
  `)

  // Insert relationships
  await db.exec(`
    INSERT INTO part_relationships (rel_type, child_part_num, parent_part_num) VALUES
    -- Simple alternates
    ('M', 'A001', 'B001'),
    ('M', 'B001', 'A001'),
    
    -- Multiple alternates
    ('R', 'C001', 'D001'),
    ('R', 'C001', 'E001'),
    ('R', 'D001', 'C001'),
    ('R', 'E001', 'C001'),
    
    -- Chain relationships
    ('M', 'CHAIN1', 'CHAIN2'),
    ('M', 'CHAIN2', 'CHAIN3'),
    ('M', 'CHAIN3', 'CHAIN4'),
    
    -- Circular relationships
    ('R', 'CIRC1', 'CIRC2'),
    ('R', 'CIRC2', 'CIRC3'),
    ('R', 'CIRC3', 'CIRC1');
  `)

  // Insert elements for some parts
  await db.exec(`
    INSERT INTO elements (element_id, part_num, color_id, design_id) VALUES
    ('A00101', 'A001', 0, 'A001'),
    ('A00115', 'A001', 15, 'A001'),
    ('B00101', 'B001', 0, 'B001'),
    ('C00101', 'C001', 0, 'C001');
  `)
}

/**
 * Seeds data for pagination testing
 */
async function seedPaginationTestData(db, partCount = 100) {
  // Insert minimal setup
  await db.exec(`
    INSERT INTO colors (id, name, rgb, is_trans) VALUES (0, 'Black', '1B2A34', 0);
    INSERT INTO part_categories (id, name) VALUES (1, 'Test');
    INSERT INTO ba_categories (id, name, parent_id, sort_order, level) VALUES (1, 'Test', NULL, 1, 0);
  `)

  // Generate many parts for pagination
  const partInserts = []
  for (let i = 1; i <= partCount; i++) {
    const partNum = `TEST${i.toString().padStart(4, '0')}`
    const name = `Test Part ${i}`
    partInserts.push(`('${partNum}', '${name}', 1, 1, ${i})`)
  }

  // Insert in batches to avoid SQL length limits
  const batchSize = 50
  for (let i = 0; i < partInserts.length; i += batchSize) {
    const batch = partInserts.slice(i, i + batchSize)
    await db.exec(`
      INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, sort_order) VALUES
      ${batch.join(',\n')}
    `)
  }
}

/**
 * Seeds data for testing stats endpoint
 */
async function seedStatsTestData(db) {
  // Insert colors
  await db.exec(`
    INSERT INTO colors (id, name, rgb, is_trans) VALUES
    (0, 'Black', '1B2A34', 0),
    (15, 'White', 'FFFFFF', 0);
  `)

  // Insert part categories
  await db.exec(`
    INSERT INTO part_categories (id, name) VALUES (1, 'Test');
  `)

  // Insert ba_categories with hierarchy for stats testing
  await db.exec(`
    INSERT INTO ba_categories (id, name, parent_id, sort_order, level) VALUES
    -- Root categories (3 total)
    (1, 'Category A', NULL, 1, 0),
    (2, 'Category B', NULL, 2, 0),
    (3, 'Category C', NULL, 3, 0),
    
    -- Level 1 subcategories
    (10, 'A.1', 1, 1, 1),
    (11, 'A.2', 1, 2, 1),
    (20, 'B.1', 2, 1, 1),
    (21, 'B.2', 2, 2, 1),
    
    -- Level 2 subcategories
    (100, 'A.1.1', 10, 1, 2),
    (101, 'A.1.2', 10, 2, 2),
    (110, 'A.2.1', 11, 1, 2),
    (200, 'B.1.1', 20, 1, 2),
    
    -- Level 3 subcategories
    (1000, 'A.1.1.1', 100, 1, 3),
    (1001, 'A.1.1.2', 100, 2, 3);
  `)

  // Insert parts with specific image distribution for stats testing
  await db.exec(`
    INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, img_file, sort_order) VALUES
    -- Parts with unique images (3 total)
    ('P001', 'Part with Image 1', 1, 1, 'p001.webp', 1),
    ('P002', 'Part with Image 2', 1, 2, 'p002.webp', 2),
    ('P003', 'Part with Image 3', 1, 3, 'p003.webp', 3),
    
    -- Parts without images
    ('P004', 'Part without Image 1', 1, 10, NULL, 4),
    ('P005', 'Part without Image 2', 1, 11, NULL, 5);
  `)
}

module.exports = {
  seedFullTestData,
  seedSearchTestData,
  seedCategoryTestData,
  seedRelationshipTestData,
  seedPaginationTestData,
  seedStatsTestData,
  testData,
}