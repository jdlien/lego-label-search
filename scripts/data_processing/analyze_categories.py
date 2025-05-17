import csv
from collections import Counter

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

        categories[cat_id] = {
            'name': cat_name,
            'parent_id': parent_id
        }

        # If this is a top-level category (empty parent_id), store it separately
        if parent_id == '':
            parent_categories[cat_id] = cat_name

# Read parts data and count by category
category_counts = Counter()

with open('data/ba_parts.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header

    for row in reader:
        category_id = row[2]
        category_counts[category_id] += 1

# Print top-level categories and their part counts
print("Top-level categories:")
for parent_id, parent_name in sorted(parent_categories.items(), key=lambda x: int(x[0])):
    parent_part_count = sum(count for cat_id, count in category_counts.items()
                           if categories.get(cat_id, {}).get('parent_id') == parent_id
                           or cat_id == parent_id)
    print(f"{parent_id}: {parent_name} - {parent_part_count} parts")

# Also show the distribution for subcategories of category 1 (Basic)
print("\nSubcategories of 1. Basic:")
for cat_id, cat_info in sorted(categories.items(), key=lambda x: int(x[0])):
    if cat_info['parent_id'] == '1':  # If parent is the Basic category
        part_count = sum(count for c_id, count in category_counts.items()
                        if categories.get(c_id, {}).get('parent_id') == cat_id
                        or c_id == cat_id)
        print(f"{cat_id}: {cat_info['name']} - {part_count} parts")

# Show parts distribution across all categories
print("\nParts per category (all levels):")
sorted_categories = sorted([(cat_id, categories[cat_id]['name'], category_counts[cat_id])
                           for cat_id in categories if cat_id in category_counts],
                          key=lambda x: x[2], reverse=True)
for cat_id, cat_name, count in sorted_categories[:20]:  # Show top 20
    print(f"{cat_id}: {cat_name} - {count} parts")

print(f"\nTotal categories: {len(categories)}")
print(f"Categories with parts: {len(category_counts)}")
print(f"Total parts: {sum(category_counts.values())}")