import csv

# Read categories data
with open('data/ba_categories.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header

    # Store categories by ID
    categories = {}
    for row in reader:
        cat_id = row[0]
        cat_name = row[1]
        parent_id = row[2]
        categories[cat_id] = {
            'name': cat_name,
            'parent_id': parent_id
        }

    # Find subsubcategories (entries whose parent is not a top-level category)
    subsubcategories = []
    for cat_id, cat_data in categories.items():
        parent_id = cat_data['parent_id']
        if parent_id and parent_id in categories and categories[parent_id]['parent_id'] != '':
            subsubcategories.append({
                'id': cat_id,
                'name': cat_data['name'],
                'parent_id': parent_id,
                'parent_name': categories[parent_id]['name']
            })

    # Print the first 10 subsubcategories
    print(f"Found {len(subsubcategories)} subsubcategories")
    print("\nFirst 10 subsubcategories:")
    for i, subcat in enumerate(subsubcategories[:10]):
        print(f"{subcat['id']}: {subcat['name']} (parent: {subcat['parent_id']} - {subcat['parent_name']})")