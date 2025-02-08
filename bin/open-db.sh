#!/bin/bash

if [ ! -f ".env" ]; then
  echo "Error: .env file not found in the current directory"
  exit 1
fi

source .env

if [ -n "$1" ]; then
  sudo docker exec -it "$1" mongosh "mongodb://$DB_USERNAME:$DB_PASSWORD@localhost:27017/$DB_NAME"
else
  docker exec -it cc-mongo-dev mongosh "mongodb://$DB_USERNAME:$DB_PASSWORD@localhost:27017/$DB_NAME"
fi
