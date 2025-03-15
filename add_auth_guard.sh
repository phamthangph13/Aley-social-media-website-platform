#!/bin/bash

# Script to add auth-guard.js to all HTML files in the Page directory

# Loop through all HTML files in the Page directory
for file in ./Page/*.html; do
  # Check if the file already has auth-guard.js
  if ! grep -q "auth-guard.js" "$file"; then
    # Check if the file has api-service.js
    if grep -q "api-service.js" "$file"; then
      # Add auth-guard.js after api-service.js
      sed -i '' 's|<script src="../Scripts/api-service.js"></script>|<script src="../Scripts/api-service.js"></script>\n    <script src="../Scripts/auth-guard.js"></script>|' "$file"
      echo "Added auth-guard.js to $file (after api-service.js)"
    else
      # Add both api-service.js and auth-guard.js before the first script tag
      sed -i '' 's|<script src="|<script src="../Scripts/api-service.js"></script>\n    <script src="../Scripts/auth-guard.js"></script>\n    <script src="|' "$file"
      echo "Added api-service.js and auth-guard.js to $file"
    fi
  else
    echo "$file already has auth-guard.js"
  fi
done

echo "Done adding auth-guard.js to all HTML files in the Page directory" 