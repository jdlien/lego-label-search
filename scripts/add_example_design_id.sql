-- Add example_design_id column to parts table
ALTER TABLE parts ADD COLUMN example_design_id INTEGER;

-- Create index for the new column for better performance
CREATE INDEX idx_parts_example_design_id ON parts(example_design_id);

-- Populate the example_design_id column with preferred design IDs
-- Priority: White (15) > Light Bluish Gray (71) > Dark Bluish Gray (72) > Black (0) > Others
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

-- Verify the update worked by showing some examples
SELECT
    part_num,
    name,
    example_design_id,
    (SELECT color_id FROM elements WHERE design_id = parts.example_design_id AND part_num = parts.part_num LIMIT 1) as color_used
FROM parts
WHERE example_design_id IS NOT NULL
LIMIT 10;