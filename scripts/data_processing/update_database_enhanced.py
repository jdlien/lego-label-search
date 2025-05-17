#!/usr/bin/env python3
import csv
import sqlite3
import os
import re

# Connect to SQLite database
print("Connecting to database...")
conn = sqlite3.connect('data/lego.sqlite')
cursor = conn.cursor()

# Check if ba_name and ba_cat_id columns exist in the parts table
cursor.execute("PRAGMA table_info(parts)")
columns = cursor.fetchall()
column_names = [column[1] for column in columns]

# Add columns if they don't exist
if 'ba_name' not in column_names:
    print("Adding ba_name column to parts table...")
    cursor.execute("ALTER TABLE parts ADD COLUMN ba_name TEXT")

if 'ba_cat_id' not in column_names:
    print("Adding ba_cat_id column to parts table...")
    cursor.execute("ALTER TABLE parts ADD COLUMN ba_cat_id INTEGER")

# Read the CSV file into memory
print("Reading CSV file...")
ba_parts = []
with open('data/ba_parts.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header row

    for row in reader:
        ba_parts.append({
            'part_num': row[0],
            'ba_name': row[1],
            'ba_cat_id': row[2]
        })

# Function to normalize part numbers
def normalize_part_num(part_num):
    # Remove non-alphanumeric characters
    normalized = re.sub(r'[^a-zA-Z0-9]', '', part_num)
    # Convert to lowercase
    normalized = normalized.lower()
    # Remove leading zeros
    normalized = normalized.lstrip('0')
    return normalized

# Create a mapping of normalized part numbers to original BA part data
normalized_to_ba = {}
for part in ba_parts:
    normalized = normalize_part_num(part['part_num'])
    if normalized not in normalized_to_ba:
        normalized_to_ba[normalized] = part

# Get all part numbers from the database
print("Fetching part numbers from database...")
cursor.execute("SELECT part_num FROM parts")
db_part_nums = [row[0] for row in cursor.fetchall()]

# Create a mapping of normalized DB part numbers to original part numbers
normalized_to_db = {}
for part_num in db_part_nums:
    normalized = normalize_part_num(part_num)
    if normalized not in normalized_to_db:
        normalized_to_db[normalized] = part_num

# First pass: Direct matches
print("Performing direct updates...")
updated_count = 0
for part in ba_parts:
    part_num = part['part_num']
    ba_name = part['ba_name']
    ba_cat_id = part['ba_cat_id']

    cursor.execute(
        "UPDATE parts SET ba_name = ?, ba_cat_id = ? WHERE part_num = ?",
        (ba_name, ba_cat_id, part_num)
    )

    if cursor.rowcount > 0:
        updated_count += 1

# Second pass: Normalized matches for parts not directly matched
print("Performing normalized updates...")
normalized_updated_count = 0
not_matched_count = 0
not_matched_parts = []

for ba_part in ba_parts:
    normalized_ba = normalize_part_num(ba_part['part_num'])

    # Skip if we already successfully updated this part in the first pass
    cursor.execute(
        "SELECT 1 FROM parts WHERE part_num = ? AND ba_name IS NOT NULL",
        (ba_part['part_num'],)
    )
    if cursor.fetchone():
        continue

    # Try to find a matching normalized part number in the database
    if normalized_ba in normalized_to_db:
        db_part_num = normalized_to_db[normalized_ba]

        cursor.execute(
            "UPDATE parts SET ba_name = ?, ba_cat_id = ? WHERE part_num = ?",
            (ba_part['ba_name'], ba_part['ba_cat_id'], db_part_num)
        )

        if cursor.rowcount > 0:
            normalized_updated_count += 1
    else:
        not_matched_count += 1
        not_matched_parts.append(ba_part['part_num'])

# Commit changes and close connection
conn.commit()
conn.close()

print(f"Update complete:")
print(f"  - {updated_count} parts updated with direct matching")
print(f"  - {normalized_updated_count} additional parts updated with normalized matching")
print(f"  - {not_matched_count} parts from CSV still not found in the database")

# Write not found parts to a file for reference
if not_matched_count > 0:
    with open('data/not_matched_parts.txt', 'w') as f:
        f.write('\n'.join(not_matched_parts))
    print(f"List of not matched parts written to data/not_matched_parts.txt")