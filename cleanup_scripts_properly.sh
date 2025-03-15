#!/bin/bash

# Better script to remove duplicate script references in HTML files

# Loop through all HTML files in the Page directory
for file in ./Page/*.html; do
  echo "Processing $file..."
  
  # Create a temporary file
  temp_file=$(mktemp)
  
  # Track which scripts we've already seen
  declare -A seen_scripts
  
  # Read the file line by line
  while IFS= read -r line; do
    # Check if the line is a script reference
    if [[ $line =~ \<script\ src=\"([^\"]+)\" ]]; then
      script="${BASH_REMATCH[1]}"
      
      # If we've seen this script before, skip the line
      if [[ -n "${seen_scripts[$script]}" ]]; then
        echo "Removing duplicate: $script"
        continue
      fi
      
      # Mark this script as seen
      seen_scripts[$script]=1
    fi
    
    # Write the line to the temp file
    echo "$line" >> "$temp_file"
  done < "$file"
  
  # Replace the original file with the temp file
  mv "$temp_file" "$file"
  
  echo "Cleaned up duplicate script references in $file"
done

echo "Done cleaning up duplicate script references" 