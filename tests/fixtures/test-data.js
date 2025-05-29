/**
 * Test data fixtures for LEGO Part Label Search API tests
 * This module provides comprehensive test data for various testing scenarios
 */

const testData = {
  // Basic colors for testing
  colors: [
    { id: 0, name: 'Black', rgb: '1B2A34', is_trans: 0 },
    { id: 1, name: 'Blue', rgb: '1E5AA8', is_trans: 0 },
    { id: 4, name: 'Red', rgb: 'DD1A21', is_trans: 0 },
    { id: 5, name: 'Brown', rgb: '583927', is_trans: 0 },
    { id: 7, name: 'Light Gray', rgb: 'B0B0B0', is_trans: 0 },
    { id: 14, name: 'Yellow', rgb: 'FED557', is_trans: 0 },
    { id: 15, name: 'White', rgb: 'FFFFFF', is_trans: 0 },
    { id: 40, name: 'Trans-Clear', rgb: 'FCFCFC', is_trans: 1 },
    { id: 41, name: 'Trans-Light Blue', rgb: 'B4D4F7', is_trans: 1 },
    { id: 71, name: 'Light Bluish Gray', rgb: 'A0A5A9', is_trans: 0 },
    { id: 72, name: 'Dark Bluish Gray', rgb: '6C6E68', is_trans: 0 },
  ],

  // Part categories
  partCategories: [
    { id: 1, name: 'Basic Bricks' },
    { id: 2, name: 'Plates' },
    { id: 3, name: 'Slopes' },
    { id: 4, name: 'Technic' },
    { id: 5, name: 'Decorative Elements' },
    { id: 6, name: 'Windows and Doors' },
    { id: 7, name: 'Wheels and Tires' },
  ],

  // BrickArchitect categories with full hierarchy
  baCategories: [
    // Top level categories
    { id: 1, name: 'Bricks', parent_id: null, sort_order: 1, level: 0 },
    { id: 2, name: 'Plates', parent_id: null, sort_order: 2, level: 0 },
    { id: 3, name: 'Slopes', parent_id: null, sort_order: 3, level: 0 },
    { id: 4, name: 'Technic', parent_id: null, sort_order: 4, level: 0 },
    { id: 5, name: 'Decorative', parent_id: null, sort_order: 5, level: 0 },
    { id: 6, name: 'Windows & Doors', parent_id: null, sort_order: 6, level: 0 },
    { id: 7, name: 'Wheels', parent_id: null, sort_order: 7, level: 0 },
    
    // Subcategories for Bricks
    { id: 10, name: 'Basic Bricks', parent_id: 1, sort_order: 1, level: 1 },
    { id: 11, name: 'Modified Bricks', parent_id: 1, sort_order: 2, level: 1 },
    { id: 12, name: 'Bricks with Studs on Side', parent_id: 11, sort_order: 1, level: 2 },
    { id: 13, name: 'Bricks with Clips', parent_id: 11, sort_order: 2, level: 2 },
    
    // Subcategories for Plates
    { id: 20, name: 'Basic Plates', parent_id: 2, sort_order: 1, level: 1 },
    { id: 21, name: 'Modified Plates', parent_id: 2, sort_order: 2, level: 1 },
    { id: 22, name: 'Plates with Clips', parent_id: 21, sort_order: 1, level: 2 },
    { id: 23, name: 'Plates with Rails', parent_id: 21, sort_order: 2, level: 2 },
    
    // Subcategories for Slopes
    { id: 30, name: 'Standard Slopes', parent_id: 3, sort_order: 1, level: 1 },
    { id: 31, name: 'Inverted Slopes', parent_id: 3, sort_order: 2, level: 1 },
    { id: 32, name: 'Curved Slopes', parent_id: 3, sort_order: 3, level: 1 },
    
    // Subcategories for Technic
    { id: 40, name: 'Beams', parent_id: 4, sort_order: 1, level: 1 },
    { id: 41, name: 'Pins and Axles', parent_id: 4, sort_order: 2, level: 1 },
    { id: 42, name: 'Gears', parent_id: 4, sort_order: 3, level: 1 },
  ],

  // Comprehensive parts test data
  parts: {
    // Basic bricks
    bricks: [
      { part_num: '3001', name: 'Brick 2 x 4', part_cat_id: 1, ba_cat_id: 10 },
      { part_num: '3002', name: 'Brick 2 x 3', part_cat_id: 1, ba_cat_id: 10 },
      { part_num: '3003', name: 'Brick 2 x 2', part_cat_id: 1, ba_cat_id: 10 },
      { part_num: '3004', name: 'Brick 1 x 2', part_cat_id: 1, ba_cat_id: 10 },
      { part_num: '3005', name: 'Brick 1 x 1', part_cat_id: 1, ba_cat_id: 10 },
      { part_num: '3622', name: 'Brick 1 x 3', part_cat_id: 1, ba_cat_id: 10 },
      { part_num: '3010', name: 'Brick 1 x 4', part_cat_id: 1, ba_cat_id: 10 },
    ],

    // Modified bricks
    modifiedBricks: [
      { part_num: '87087', name: 'Brick 1 x 1 with Stud on Side', part_cat_id: 1, ba_cat_id: 12 },
      { part_num: '11211', name: 'Brick 1 x 2 with Studs on Side', part_cat_id: 1, ba_cat_id: 12 },
      { part_num: '30414', name: 'Brick 1 x 4 with Studs on Side', part_cat_id: 1, ba_cat_id: 12 },
    ],

    // Basic plates
    plates: [
      { part_num: '3020', name: 'Plate 2 x 4', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '3021', name: 'Plate 2 x 3', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '3022', name: 'Plate 2 x 2', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '3023', name: 'Plate 1 x 2', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '3024', name: 'Plate 1 x 1', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '3710', name: 'Plate 1 x 4', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '3666', name: 'Plate 1 x 6', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '3034', name: 'Plate 2 x 8', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '3035', name: 'Plate 4 x 8', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '3032', name: 'Plate 4 x 6', part_cat_id: 2, ba_cat_id: 20 },
    ],

    // Slopes
    slopes: [
      { part_num: '3040', name: 'Slope 45 2 x 1', part_cat_id: 3, ba_cat_id: 30 },
      { part_num: '3037', name: 'Slope 45 2 x 4', part_cat_id: 3, ba_cat_id: 30 },
      { part_num: '3038', name: 'Slope 45 2 x 3', part_cat_id: 3, ba_cat_id: 30 },
      { part_num: '3039', name: 'Slope 45 2 x 2', part_cat_id: 3, ba_cat_id: 30 },
    ],

    // Technic
    technic: [
      { part_num: '3700', name: 'Technic Brick 1 x 2 with Hole', part_cat_id: 4, ba_cat_id: 40 },
      { part_num: '3701', name: 'Technic Brick 1 x 4 with Holes', part_cat_id: 4, ba_cat_id: 40 },
      { part_num: '32316', name: 'Technic Beam 5', part_cat_id: 4, ba_cat_id: 40 },
      { part_num: '2780', name: 'Technic Pin with Friction', part_cat_id: 4, ba_cat_id: 41 },
      { part_num: '3673', name: 'Technic Pin', part_cat_id: 4, ba_cat_id: 41 },
      { part_num: '32062', name: 'Technic Axle 2', part_cat_id: 4, ba_cat_id: 41 },
    ],

    // Parts with alternates
    alternates: [
      { part_num: '3004b', name: 'Brick 1 x 2 with Embossed Line', part_cat_id: 1, ba_cat_id: 11 },
      { part_num: '3024b', name: 'Plate 1 x 1 Round', part_cat_id: 2, ba_cat_id: 21 },
      { part_num: '6141', name: 'Plate 1 x 1 Round', part_cat_id: 2, ba_cat_id: 21 },
    ],

    // Parts with special characters (for testing edge cases)
    specialCharacters: [
      { part_num: 'SPEC001', name: 'Part with "Quotes"', part_cat_id: 1, ba_cat_id: 10 },
      { part_num: 'SPEC002', name: "Part with 'Apostrophe'", part_cat_id: 1, ba_cat_id: 10 },
      { part_num: 'SPEC003', name: 'Part with & Ampersand', part_cat_id: 1, ba_cat_id: 10 },
      { part_num: 'SPEC004', name: 'Part with < > Brackets', part_cat_id: 1, ba_cat_id: 10 },
    ],

    // Parts for search testing
    searchTest: [
      { part_num: '99999', name: 'Test Part No Image', part_cat_id: 1, ba_cat_id: 10 },
      { part_num: '88888', name: 'Another Test No Image', part_cat_id: 2, ba_cat_id: 20 },
      { part_num: '2420', name: 'Plate 2 x 2 Corner', part_cat_id: 2, ba_cat_id: 21 },
      { part_num: '2357', name: 'Brick 2 x 2 Corner', part_cat_id: 1, ba_cat_id: 11 },
    ],
  },

  // Part relationships
  partRelationships: [
    // Alternates
    { rel_type: 'M', child_part_num: '3004', parent_part_num: '3004b' },
    { rel_type: 'M', child_part_num: '3004b', parent_part_num: '3004' },
    { rel_type: 'R', child_part_num: '3024', parent_part_num: '3024b' },
    { rel_type: 'R', child_part_num: '3024b', parent_part_num: '3024' },
    { rel_type: 'R', child_part_num: '3024', parent_part_num: '6141' },
    { rel_type: 'R', child_part_num: '6141', parent_part_num: '3024' },
  ],

  // Elements (part-color combinations)
  elements: [
    // Basic brick elements
    { element_id: '300101', part_num: '3001', color_id: 0, design_id: '3001' },
    { element_id: '300115', part_num: '3001', color_id: 15, design_id: '3001' },
    { element_id: '300104', part_num: '3001', color_id: 4, design_id: '3001' },
    { element_id: '300171', part_num: '3001', color_id: 71, design_id: '3001' },
    
    // Plate elements
    { element_id: '302001', part_num: '3020', color_id: 0, design_id: '3020' },
    { element_id: '302015', part_num: '3020', color_id: 15, design_id: '3020' },
    { element_id: '302171', part_num: '3020', color_id: 71, design_id: '3020' },
    
    // Technic elements
    { element_id: '370001', part_num: '3700', color_id: 0, design_id: '3700' },
    { element_id: '370071', part_num: '3700', color_id: 71, design_id: '3700' },
    { element_id: '278001', part_num: '2780', color_id: 0, design_id: '2780' },
    { element_id: '278007', part_num: '2780', color_id: 7, design_id: '2780' },
  ],

  // Helper function to get all parts as a flat array
  getAllParts() {
    return [
      ...this.parts.bricks,
      ...this.parts.modifiedBricks,
      ...this.parts.plates,
      ...this.parts.slopes,
      ...this.parts.technic,
      ...this.parts.alternates,
      ...this.parts.specialCharacters,
      ...this.parts.searchTest,
    ]
  },

  // Helper function to generate SQL insert statements
  generateInsertStatements() {
    const statements = {
      colors: `INSERT INTO colors (id, name, rgb, is_trans) VALUES ${
        this.colors.map(c => `(${c.id}, '${c.name}', '${c.rgb}', ${c.is_trans})`).join(',\n')
      };`,

      partCategories: `INSERT INTO part_categories (id, name) VALUES ${
        this.partCategories.map(c => `(${c.id}, '${c.name}')`).join(',\n')
      };`,

      baCategories: `INSERT INTO ba_categories (id, name, parent_id, parts_count, sort_order, level) VALUES ${
        this.baCategories.map(c => 
          `(${c.id}, '${c.name}', ${c.parent_id || 'NULL'}, 0, ${c.sort_order}, ${c.level})`
        ).join(',\n')
      };`,

      parts: `INSERT INTO parts (part_num, name, part_cat_id, ba_cat_id, alt_part_ids, ba_name) VALUES ${
        this.getAllParts().map(p => 
          `('${p.part_num}', '${p.name.replace(/'/g, "''")}', ${p.part_cat_id}, ${p.ba_cat_id}, ${p.alt_part_ids ? `'${p.alt_part_ids}'` : 'NULL'}, '${p.ba_name || p.name.replace(/'/g, "''")}')`
        ).join(',\n')
      };`,

      partRelationships: `INSERT INTO part_relationships (rel_type, child_part_num, parent_part_num) VALUES ${
        this.partRelationships.map(r => 
          `('${r.rel_type}', '${r.child_part_num}', '${r.parent_part_num}')`
        ).join(',\n')
      };`,

      elements: `INSERT INTO elements (element_id, part_num, color_id, design_id) VALUES ${
        this.elements.map(e => 
          `('${e.element_id}', '${e.part_num}', ${e.color_id}, '${e.design_id}')`
        ).join(',\n')
      };`,
    }

    return statements
  },
}

module.exports = testData