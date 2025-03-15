#!/bin/bash

# Check each HTML file for duplicate script references
for file in ./Page/*.html; do
  # Count occurrences of api-service.js
  api_count=$(grep -c "api-service.js" "$file")
  
  # Count occurrences of auth-guard.js
  auth_count=$(grep -c "auth-guard.js" "$file")
  
  # Report if duplicates found
  if [ "$api_count" -gt 1 ] || [ "$auth_count" -gt 1 ]; then
    echo "Duplicates found in $file:"
    echo "  api-service.js: $api_count"
    echo "  auth-guard.js: $auth_count"
  fi
done 