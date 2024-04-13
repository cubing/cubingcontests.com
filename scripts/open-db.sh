#!/bin/bash

if [ ! -f ".env" ]; then
  echo "Error: .env file not found in the current directory"
  exit 1
fi

source .env

if [ -n "$1" ]; then
  sudo docker exec -it "$1" mongosh "mongodb://$MONGO_DEV_USERNAME:$MONGO_DEV_PASSWORD@localhost:27017/cubingcontests"
else
  docker exec -it cc-mongo-dev mongosh "mongodb://$MONGO_DEV_USERNAME:$MONGO_DEV_PASSWORD@localhost:27017/cubingcontests"
fi
