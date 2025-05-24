# Design ID Implementation

## Overview

To efficiently provide preferred element design IDs for LEGO parts, we've implemented a column-based approach that pre-computes and stores the optimal design ID for each part.

## Implementation Details

### Database Schema Changes

Added `example_design_id` column to the `parts` table:

```sql
ALTER TABLE parts ADD COLUMN example_design_id INTEGER;
CREATE INDEX idx_parts_example_design_id ON parts(example_design_id);
```

### Color Preference Logic

The system selects design IDs using the following priority order:

1. **White (color_id: 15)** - Most neutral and versatile
2. **Light Bluish Gray (color_id: 71)** - Common LEGO gray
3. **Dark Bluish Gray (color_id: 72)** - Alternative gray
4. **Black (color_id: 0)** - High contrast option
5. **Any other color** - Fallback to whatever is available

### API Integration

The search API now returns `example_design_id` in the Part interface:

```typescript
interface Part {
  id: string
  name: string
  // ... other fields
  example_design_id: string
}
```

### Frontend Integration

The `PartCard` component automatically uses the design ID for image loading:

```typescript
// Prefer design_id if available, otherwise use normalized part_id
const imageId = part.example_design_id || part.id.replace(/^0+/, '')
```

## Benefits

1. **Performance**: No complex queries or joins needed during search
2. **Consistency**: Always uses the same preferred color for each part
3. **Scalability**: Performance remains constant regardless of dataset size
4. **Maintainability**: Simple logic that's easy to understand and modify

## Maintenance

### Initial Population

Run the initial setup script to populate all existing parts:

```bash
sqlite3 data/lego.sqlite < scripts/add_example_design_id.sql
```

### Periodic Updates

When new elements are added to the database, run the maintenance script:

```bash
sqlite3 data/lego.sqlite < scripts/update_example_design_ids.sql
```

## Statistics

As of the initial implementation:

- **Total parts**: 57,575
- **Parts with design IDs**: 31,284 (54%)
- **Parts without design IDs**: 26,291 (46%)

Parts without design IDs likely don't have corresponding entries in the elements table.

## Future Enhancements

1. **Automatic Updates**: Consider adding triggers to automatically update example_design_id when new elements are inserted
2. **Color Customization**: Allow users to prefer different colors (e.g., for color-blind accessibility)
3. **Fallback Images**: Implement better fallback strategies for parts without design IDs
