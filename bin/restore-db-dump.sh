#!/bin/bash

#########################################################################################
# Script for restoring all collections in the DB, except the users and logs collections #
#########################################################################################

# $1 - directory, from which the dump should be restored
# $2 - (optional) --overwrite - OVERWRITES the collections (deletes them first, then restores)
# $2/3 - (optional) name of the docker container with the database

if [ ! -f ".env" ]; then
  echo "Error: .env file not found in the current directory"
  exit 1
elif [ ! -d "$1" ]; then
  echo "Error: please provide a valid path to the directory containing the DB dumps as the first argument"
  exit 2
fi

overwrite=false
if [ "$2" == "--overwrite" ]; then
  overwrite=true
fi

if [ -n "$3" ]; then
  db_container=$3
elif [ -n "$2" ] && [ "$2" != "--overwrite" ]; then
  db_container=$2
else
  db_container=cc-mongo-dev
fi

# Check that the container with the DB is running
if [ -z "$(docker ps | grep "$db_container$")" ]; then
  echo "Error: Container $db_container not found"
  exit 3
fi

# Directory that contains the DB dumps
dump_path=$(echo "$1" | sed -E 's/\/$//')
# Gets the newest dump
filename=$(ls "$dump_path" | grep ".tar.gz" | sort | tail -n 1)

if [ $overwrite != true ]; then
  echo -e "\nRestoring from $dump_path/$filename. Continue? (y/N)"
else
  echo -e "\nWARNING! Restoring from $dump_path/$filename WITH OVERWRITE! Continue? (y/N)"
fi

read answer

if [ "$answer" == "y" ] || [ "$answer" == "Y" ]; then
  source .env
  collections=( "competitions" "people" "rounds" "results" "recordtypes" "events" "schedules" "eventrules" "collectivesolutions" "logs" )

  # Copy dump to Docker container and extract it
  docker cp "$dump_path/$filename" $db_container:/$filename
  docker exec $db_container sh -c "tar -xvzf /$filename"
  # Delete the archive with the dump
  docker exec $db_container sh -c "rm -f /$filename"

  for col in "${collections[@]}"; do
    if [ $overwrite == true ]; then
      # Drop collection (if it returns true, that means it successfully dropped the collection)
      docker exec $db_container mongosh --eval "db.$col.drop()" \
        "mongodb://$DB_USERNAME:$DB_PASSWORD@localhost:27017/$DB_NAME"
    fi

    # Restore collection
    docker exec "$db_container" mongorestore -u $DB_USERNAME -p $DB_PASSWORD \
      --db "$DB_NAME" -c "$col" "/dump/$DB_NAME/$col.bson"
  done

  # Delete dump directory
  docker exec "$db_container" sh -c "rm -rf /dump"

  echo -e "\nDone!"
else
  echo "Aborting"
fi