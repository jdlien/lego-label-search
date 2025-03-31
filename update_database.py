#!/usr/bin/env python3
import csv
import sqlite3
import os

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

# Read the CSV file and update the database
print("Reading CSV file...")
updated_count = 0
not_found_count = 0
not_found_parts = []

with open('data/ba_parts.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header row

    for row in reader:
        part_num = row[0]
        ba_name = row[1]
        ba_cat_id = row[2]

        # Update the parts table
        cursor.execute(
            "UPDATE parts SET ba_name = ?, ba_cat_id = ? WHERE part_num = ?",
            (ba_name, ba_cat_id, part_num)
        )

        # Check if a row was updated
        if cursor.rowcount > 0:
            updated_count += 1
        else:
            not_found_count += 1
            not_found_parts.append(part_num)

# Commit changes and close connection
conn.commit()
conn.close()

print(f"Update complete. {updated_count} parts updated.")
print(f"{not_found_count} parts from CSV were not found in the database.")

# Write not found parts to a file for reference
if not_found_count > 0:
    with open('data/not_found_parts.txt', 'w') as f:
        f.write('\n'.join(not_found_parts))
    print(f"List of not found parts written to data/not_found_parts.txt")