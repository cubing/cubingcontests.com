#!/bin/bash

if [ "$(pwd | tail -c 5)" == "/bin" ]; then
  echo "Please run this script from the root directory of the project"
  exit 1
fi

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo -e "Environment variables copied from .env.example to .env\n"
fi

cp .env client/.env.local

docker compose up -d &&
sleep 1 &&
cd client

deno install --allow-scripts &&
deno task db:push &&
deno task dev ;
cd ..

docker compose down