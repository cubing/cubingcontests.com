#!/bin/bash

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "Environment variables copied from .env.example to .env\n"
fi

if [ ! -x "$(command -v concurrently)" ]; then
  echo "Please install Concurrently globally! (e.g. npm install -g concurrently)"
  exit 1
fi

# Install dependencies
deno install
# This stuff is temporary. It can be removed when the backend migration is done.
cp -r client/shared_helpers server/
find server/shared_helpers -type f -exec sed -i 's/\.ts";$/";/g' {} \;
cd server
npm install
cd ..

# Start the frontent (c), legacy backend (l), new backend (s) and database (d)
concurrently -kc blue,red,yellow,green -n c,l,s,d \
  "deno task client" \
  "cd server && npm run dev" \
  "deno task server2" \
  "docker compose up"

docker compose down