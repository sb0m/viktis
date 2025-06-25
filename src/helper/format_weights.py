import csv
import datetime
import os
import json

# Path to your JSON file
json_file = "/Users/susann.bombor/repos-sb0m/viktis/public/data.json"
output_file = os.path.expanduser("~/Desktop/weights.csv")

# Read the JSON data
with open(json_file, 'r') as f:
    data = json.load(f)

# Write to CSV
with open(output_file, "w") as f_out:
    # Write header
    f_out.write("Date,Weight\n")
    
    # Write data
    for entry in data['weights']:
        timestamp = entry['date']
        weight = entry['weight']
        date = datetime.datetime.fromtimestamp(timestamp/1000).strftime("%Y-%m-%d")
        f_out.write(f"{date},{weight}\n")

print(f"Converted file saved to {output_file}")
