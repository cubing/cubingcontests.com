#!/bin/bash

# trap "docker compose down" EXIT # runs the command in quotes on exit
docker compose up -d
cd server
npm run dev