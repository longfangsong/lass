#! /usr/bin/env python3

import sys
import json
import os
from math import ceil

if len(sys.argv) != 4:
    print("Usage: python3 main.py <input_file> <output_dir> <expected_file_size>")
    sys.exit(1)

input_file = sys.argv[1]
output_dir = sys.argv[2]
expected_file_size = int(sys.argv[3])

with open(input_file, "r") as f:
    filename = input_file.split("/")[-1].split(".")[0]
    data = json.load(f)
    first = data[0]
    first_json = json.dumps(first)
    first_length = len(first_json)
    estimated_count = expected_file_size // first_length
    print(f"all: {len(data)}")
    for i in range(ceil(len(data) / estimated_count)):
        os.makedirs(f"{output_dir}/{filename}", exist_ok=True)
        with open(f"{output_dir}/{filename}/{i}.json", "w") as f:
            print(f"write {i}.json: {i * estimated_count} - {(i + 1) * estimated_count}")
            json.dump(data[i * estimated_count : (i + 1) * estimated_count], f)
