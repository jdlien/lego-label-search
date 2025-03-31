from bs4 import BeautifulSoup
import csv
import re
import os
import requests

# Create data directory if it doesn't exist
os.makedirs("data", exist_ok=True)

# Define URLs to process
urls = [
    "https://brickarchitect.com/parts/category-1?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-2?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-3?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-7?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-8?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-106?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-4?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-10?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-11?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-9?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-12?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-13?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-14?&partstyle=1&retired=1",
    "https://brickarchitect.com/parts/category-89?&partstyle=1&retired=1"
]

categories = []
parts_data = []  # Temporary storage for all parts with their categories

# Helper function to get clean category name text
def clean_category_name(element):
    # Convert the element to text and remove extra whitespace
    return re.sub(r'\s+', ' ', element.get_text().strip())

# Process all URLs
urls_to_process = urls

for url in urls_to_process:
    print(f"Processing {url}")
    # Extract main category ID from URL
    url_match = re.search(r'category-(\d+)', url)
    if not url_match:
        print(f"Could not extract category ID from URL: {url}")
        continue

    main_category_id = int(url_match.group(1))

    # Fetch the page content
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to fetch {url}, status code: {response.status_code}")
        continue

    soup = BeautifulSoup(response.text, 'html.parser')

    # Find the main category name from the resultsheadercount div
    header_div = soup.find('div', class_='resultsheadercount')
    if not header_div:
        print(f"Could not find main category header in {url}")
        continue

    # Extract from the <strong> tag
    strong_element = header_div.find('strong')
    if not strong_element:
        print(f"Could not find strong element with category name in {url}")
        continue

    main_category_name = strong_element.text.strip()

    # Add main category to categories list (if not already there)
    if not any(cat['id'] == main_category_id for cat in categories):
        categories.append({
            'id': main_category_id,
            'name': main_category_name,
            'parent_id': ''
        })

    # Find all subcategories (h2 elements with class partcategoryname)
    subcategory_h2s = soup.find_all('h2', class_='partcategoryname')

    for h2 in subcategory_h2s:
        # Extract subcategory ID from the id attribute
        h2_id = h2.get('id')
        if not h2_id:
            print("Missing id attribute in subcategory h2")
            continue

        id_match = re.search(r'category-(\d+)', h2_id)
        if not id_match:
            print(f"Could not extract subcategory ID from h2 id: {h2_id}")
            continue

        subcategory_id = int(id_match.group(1))

        # Extract subcategory name (text inside the a tag)
        a_element = h2.find('a')
        if not a_element:
            print("Missing a element in subcategory h2")
            continue

        subcategory_name = a_element.text.strip()

        # Add subcategory to categories list (if not already there)
        if not any(cat['id'] == subcategory_id for cat in categories):
            categories.append({
                'id': subcategory_id,
                'name': subcategory_name,
                'parent_id': main_category_id
            })

        # Find the part_category div containing this h2
        part_category_div = h2.find_parent('div', class_='part_category')
        if not part_category_div:
            print(f"Could not find parent part_category div for subcategory {subcategory_name}")
            continue

        # Find all the parts in this category (inside tbody div)
        tbody = part_category_div.find('div', class_='tbody')
        if not tbody:
            print(f"No parts found for subcategory {subcategory_name}")
            continue

        # Find all parts (a elements which contain tr divs)
        tr_containers = tbody.find_all('a')

        for container in tr_containers:
            tr = container.find('div', class_='tr')
            if not tr:
                continue

            # Find part name and part number from the td span elements
            part_name_td = tr.find('span', class_='td part_name')
            if not part_name_td:
                continue

            # Find the partname and partnum spans
            part_name_elem = part_name_td.find('span', class_='partname')
            part_num_elem = part_name_td.find('span', class_='partnum')

            if not part_name_elem or not part_num_elem:
                continue

            part_name = part_name_elem.text.strip()
            part_num = part_num_elem.text.strip()

            # Add to temporary parts data with category level 2
            parts_data.append({
                'part_num': part_num,
                'ba_name': part_name,
                'ba_cat_id': subcategory_id,
                'category_level': 2  # Level 2 = subcategory
            })

        # Also check for subcategories (h3 elements with class partcategoryname)
        subcategory_h3s = part_category_div.find_all('h3', class_='partcategoryname')

        for h3 in subcategory_h3s:
            # Extract subsubcategory ID from the id attribute
            h3_id = h3.get('id')
            if not h3_id:
                print("Missing id attribute in subsubcategory h3")
                continue

            id_match = re.search(r'category-(\d+)', h3_id)
            if not id_match:
                print(f"Could not extract subsubcategory ID from h3 id: {h3_id}")
                continue

            subsubcategory_id = int(id_match.group(1))

            # For the subsubcategory name, we only want the text inside the a tag
            a_element = h3.find('a')
            if not a_element:
                print("Missing a element in subsubcategory h3")
                continue

            # Get just the text from the a element
            subsubcategory_name = a_element.text.strip()

            # Add subsubcategory to categories list (if not already there)
            if not any(cat['id'] == subsubcategory_id for cat in categories):
                categories.append({
                    'id': subsubcategory_id,
                    'name': subsubcategory_name,
                    'parent_id': subcategory_id
                })

            # Find the part_category div containing this h3
            subpart_category_div = h3.find_parent('div', class_='part_category')
            if not subpart_category_div:
                print(f"Could not find parent part_category div for subsubcategory {subsubcategory_name}")
                continue

            # Find the tbody element that belongs to this specific h3
            # We need to be careful to get only the parts for this subsubcategory, not all parts in the div
            # Look for the tbody that follows this h3 and comes before the next h3 or h2
            next_element = h3.find_next_sibling()
            found_tbody = None

            while next_element and next_element.name not in ['h2', 'h3']:
                if next_element.name == 'div' and 'tbody' in next_element.get('class', []):
                    found_tbody = next_element
                    break
                next_element = next_element.find_next_sibling()

            if not found_tbody:
                # Try another approach - find the tbody within the same div as h3
                found_tbody = subpart_category_div.find('div', class_='tbody')

            if not found_tbody:
                print(f"No parts found for subsubcategory {subsubcategory_name}")
                continue

            # Find all parts (a elements which contain tr divs)
            tr_containers = found_tbody.find_all('a')

            for container in tr_containers:
                tr = container.find('div', class_='tr')
                if not tr:
                    continue

                # Find part name and part number from the td span elements
                part_name_td = tr.find('span', class_='td part_name')
                if not part_name_td:
                    continue

                # Find the partname and partnum spans
                part_name_elem = part_name_td.find('span', class_='partname')
                part_num_elem = part_name_td.find('span', class_='partnum')

                if not part_name_elem or not part_num_elem:
                    continue

                part_name = part_name_elem.text.strip()
                part_num = part_num_elem.text.strip()

                # Add to temporary parts data with category level 3
                parts_data.append({
                    'part_num': part_num,
                    'ba_name': part_name,
                    'ba_cat_id': subsubcategory_id,
                    'category_level': 3  # Level 3 = subsubcategory
                })

