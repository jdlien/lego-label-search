// Add indexes for better query performance
module.exports = {
  async up(db) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Parts table indexes
        db.run('CREATE INDEX IF NOT EXISTS idx_parts_name ON parts(name)')
        db.run('CREATE INDEX IF NOT EXISTS idx_parts_part_cat_id ON parts(part_cat_id)')
        db.run('CREATE INDEX IF NOT EXISTS idx_parts_ba_cat_id ON parts(ba_cat_id)')

        // Elements table indexes - minimal set for design ID updates
        db.run('CREATE INDEX IF NOT EXISTS idx_elements_part_num ON elements(part_num)')
        db.run('CREATE INDEX IF NOT EXISTS idx_elements_part_color ON elements(part_num, color_id, design_id)')

        // Part relationships indexes
        db.run('CREATE INDEX IF NOT EXISTS idx_part_relationships_child ON part_relationships(child_part_num)')
        db.run('CREATE INDEX IF NOT EXISTS idx_part_relationships_parent ON part_relationships(parent_part_num)')
        db.run('CREATE INDEX IF NOT EXISTS idx_part_relationships_type ON part_relationships(rel_type)')

        // Colors table indexes
        db.run('CREATE INDEX IF NOT EXISTS idx_colors_name ON colors(name)')

        // Categories indexes
        db.run('CREATE INDEX IF NOT EXISTS idx_part_categories_name ON part_categories(name)')
        db.run('CREATE INDEX IF NOT EXISTS idx_ba_categories_name ON ba_categories(name)')
        db.run('CREATE INDEX IF NOT EXISTS idx_ba_categories_parent_id ON ba_categories(parent_id)', (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    })
  },

  async down(db) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Drop all indexes
        db.run('DROP INDEX IF EXISTS idx_parts_name')
        db.run('DROP INDEX IF EXISTS idx_parts_part_cat_id')
        db.run('DROP INDEX IF EXISTS idx_parts_ba_cat_id')
        db.run('DROP INDEX IF EXISTS idx_elements_part_num')
        db.run('DROP INDEX IF EXISTS idx_elements_part_color')
        db.run('DROP INDEX IF EXISTS idx_part_relationships_child')
        db.run('DROP INDEX IF EXISTS idx_part_relationships_parent')
        db.run('DROP INDEX IF EXISTS idx_part_relationships_type')
        db.run('DROP INDEX IF EXISTS idx_colors_name')
        db.run('DROP INDEX IF EXISTS idx_part_categories_name')
        db.run('DROP INDEX IF EXISTS idx_ba_categories_name')
        db.run('DROP INDEX IF EXISTS idx_ba_categories_parent_id', (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    })
  },
}
