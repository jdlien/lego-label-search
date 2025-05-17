import csv

# Check for duplicate parts (same part number and name but different categories)
seen = {}
duplicates = 0

with open('data/ba_parts.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header

    for row in reader:
        part_num = row[0]
        part_name = row[1]
        category_id = row[2]

        key = (part_num, part_name)

        if key in seen:
            duplicates += 1
            print(f"Duplicate: {part_num} - {part_name}")
            print(f"  Category 1: {seen[key]}")
            print(f"  Category 2: {category_id}")
        else:
            seen[key] = category_id

print(f"\nTotal unique parts: {len(seen)}")
print(f"Total duplicates: {duplicates}")