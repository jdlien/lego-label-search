#!/usr/bin/env python3
import csv
import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('data/lego.sqlite')
cursor = conn.cursor()

# Create a dictionary to track unique relationships (to handle duplicates)
unique_relationships = {}

# Read the CSV file
with open('data/part_relationships.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)  # Skip header row

    for row in reader:
        rel_type, child_part_num, parent_part_num = row

        # Use the combination of child_part_num and parent_part_num as key
        relationship_key = (child_part_num, parent_part_num)

        # Only keep the first occurrence of each relationship
        if relationship_key not in unique_relationships:
            unique_relationships[relationship_key] = rel_type

# Insert the unique relationships into the database
for (child_part_num, parent_part_num), rel_type in unique_relationships.items():
    try:
        cursor.execute(
            "INSERT INTO part_relationships (rel_type, child_part_num, parent_part_num) VALUES (?, ?, ?)",
            (rel_type, child_part_num, parent_part_num)
        )
    except sqlite3.Error as e:
        print(f"Error inserting {child_part_num}, {parent_part_num}: {e}")

# Create indexes for better performance
cursor.execute("CREATE INDEX IF NOT EXISTS idx_part_relationships_rel_type ON part_relationships(rel_type)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_part_relationships_child_part_num ON part_relationships(child_part_num)")
cursor.execute("CREATE INDEX IF NOT EXISTS idx_part_relationships_parent_part_num ON part_relationships(parent_part_num)")

# Commit changes and close connection
conn.commit()

# Print statistics
cursor.execute("SELECT COUNT(*) FROM part_relationships")
total = cursor.fetchone()[0]
print(f"Total relationships imported: {total}")

cursor.execute("SELECT rel_type, COUNT(*) FROM part_relationships GROUP BY rel_type")
for rel_type, count in cursor.fetchall():
    print(f"Relationship type {rel_type}: {count} records")

conn.close()