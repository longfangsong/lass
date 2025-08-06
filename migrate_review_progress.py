#!/usr/bin/env python3
"""
Migration script to convert ReviewProgress table data to WordBookEntry table format.

This script reads the migrateReviewProgress.sql file and converts the INSERT statements
from the old ReviewProgress table format to the new WordBookEntry table format.

Mapping:
- Old review_count -> New passive_review_count
- Old query_count -> Ignored (not used in new schema)
- Old last_review_time -> Used to calculate next_passive_review_time
- New active_review_count -> Set to -1 (default)
- New next_active_review_time -> Set to -1 (default)
- New deleted -> Set to FALSE
- All update_time and sync_at -> Set to 1754434712856
"""

import re
import uuid
from datetime import datetime

def parse_review_progress_insert(line):
    """Parse a ReviewProgress INSERT statement and extract values."""
    # Match INSERT INTO ReviewProgress VALUES(...);
    match = re.match(r"INSERT INTO ReviewProgress VALUES\('([^']+)','([^']+)','([^']+)',(\d+),(\d+),(NULL|\d+),(\d+|\d+),(\d+)\);", line)
    if not match:
        return None

    return {
        'id': match.group(1),
        'user_email': match.group(2),
        'word_id': match.group(3),
        'query_count': int(match.group(4)),
        'review_count': int(match.group(5)),
        'last_last_review_time': None if match.group(6) == 'NULL' else int(match.group(6)),
        'last_review_time': int(match.group(7)),
        'update_time': int(match.group(8))
    }

def calculate_next_review_time(last_review_time, review_count):
    """
    Calculate next review time based on spaced repetition algorithm.
    Simple implementation: next review = last_review + (review_count * 24 hours in ms)
    """
    if last_review_time is None:
        return -1

    # Simple spaced repetition: 1 day, 3 days, 7 days, 14 days, 30 days, then 30 days intervals
    intervals = [1, 3, 7, 14, 30]
    if review_count <= 0:
        interval_days = 1
    elif review_count <= len(intervals):
        interval_days = intervals[review_count - 1]
    else:
        interval_days = 30

    # Convert days to milliseconds and add to last review time
    interval_ms = interval_days * 24 * 60 * 60 * 1000
    return last_review_time + interval_ms

def convert_to_word_book_entry(old_record):
    """Convert ReviewProgress record to WordBookEntry format."""
    # Calculate next passive review time

    return {
        'id': str(uuid.uuid4()),  # Generate new UUID for WordBookEntry
        'user_email': old_record['user_email'],
        'word_id': old_record['word_id'],
        'passive_review_count': 6 if old_record['review_count'] == 6 else -1,
        'next_passive_review_time': -1,
        'active_review_count': -1,  # Default value as specified
        'next_active_review_time': -1,  # Default value as specified
        'deleted': 'FALSE',
        'update_time': 1754434712856,  # Fixed timestamp as requested
        'sync_at': 1754434712856  # Fixed timestamp as requested
    }

def generate_word_book_entry_insert(record):
    """Generate INSERT statement for WordBookEntry table."""
    return (
        f"INSERT INTO WordBookEntry VALUES("
        f"'{record['id']}', "
        f"'{record['user_email']}', "
        f"'{record['word_id']}', "
        f"{record['passive_review_count']}, "
        f"{record['next_passive_review_time']}, "
        f"{record['active_review_count']}, "
        f"{record['next_active_review_time']}, "
        f"{record['deleted']}, "
        f"{record['update_time']}, "
        f"{record['sync_at']}"
        f");"
    )

def main():
    """Main migration function."""
    input_file = 'migrateReviewProgress.sql'
    output_file = 'migrate_to_word_book_entry.sql'

    print(f"Reading from {input_file}...")

    converted_records = []

    try:
        with open(input_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()

                # Skip comments and empty lines
                if not line or line.startswith('--'):
                    continue

                # Parse INSERT statements
                if line.startswith('INSERT INTO ReviewProgress'):
                    old_record = parse_review_progress_insert(line)
                    if old_record:
                        new_record = convert_to_word_book_entry(old_record)
                        converted_records.append(new_record)
                    else:
                        print(f"Warning: Could not parse line {line_num}: {line}")

    except FileNotFoundError:
        print(f"Error: Input file {input_file} not found!")
        return

    print(f"Converted {len(converted_records)} records")

    # Write output SQL file
    print(f"Writing to {output_file}...")

    with open(output_file, 'w', encoding='utf-8') as f:
        # Write header comment
        f.write("-- Migration from ReviewProgress to WordBookEntry\n")
        f.write(f"-- Generated on {datetime.now().isoformat()}\n")
        f.write(f"-- Converted {len(converted_records)} records\n")
        f.write("-- \n")
        f.write("-- Mapping:\n")
        f.write("-- Old review_count -> New passive_review_count\n")
        f.write("-- Old last_review_time -> Used to calculate next_passive_review_time\n")
        f.write("-- New active_review_count -> Set to -1 (default)\n")
        f.write("-- New next_active_review_time -> Set to -1 (default)\n")
        f.write("-- New deleted -> Set to FALSE\n")
        f.write("-- All update_time and sync_at -> Set to 1754434712856\n")
        f.write("\n")

        # Write INSERT statements
        for record in converted_records:
            f.write(generate_word_book_entry_insert(record) + '\n')

    print(f"Migration complete! Output written to {output_file}")
    print(f"Total records migrated: {len(converted_records)}")

if __name__ == '__main__':
    main()
