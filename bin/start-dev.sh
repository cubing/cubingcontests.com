#!/bin/bash

if [ "$(pwd | tail -c 5)" == "/bin" ]; then
  echo "Please run this script from the root directory of the project"
  exit 1
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "Environment variables copied from .env.example to .env\n"
fi

docker compose up -d &&
if [ "$?" -gt 0 ]; then
  exit 2
fi
sleep 1 &&

# Copy port environment variables to Next JS project
grep "^PORT=" .env > client/.env.local
grep "^DB_USERNAME=" .env >> client/.env.local
grep "^DB_PASSWORD=" .env >> client/.env.local
grep "^DB_NAME=" .env >> client/.env.local
grep "^BASE_URL=" .env >> client/.env.local
grep "^PROD_BASE_URL=" .env >> client/.env.local
grep "^EMAIL_TEST_INBOX_ID=" .env >> client/.env.local
grep "^EMAIL_API_KEY=" .env >> client/.env.local
grep "^BETTER_AUTH_URL=" .env >> client/.env.local
grep "^BETTER_AUTH_SECRET=" .env >> client/.env.local
cd client

deno install --allow-scripts &&
# TEMPORARY FIX!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
NODE_OPTIONS="--conditions=react-server" npx drizzle-kit push --strict &&
# deno task db:push &&
deno task dev ;
cd ..

docker compose down
