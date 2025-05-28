// Initial migration to create all tables
module.exports = {
  async up(db) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Create colors table
        db.run(`
          CREATE TABLE IF NOT EXISTS colors (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            rgb TEXT,
            is_trans INTEGER DEFAULT 0,
            num_parts INTEGER DEFAULT 0,
            num_sets INTEGER DEFAULT 0,
            y1 INTEGER,
            y2 INTEGER
          )
        `)

        // Create part_categories table
        db.run(`
          CREATE TABLE IF NOT EXISTS part_categories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL
          )
        `)

        // Create ba_categories table (BrickLink categories)
        db.run(`
          CREATE TABLE IF NOT EXISTS ba_categories (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            parent_id INTEGER,
            parts_count INTEGER DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            level INTEGER DEFAULT 0,
            description TEXT,
            FOREIGN KEY (parent_id) REFERENCES ba_categories(id)
          )
        `)

        // Create parts table
        db.run(`
          CREATE TABLE IF NOT EXISTS parts (
            part_num TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            part_cat_id INTEGER,
            part_material TEXT,
            ba_name TEXT,
            ba_cat_id INTEGER,
            img_file TEXT,
            example_design_id TEXT,
            alt_part_ids TEXT,
            label_file TEXT,
            FOREIGN KEY (part_cat_id) REFERENCES part_categories(id),
            FOREIGN KEY (ba_cat_id) REFERENCES ba_categories(id)
          )
        `)

        // Create elements table
        db.run(`
          CREATE TABLE IF NOT EXISTS elements (
            element_id TEXT PRIMARY KEY,
            part_num TEXT NOT NULL,
            color_id INTEGER NOT NULL,
            design_id TEXT,
            FOREIGN KEY (part_num) REFERENCES parts(part_num),
            FOREIGN KEY (color_id) REFERENCES colors(id)
          )
        `)

        // Create part_relationships table
        db.run(
          `
          CREATE TABLE IF NOT EXISTS part_relationships (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rel_type TEXT NOT NULL,
            child_part_num TEXT NOT NULL,
            parent_part_num TEXT NOT NULL,
            FOREIGN KEY (child_part_num) REFERENCES parts(part_num),
            FOREIGN KEY (parent_part_num) REFERENCES parts(part_num)
          )
        `,
          (err) => {
            if (err) reject(err)
            else resolve()
          }
        )
      })
    })
  },

  async down(db) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('DROP TABLE IF EXISTS part_relationships')
        db.run('DROP TABLE IF EXISTS elements')
        db.run('DROP TABLE IF EXISTS parts')
        db.run('DROP TABLE IF EXISTS ba_categories')
        db.run('DROP TABLE IF EXISTS part_categories')
        db.run('DROP TABLE IF EXISTS colors', (err) => {
          if (err) reject(err)
          else resolve()
        })
      })
    })
  },
}