# Build a hierarchical map of categories
category_hierarchy = {}
for cat in categories:
    category_hierarchy[cat['id']] = {
        'name': cat['name'],
        'parent_id': cat['parent_id']
    }

# Create a clean list of parts, keeping only the most specific category for each part
unique_parts = {}  # Dictionary to store unique parts with their most specific category

for part in parts_data:
    part_key = (part['part_num'], part['ba_name'])

    # If we haven't seen this part before, or it has a more specific (higher level) category, update it
    if (part_key not in unique_parts) or (part['category_level'] > unique_parts[part_key]['category_level']):
        unique_parts[part_key] = {
            'part_num': part['part_num'],
            'ba_name': part['ba_name'],
            'ba_cat_id': part['ba_cat_id'],
            'category_level': part['category_level']
        }

# Convert the dictionary back to a list for output
final_parts = [
    {
        'part_num': part_data['part_num'],
        'ba_name': part_data['ba_name'],
        'ba_cat_id': part_data['ba_cat_id']
    }
    for part_data in unique_parts.values()
]

# Clean up parts data for correct category assignment
# First, collect all the unique part category IDs from our categories list
valid_category_ids = [cat['id'] for cat in categories]

# Filter out parts with invalid category IDs - these might be malformed from the HTML parsing
final_parts = [part for part in final_parts if part['ba_cat_id'] in valid_category_ids]

# Write categories to CSV with proper quoting - always quote all fields
with open("data/ba_categories.csv", "w", newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'name', 'parent_id'], quoting=csv.QUOTE_ALL)
    writer.writeheader()
    writer.writerows(categories)

# Write parts to CSV with proper quoting - always quote all fields
with open("data/ba_parts.csv", "w", newline='') as f:
    writer = csv.DictWriter(f, fieldnames=['part_num', 'ba_name', 'ba_cat_id'], quoting=csv.QUOTE_ALL)
    writer.writeheader()
    writer.writerows(final_parts)

print(f"Processed {len(categories)} categories and {len(parts_data)} raw parts")
print(f"After removing duplicates: {len(final_parts)} unique parts")
print("Files saved to data/ba_categories.csv and data/ba_parts.csv")