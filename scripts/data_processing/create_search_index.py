import csv
import json
import os
import re

# Function to clean and normalize part names
def normalize_text(text):
    # Convert to lowercase
    text = text.lower()

    # Remove any special characters and extra whitespace
    text = re.sub(r'[^\w\s]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    return text

# Create data directory if it doesn't exist
os.makedirs('data', exist_ok=True)

# Load parts data
parts = []
with open('data/ba_parts.csv', 'r') as f:
    reader = csv.reader(f)
    header = next(reader)

    for row in reader:
        part_number = row[0]
        part_name = row[1]
        category_id = row[2]

        # Skip parts with missing information
        if not part_number or not part_name:
            continue

        parts.append({
            'id': part_number,
            'name': part_name,
            'normalized_name': normalize_text(part_name),
            'category_id': category_id
        })

# Load categories data
categories = {}
with open('data/ba_categories.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header

    for row in reader:
        cat_id = row[0]
        cat_name = row[1]
        parent_id = row[2]

        categories[cat_id] = {
            'id': cat_id,
            'name': cat_name,
            'parent_id': parent_id
        }

# Create a hierarchical structure of categories
for cat_id, cat_data in categories.items():
    # Add full_path to track the hierarchy (for display and searching)
    cat_data['full_path'] = []

    # Start with the current category
    current_id = cat_id
    cat_data['full_path'].insert(0, categories[current_id]['name'])

    # Walk up the parent chain
    while categories[current_id]['parent_id'] and categories[current_id]['parent_id'] in categories:
        current_id = categories[current_id]['parent_id']
        cat_data['full_path'].insert(0, categories[current_id]['name'])

# Enrich parts with category information
for part in parts:
    cat_id = part['category_id']
    if cat_id in categories:
        part['category_name'] = categories[cat_id]['name']
        part['category_path'] = categories[cat_id]['full_path']
    else:
        # If category doesn't exist, provide defaults
        part['category_name'] = 'Unknown'
        part['category_path'] = ['Unknown']

# Create search index
search_index = {
    'parts': parts,
    'categories': list(categories.values())
}

# Save search index to JSON file
with open('data/search_index.json', 'w') as f:
    json.dump(search_index, f, indent=2)

print(f"Search index created with {len(parts)} parts and {len(categories)} categories")
print("Saved to data/search_index.json")