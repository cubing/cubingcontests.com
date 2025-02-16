#!/bin/bash

rm -rf server/helpers
cp -r client/helpers server
rm server/helpers/customHooks.ts
rm server/helpers/utilityFunctions.ts
rm server/helpers/contexts.ts
rm server/helpers/dbTypes.ts
rm -rf server/helpers/validators
# Remove all .ts extensions in imports
find server/helpers -type f -exec sed -i.bak 's/\.ts";$/";/g' {} \;
# Delete the backup files created by sed
find server/helpers -type f -name "*.bak" -delete