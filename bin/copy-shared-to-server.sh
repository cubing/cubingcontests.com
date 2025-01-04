#!/bin/bash

rm -rf server/shared
cp -r shared server/
rm server/shared/deno.jsonc
# Remove all .ts extensions in imports
find server/shared -type f -exec sed -i.bak 's/\.ts";$/";/g' {} \;
# Delete the backup files created by sed
find server/shared -type f -name "*.bak" -delete