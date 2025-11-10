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
sleep 1 &&

# Copy port environment variables to Next JS project
grep "^PORT=" .env > client/.env.local
grep "^BACKEND_PORT=" .env >> client/.env.local
cd client

deno install --allow-scripts &&
# TEMPORARY FIX!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
NODE_OPTIONS="--conditions=react-server" npx drizzle-kit push --strict &&
# deno task db:push &&
deno task dev ;
cd ..

docker compose down