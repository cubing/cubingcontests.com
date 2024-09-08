#!/bin/bash

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "Environment variables copied from .env.example to .env\n"
fi

if [ -z "$(git config core.hooksPath)" ]; then
  git config core.hooksPath ./.githooks
  echo -e "Set git hooks path to $(git config core.hooksPath)\n"
fi

if [ ! -x "$(command -v nest)" ]; then
  echo "Please install the Nest JS CLI and Concurrently globally! (e.g. npm install -g @nestjs/cli concurrently)"
  exit 1
fi

if [ ! -x "$(command -v concurrently)" ]; then
  echo "Please install Concurrently globally! (e.g. npm install -g concurrently)"
  exit 2
fi

# Install NPM packages
cd client
npm install
cd ../server
npm install
cd ..

# Copy the .env file to server/.env.dev, but change NODE_ENV from production to development
cat .env | sed -E "s/NODE_ENV=production$/NODE_ENV=development$/" > ./server/.env.dev

# Start the frontent (c), backend (s) and database (d)
concurrently -kc blue,yellow,green -n c,s,d \
  "cd client && npm run dev" \
  "cd server && sleep 2 && npm run dev" \
  "docker compose up"

docker compose down