#!/bin/bash

# Script to remove duplicate script references in HTML files

# Loop through all HTML files in the Page directory
for file in ./Page/*.html; do
  # Remove duplicate references to api-service.js
  sed -i '' 's|<script src="../Scripts/api-service.js"></script>.*<script src="../Scripts/api-service.js"></script>|<script src="../Scripts/api-service.js"></script>|g' "$file"
  
  # Remove duplicate references to auth-guard.js
  sed -i '' 's|<script src="../Scripts/auth-guard.js"></script>.*<script src="../Scripts/auth-guard.js"></script>|<script src="../Scripts/auth-guard.js"></script>|g' "$file"
  
  echo "Cleaned up duplicate script references in $file"
done

echo "Done cleaning up duplicate script references" 