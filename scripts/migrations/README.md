# Database Migration System

This directory contains a custom migration system for the LEGO database, since Next.js doesn't have built-in database migrations.

## Files

- `migrate.js` - Migration runner that executes pending migrations
- `seed_data.js` - Data seeder that imports CSV data into the database
- `0001_create_initial_tables.js` - Initial migration creating all tables
- `0002_add_indexes.js` - Migration adding database indexes for performance

## Usage

### Rebuild entire database from scratch

```bash
npm run db:rebuild
```

This will:

1. Delete the existing database
2. Run all migrations to create tables
3. Import all data from CSV files

### Run only migrations (create/update schema)

```bash
npm run db:migrate
```

### Run only data seeding (import CSV data)

```bash
npm run db:seed
```

## Database Schema

The database contains the following tables:

### `colors`

- `id` (INTEGER PRIMARY KEY) - Color ID
- `name` (TEXT) - Color name
- `rgb` (TEXT) - RGB hex value
- `is_trans` (INTEGER) - 1 if transparent, 0 if opaque
- `num_parts` (INTEGER) - Number of parts in this color
- `num_sets` (INTEGER) - Number of sets using this color
- `y1`, `y2` (INTEGER) - Year range

### `part_categories`

- `id` (INTEGER PRIMARY KEY) - Category ID
- `name` (TEXT) - Category name

### `ba_categories` (BrickLink Categories)

- `id` (INTEGER PRIMARY KEY) - BrickLink category ID
- `name` (TEXT) - Category name
- `parent_id` (INTEGER) - Parent category ID (nullable)

### `parts`

- `part_num` (TEXT PRIMARY KEY) - Part number
- `name` (TEXT) - Part name
- `part_cat_id` (INTEGER) - LEGO category ID
- `part_material` (TEXT) - Material type
- `ba_name` (TEXT) - BrickLink name
- `ba_cat_id` (INTEGER) - BrickLink category ID
- `sort_order` (INTEGER) - Sort order for display
- `image_available` (INTEGER) - Legacy field, use has_img instead
- `has_img` (INTEGER) - 1 if image exists, 0 if not
- `img_file` (TEXT) - Filename of the image (e.g., "3001.webp")
- `example_design_id` (TEXT) - Example design ID
- `alt_part_ids` (TEXT) - Alternative part IDs (JSON)

### `elements`

- `element_id` (TEXT PRIMARY KEY) - Element ID
- `part_num` (TEXT) - Part number
- `color_id` (INTEGER) - Color ID
- `design_id` (TEXT) - Design ID

### `part_relationships`

- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `rel_type` (TEXT) - Relationship type
- `child_part_num` (TEXT) - Child part number
- `parent_part_num` (TEXT) - Parent part number

### `migrations`

- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `filename` (TEXT) - Migration filename
- `executed_at` (DATETIME) - When migration was executed

## Creating New Migrations

To create a new migration:

1. Create a new file with format: `NNNN_description.js` (e.g., `0003_add_new_column.js`)
2. Use the following template:

```javascript
module.exports = {
  async up(db) {
    return new Promise((resolve, reject) => {
      // Your migration code here
      db.run('ALTER TABLE parts ADD COLUMN new_field TEXT', (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  },

  async down(db) {
    return new Promise((resolve, reject) => {
      // Rollback code here
      db.run('ALTER TABLE parts DROP COLUMN new_field', (err) => {
        if (err) reject(err)
        else resolve()
      })
    })
  },
}
```

3. Run `npm run db:migrate` to execute the new migration

## Data Sources

The seeder imports data from these CSV files in `/data/`:

- `colors.csv` - Color definitions
- `part_categories.csv` - LEGO part categories
- `ba_categories.csv` - BrickLink categories
- `parts.csv` - Main parts data
- `ba_parts.csv` - BrickLink part data (updates existing parts)
- `elements.csv` - Element/color combinations
- `part_relationships.csv` - Part relationships

## Performance

The system includes indexes on commonly queried fields:

- Part names and categories
- Element relationships
- Color lookups
- Part relationships

Current database size: ~26MB with full dataset.

## Image Management

After rebuilding the database, you should run the image availability script to populate the `has_img` and `img_file` fields:

```bash
node scripts/update_image_availability.js
```

This script scans the `public/data/images/` directory and updates the database with information about which parts have images available.
