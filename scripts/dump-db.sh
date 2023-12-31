#!/bin/bash

# $1 - path to where the dump should be saved on the host machine (WITHOUT / AT THE END)
# $2 - (optional) name of the docker container with the database

if [ ! -f ".env" ]; then
  echo "Error: .env file not found in the current directory"
  exit 1
elif [ ! -d "$1" ]; then
  echo "Please provide a valid path to the directory where you want the dump to be saved as the first argument"
  exit 2
else
  # Remove final / from the path (if it's present at all)
  DUMP_PATH=$(echo "$1" | sed -E 's/\/$//')
fi

if [ -n "$2" ]; then
  DB_CONTAINER=$2
else
  DB_CONTAINER=cc-mongo
fi

# Check that the container with the DB is running
if [ -z "$(sudo docker ps | grep "$DB_CONTAINER$")" ]; then
  echo "Error: Container $DB_CONTAINER not found"
  exit 3
fi

# Create DB backup
echo -e "Backing up \"cubingcontests\" database from the $DB_CONTAINER container...\n"
source .env
sudo docker exec $DB_CONTAINER \
  sh -c "mongodump -u $MONGO_DEV_USERNAME -p $MONGO_DEV_PASSWORD --db cubingcontests && tar -cvz /dump/cubingcontests" > \
  "$DUMP_PATH/backup_$(date "+%Y_%m_%d_%H_%M_%S").tar.gz" &&
# Remove dump created by mongodump inside of the container in the previous command
sudo docker exec $DB_CONTAINER sh -c "rm -rf /dump" &&
echo -e "\nDatabase backed up to $DUMP_PATH"
# Delete the oldest backup (get all files in, sort them alphabetically, skip the first line
# that simply shows the path passed in with $1, and take the path to the first (oldest) backup)
rm -f $(find "$DUMP_PATH" | sort | tail -n +2 | head -n 1) &&
echo -e "\nOldest backup deleted\n\nCurrent backups:\n"
ls "$DUMP_PATH"