import csv

# Read categories data
categories = {}
parent_categories = {}

with open('data/ba_categories.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header

    for row in reader:
        cat_id = row[0]
        cat_name = row[1]
        parent_id = row[2]

        categories[cat_id] = cat_name

        # If this is a top-level category (empty parent_id), store it separately
        if parent_id == '':
            parent_categories[cat_id] = cat_name

# Read parts data and count by category
parts_by_category = {}
parts_by_parent_category = {}

# Initialize parent category counts
for parent_id in parent_categories:
    parts_by_parent_category[parent_id] = 0

# Map each category to its top-level parent
category_to_parent = {}
for cat_id, cat_name in categories.items():
    # If it's a top-level category, its parent is itself
    if cat_id in parent_categories:
        category_to_parent[cat_id] = cat_id
    # Otherwise, need to find the parent chain
    else:
        current_id = cat_id
        while current_id not in parent_categories and current_id != '':
            # Find this category's parent
            for row in csv.reader(open('data/ba_categories.csv', 'r')):
                if row[0] == current_id:
                    current_id = row[2]
                    break
            else:
                # If we can't find the parent, stop the chain
                current_id = ''

        # Now current_id should be a top-level category or empty
        if current_id in parent_categories:
            category_to_parent[cat_id] = current_id

# Count parts by category
with open('data/ba_parts.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header

    for row in reader:
        cat_id = row[2]

        # Count this part for its direct category
        if cat_id not in parts_by_category:
            parts_by_category[cat_id] = 0
        parts_by_category[cat_id] += 1

        # Also count it for its parent category
        if cat_id in category_to_parent:
            parent_id = category_to_parent[cat_id]
            if parent_id in parts_by_parent_category:
                parts_by_parent_category[parent_id] += 1

# Print top-level categories and their part counts
print("Top-level categories and part counts:")
for parent_id, parent_name in sorted(parent_categories.items(), key=lambda x: int(x[0])):
    part_count = parts_by_parent_category.get(parent_id, 0)
    print(f"{parent_id}: {parent_name} - {part_count} parts")