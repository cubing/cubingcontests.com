#!/bin/bash

# $1 - path to where the dump should be saved on the host machine (WITHOUT / AT THE END)
# $2 - (optional) --dev/-d - run in development

if [ ! -f ".env" ]; then
  echo "Error: .env file not found in the current directory (this script must be run from the project root directory)"
  exit 1
elif [ ! -d "$1" ]; then
  echo "Please provide a valid path to the directory where you want the dump to be saved as the first argument"
  exit 2
else
  # Remove final / from the path (if it's present at all)
  dump_path=$(echo "$1" | sed -E 's/\/$//')
fi

if [ "$2" != "--dev" ] && [ "$2" != "-d" ]; then
  db_container=cc-mongo
else
  db_container=cc-mongo-dev
fi

# Check that the container with the DB is running
if [ -z "$(sudo docker ps | grep "$db_container$")" ]; then
  echo "Error: Container $db_container not found"
  exit 3
fi

file_name="backup_$(date "+%Y_%m_%d_%H_%M_%S").tar.gz"

source .env
# Create DB backup
echo -e "Backing up \"$DB_NAME\" database from the $db_container container...\n"
sudo docker exec $db_container \
  sh -c "mongodump -u $DB_USERNAME -p $DB_PASSWORD --db $DB_NAME && tar -cvzf /dump/$file_name /dump/$DB_NAME" &&
sudo docker cp "$db_container:/dump/$file_name" "$dump_path/$file_name" &&
# Remove dump created by mongodump inside of the container
sudo docker exec $db_container sh -c "rm -rf /dump" &&
echo -e "\nDatabase backed up to $dump_path\n"

# Delete the oldest backup
if [ $(find "$dump_path" -type f | wc -l) -gt 5 ]; then
  rm -f $(find "$dump_path" -type f | sort | head -n 1) &&
  echo -e "Oldest backup deleted\n"
fi

echo -e "Current backups:\n"
ls "$dump_path" | grep ".tar.gz"