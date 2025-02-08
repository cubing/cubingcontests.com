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
  dump_path=$(echo "$1" | sed -E 's/\/$//')
fi

if [ -n "$2" ]; then
  db_container=$2
else
  db_container=cc-mongo
fi

# Check that the container with the DB is running
if [ -z "$(sudo docker ps | grep "$db_container$")" ]; then
  echo "Error: Container $db_container not found"
  exit 3
fi

# Create DB backup
echo -e "Backing up \"$DB_NAME\" database from the $db_container container...\n"
source .env
sudo docker exec $db_container \
  sh -c "mongodump -u $DB_USERNAME -p $DB_PASSWORD --db $DB_NAME && tar -cvz /dump/$DB_NAME" > \
  "$dump_path/backup_$(date "+%Y_%m_%d_%H_%M_%S").tar.gz" &&
# Remove dump created by mongodump inside of the container in the previous command
sudo docker exec $db_container sh -c "rm -rf /dump" &&
echo -e "\nDatabase backed up to $dump_path"
# Delete the oldest backup (get all files in, sort them alphabetically, skip the first line
# that simply shows the path passed in with $1, and take the path to the first (oldest) backup)
rm -f $(find "$dump_path" | sort | tail -n +2 | head -n 1) &&
echo -e "\nOldest backup deleted\n\nCurrent backups:\n"
ls "$dump_path"