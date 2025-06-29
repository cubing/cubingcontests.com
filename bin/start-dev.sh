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

# Copy environment variables to Next JS project
cp .env client/.env.local
  
# Start the frontent (f), database (db), and Drizzle Studio (ds)
deno run -A npm:concurrently -kc green,yellow,blue -n db,ds,f \
  "docker compose up" \
  "sleep 2 && cd client && deno task db:studio" \
  "sleep 2 && cd client && deno task dev"

docker compose down
