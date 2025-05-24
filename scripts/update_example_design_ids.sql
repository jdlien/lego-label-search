-- Update example_design_id for parts that don't have one or need refreshing
-- This script can be run periodically when new elements are added to the database

-- Update parts that don't have an example_design_id yet
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
WHERE example_design_id IS NULL;

-- Optional: Force update all example_design_ids (uncomment if needed)
-- This might be useful if the color preference logic changes
/*
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
);
*/

-- Show statistics after update
SELECT
    COUNT(*) as total_parts,
    COUNT(example_design_id) as parts_with_design_id,
    COUNT(*) - COUNT(example_design_id) as parts_without_design_id
FROM parts;