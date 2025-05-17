import csv
from collections import Counter

# Read parts data and count the categories
categories = []
with open('data/ba_parts.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header
    for row in reader:
        categories.append(row[2])  # The category ID is in the third column

# Print the category counts
for category_id, count in Counter(categories).most_common():
    print(f"{count:4d} {category_id}")