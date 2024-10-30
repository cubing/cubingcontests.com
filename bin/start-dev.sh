#!/bin/bash

if [ "$(pwd | tail -c 5)" == "/bin" ]; then
  echo "Please run this script from the root directory"
  exit 1
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "Environment variables copied from .env.example to .env\n"
fi

if [ ! -x "$(command -v concurrently)" ]; then
  echo "Please install Concurrently globally! (e.g. npm install -g concurrently)"
  exit 2
fi

# Install dependencies
deno install

# Copy required environment variables from .env to client/.env.development
deno run --allow-read --allow-write ./bin/copy-env-vars.ts

# This stuff is temporary. It can be removed when the backend migration is done.
cp -r client/shared_helpers server/
find server/shared_helpers -type f -exec sed -i 's/\.ts";$/";/g' {} \;
cd server
npm install
cd ..
cp .env server/.env.dev

# Start the frontent (c), legacy backend (l), new backend (s) and database (d)
concurrently -kc blue,red,yellow,green -n c,l,s,d \
  "cd client && deno task dev" \
  "cd server && npm run dev" \
  "cd server2 && deno task dev" \
  "docker compose up"

docker compose down