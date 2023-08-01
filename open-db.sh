#!/bin/bash

if [ ! -f ".env" ]; then
  echo "Error: .env file not found in the current directory"
  exit 1
fi

source .env

if [ -n "$1" ]; then
  DB_CONTAINER=$1
else
  DB_CONTAINER=cc-mongo
fi

sudo docker exec -it $DB_CONTAINER mongosh "mongodb://$MONGO_DEV_USERNAME:$MONGO_DEV_PASSWORD@localhost:27017/cubingcontests"