# Maintenance Scripts

This directory contains scripts for maintaining computed fields and derived data in the LEGO database.

## update_computed_fields.js

The main maintenance script that handles all computed fields in the database. This script consolidates functionality that was previously scattered across multiple scripts.

### What it updates:

1. **Category Sort Order** (`sort_order` and `level` fields in `ba_categories`)

   - Runs the category sort order script to maintain hierarchical ordering
   - Uses depth-first traversal for intuitive category display
   - Updates level field for proper indentation

2. **Category Counts** (`parts_count` field in `ba_categories`)

   - Recursively counts parts in each category and all its subcategories
   - Updates the `parts_count` field for efficient category browsing

3. **Alternate Part IDs** (`alt_part_ids` field in `parts`)

   - Finds related parts through relationships (Mold, Rebrickable, Transform)
   - Stores comma-separated list of alternate part numbers

4. **Example Design IDs** (`example_design_id` field in `parts`)

   - Selects the best design ID for each part based on color preference
   - Priority: White > Light Bluish Gray > Dark Bluish Gray > Black > Others

5. **Image Availability** (`has_img` and `img_file` fields in `parts`)
   - Scans the images directory for WebP and PNG files
   - Updates database to reflect actual image availability
   - Prefers WebP over PNG format

### Usage:

```bash
# Update all computed fields
node scripts/maintenance/update_computed_fields.js

# Update only specific categories
node scripts/maintenance/update_computed_fields.js --categories 1,2,3

# Skip image availability update (faster)
node scripts/maintenance/update_computed_fields.js --skip-image-availability

# Skip category sort order update (if categories haven't changed)
node scripts/maintenance/update_computed_fields.js --skip-category-sort-order

# Only update example design IDs
node scripts/maintenance/update_computed_fields.js --skip-category-sort-order --skip-category-counts --skip-alt-part-ids --skip-image-availability

# Force update all example design IDs (useful if color preferences change)
node scripts/maintenance/update_computed_fields.js --force-example-design-ids

# Show help
node scripts/maintenance/update_computed_fields.js --help
```

### Integration with Seed Script

The seed script (`scripts/migrations/seed_data.js`) automatically calls this maintenance script after importing raw data. This ensures that:

1. Code is not duplicated between seeding and maintenance
2. All computed fields are consistently updated
3. The database is always in a complete state after seeding

### Performance Notes

- **Category sort order**: Fast, processes categories hierarchically
- **Category counts**: Fast, uses recursive CTEs
- **Alternate part IDs**: Medium speed, processes all parts
- **Example design IDs**: Fast, single SQL update
- **Image availability**: Slowest, requires filesystem scanning

For faster updates during development, you can skip the image availability update which is the most time-consuming operation. You can also skip category sort order if the category hierarchy hasn't changed.

### Replaced Scripts

This consolidated script replaces the functionality of:

- `scripts/update_category_counts.js`
- `scripts/update_alt_part_ids.js`
- `scripts/add_example_design_id.sql`
- `scripts/update_example_design_ids.sql`
- `scripts/update_image_availability.js`

These individual scripts are kept for reference but should not be used directly. Use this maintenance script instead.

### Related Scripts

- `scripts/update_category_sort_order.js` - Updates hierarchical sort order for categories (separate from computed fields)

## When to Run

- **After data import**: Automatically run by the seed script
- **After adding new images**: Run with image availability update
- **After changing color preferences**: Run with `--force-example-design-ids`
- **After modifying part relationships**: Run to update alternate part IDs
- **Periodic maintenance**: Run periodically to ensure data consistency
