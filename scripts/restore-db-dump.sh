#!/bin/bash

###############################################################################
# Script for restoring all collections in the DB, except the users collection #
###############################################################################

# $1 - directory, from which the dump should be restored
# $2 - (optional) --overwrite - OVERWRITES the collections (deletes them first, then restores)
# $2/3 - (optional) name of the docker container with the database

if [ ! -f ".env" ]; then
  echo "Error: .env file not found in the current directory"
  exit 1
elif [ -z "$1" ]; then
  echo "Error: please provide the path to the directory containing the DB dumps as the first argument"
  exit 2
fi

OVERWRITE=false
if [ "$2" == "--overwrite" ]; then
  OVERWRITE=true
fi

if [ -n "$3" ]; then
  DB_CONTAINER=$3
elif [ -n "$2" ] && [ "$2" != "--overwrite" ]; then
  DB_CONTAINER=$2
else
  DB_CONTAINER=cc-mongo
fi

# Check that the container with the DB is running
if [ -z "$(sudo docker ps | grep "$DB_CONTAINER$")" ]; then
  echo "Error: Container $DB_CONTAINER not found"
  exit 3
fi

# Directory that contains the DB dumps
DUMP_PATH=$(echo "$1" | sed -E 's/\/$//')
# Gets the newest dump
FILENAME=$(ls "$DUMP_PATH" | sort | tail -n 1)

if [ $OVERWRITE != true ]; then
  echo -e "\nRestoring from $DUMP_PATH/$FILENAME. Continue? (y/N)"
else
  echo -e "\nWARNING! Restoring from $DUMP_PATH/$FILENAME WITH OVERWRITE! Continue? (y/N)"
fi

read ANSWER

if [ "$ANSWER" == "y" ]; then
  source .env
  collections=( "competitions" "people" "rounds" "results" "recordtypes" "events" "schedules" )

  # Copy dump to Docker container and extract it
  sudo docker cp "$DUMP_PATH/$FILENAME" $DB_CONTAINER:/$FILENAME
  sudo docker exec $DB_CONTAINER sh -c "tar -xvzf /$FILENAME"
  # Delete the archive with the dump
  sudo docker exec $DB_CONTAINER sh -c "rm -f /$FILENAME"

  for col in "${collections[@]}"; do
    if [ $OVERWRITE == true ]; then
      # Drop collection (if it returns true, that means it successfully dropped the collection)
      sudo docker exec $DB_CONTAINER mongosh --eval "db.$col.drop()" "mongodb://$MONGO_DEV_USERNAME:$MONGO_DEV_PASSWORD@localhost:27017/cubingcontests"
    fi

    # Restore collection
    sudo docker exec $DB_CONTAINER mongorestore -u $MONGO_DEV_USERNAME -p $MONGO_DEV_PASSWORD --db cubingcontests -c $col /dump/cubingcontests/$col.bson
  done

  # Delete dump directory
  sudo docker exec $DB_CONTAINER sh -c "rm -rf /dump"

  echo -e "\nDone!"
else
  echo "Aborting"
fi