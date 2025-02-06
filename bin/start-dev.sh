#!/bin/bash

if [ "$(pwd | tail -c 5)" == "/bin" ]; then
  echo "Please run this script from the root directory"
  exit 1
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "Environment variables copied from .env.example to .env\n"
fi

# Install dependencies
cd client
deno install --allow-scripts
cd ..

# Copy required environment variables from .env to client/.env.development
cp .env client/.env.development

# This stuff is temporary. It can be removed when the migration away from Nest JS is done.
./bin/copy-shared-to-server.sh
cd server
npm install
cd ..
cp .env server/.env.dev

# Start the frontent (c), legacy backend (s), and database (d)
deno run -A npm:concurrently -kc blue,red,green -n c,s,d \
  "cd client && deno task dev" \
  "cd server && npm run dev" \
  "docker compose up"

docker compose down
