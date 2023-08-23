#!/bin/bash

# $1 - path to where the dump should be saved on the host machine (WITHOUT / AT THE END)
# $2 - (optional) name of the docker container with the database

if [ ! -f ".env" ]; then
  echo "Error: .env file not found in the current directory"
  exit 1
fi

if [ -z "$1" ]; then
  echo "Please provide the path where you want the dump to be saved as the first argument"
  exit 2
else
  # Remove final / from the path (if it's present at all)
  $1=$(echo "$1" | sed -E 's/\/$//')
fi

if [ -n "$2" ]; then
  DB_CONTAINER=$2
else
  DB_CONTAINER=cc-mongo
fi

# Create DB backup if the database container is running
if [ -n "$(sudo docker ps | grep $DB_CONTAINER)" ]; then
  echo -e "Backing up \"cubingcontests\" database from the $DB_CONTAINER container...\n"
  source .env
  sudo docker exec $DB_CONTAINER sh -c "mongodump -u $MONGO_DEV_USERNAME -p $MONGO_DEV_PASSWORD --db cubingcontests && tar -cvz /dump/cubingcontests" > "$1/backup_$(date "+%Y_%m_%d_%H_%M_%S").tar.gz" &&
  # Remove dump created by mongodump inside of the container in the previous command
  sudo docker exec $DB_CONTAINER sh -c "rm -rf /dump" &&
  echo -e "\nDatabase backed up to $1"
  # Delete the oldest backup (get all files in, sort them alphabetically, skip the first line
  # that simply shows the path passed with $1, and take the path to the first (oldest) backup)
  rm -f $(find "$1" | sort | tail -n +2 | head -n 1) &&
  echo -e "\nCurrent backups:\n"
  ls "$1"
  echo -e "\nOldest backup deleted"
else
  echo "Container $DB_CONTAINER not found"
fi