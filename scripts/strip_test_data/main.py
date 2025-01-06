#! /usr/bin/env python3

import sys

keep = [f"\'{k}\'" for k in ["a", "av", "abnorm", "abnormt", "abstraherar", "abstraktion", "abstrakt", "barn", "barnen", "barnet",
         "abonnerads", "absorberar", "sitt", "sin", 
           "c50b3c3f-039f-4eab-ae0d-822e8b9729ea",
           "8fe8315a-d718-4af7-bb17-2c0df9c44386",
           "0630931c-9b51-4ef6-b477-ad4ffb590016",
           "8802ad51-b2e6-47f7-8aaf-11cface826ea"
         ]]
if len(sys.argv) != 3:
    print("Usage: python3 main.py <input_file> <output_dir>")
    sys.exit(1)

input_file = sys.argv[1]
output_file = sys.argv[2]

with open(input_file, "r") as f:
    lines = f.readlines()
    data = []
    i = 0
    current_lines = []
    while i < len(lines):
        if len(current_lines) == 0 and lines[i].startswith("INSERT INTO Word") or \
           len(current_lines) == 1 and lines[i].startswith("INSERT INTO WordIndex") or \
           len(current_lines) == 2 and lines[i].startswith("INSERT INTO Lexeme"):
            current_lines.append(lines[i])
            if len(current_lines) == 3:
                if any(k in line for k in keep for line in current_lines):
                    data.extend(current_lines)
                current_lines = []
        else:
            current_lines = []
        i += 1
    with open(output_file, "w") as f:
        for line in data:
            f.write(line)
