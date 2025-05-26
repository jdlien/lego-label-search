# Scripts Directory

This directory contains utility scripts for maintaining and managing the LEGO Label Search application.

## Maintenance Scripts

**Primary Script:** `maintenance/update_computed_fields.js`

This is the main maintenance script that handles all computed fields in the database. It consolidates functionality that was previously scattered across multiple individual scripts.

### What it updates:

1. **Category Counts** - Recursively counts parts in each category and subcategories
2. **Alternate Part IDs** - Finds related parts through relationships
3. **Example Design IDs** - Selects best design ID based on color preference
4. **Image Availability** - Scans filesystem and updates image flags

See `maintenance/README.md` for detailed documentation.

## Legacy Individual Scripts

The following scripts are kept for reference but should not be used directly. Use the consolidated maintenance script instead:

### Image Availability Update Script (LEGACY)

**File:** `update_image_availability.js`

This script checks for the existence of image files (WebP and PNG) for all parts in the database and updates both the `has_img` and `img_file` fields accordingly. The `img_file` field stores the exact filename of the image (including extension), while `has_img` is a boolean flag. This helps optimize the application by preventing unnecessary 404 requests for missing images and eliminates complex filename matching logic in the frontend.

**Note:** This functionality is now included in `maintenance/update_computed_fields.js`.

### Usage

```bash
# Basic usage - updates the database
node scripts/update_image_availability.js

# Dry run - shows what would be updated without making changes
node scripts/update_image_availability.js --dry-run

# Verbose output - shows detailed information for each part
node scripts/update_image_availability.js --verbose

# Custom batch size - process parts in smaller/larger batches
node scripts/update_image_availability.js --batch-size=500

# Combine options
node scripts/update_image_availability.js --dry-run --verbose --batch-size=100
```

### Options

- `--dry-run`: Show what would be updated without making changes to the database
- `--verbose`: Show detailed output for each part processed
- `--batch-size=N`: Set the number of parts to process in each batch (default: 1000)
- `--help`: Show help message with usage information

### What it does

1. **Scans all parts** in the database
2. **Checks for image files** in the `public/data/images/` directory:
   - Looks for both WebP (`.webp`) and PNG (`.png`) formats
   - Handles various filename patterns (with/without leading zeros, variant suffixes like 'a', 'b', 'c')
   - Prefers WebP over PNG when both are available
3. **Updates the database** with:
   - `img_file`: The exact filename of the best available image (e.g., "3001.webp", "003381a.png")
   - `has_img`: Boolean flag (1 if image exists, 0 if not)
4. **Provides detailed statistics** about the update process

### Scheduling with Cron

To run this script automatically, you can add it to your crontab:

```bash
# Edit crontab
crontab -e

# Add a line to run daily at 2 AM
0 2 * * * cd /path/to/lego-label-search && node scripts/update_image_availability.js

# Or run weekly on Sundays at 3 AM
0 3 * * 0 cd /path/to/lego-label-search && node scripts/update_image_availability.js
```

### Example Output

```
Image Availability Update Script
================================
Database: /path/to/data/lego.sqlite
Images directory: /path/to/public/data/images
Batch size: 1000

📂 Opening database connection...
📋 Fetching parts from database...
Found 15432 parts in database
Processing 15432 parts in batches of 1000...
Processing batch 1/16 (1000 parts)...
  Progress: 100/15432 (0.6%)
  Progress: 200/15432 (1.3%)
...

Summary
=======
Total parts processed: 15432
Parts with images: 12847
Parts without images: 2585
Database updates needed: 127
Errors: 0
Processing time: 45.23 seconds

✅ Database has been updated successfully!
```

### Performance Notes

- The script processes parts in batches to manage memory usage
- Default batch size is 1000 parts, which works well for most systems
- File existence checks are performed asynchronously for better performance
- Progress indicators help track long-running operations

### Error Handling

- The script will continue processing even if individual parts encounter errors
- All errors are logged with the specific part number that failed
- A summary shows the total number of errors encountered
- The script exits with code 1 if any errors occurred

## Other Scripts

### Data Processing Scripts

The `data_processing/` subdirectory contains scripts for:

- Processing LEGO part data
- Creating search indexes
- GUI applications for part management

See individual script files for specific documentation.
