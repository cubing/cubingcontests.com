#!/bin/bash

##################################################
# Script for (re)starting production environment #
##################################################

DB_CONTAINER=cc-mongo

create_db_backup() {
  # Create DB backup if the database container is running
  if [ -n "$(sudo docker ps | grep $DB_CONTAINER)" ]; then
    echo -e "Backing up \"cubingcontests\" database from the $DB_CONTAINER container...\n"
    source .env
    sudo docker exec $DB_CONTAINER sh -c "mongodump -u $MONGO_DEV_USERNAME -p $MONGO_DEV_PASSWORD --db cubingcontests && tar -cvz /dump/cubingcontests" > ~/dump/backup_`date "+%Y_%m_%d_%H_%M_%S"`.tar.gz &&
    # Remove dump created by mongodump inside of the container in the previous command
    sudo docker exec $DB_CONTAINER sh -c "rm -rf /dump" &&
    echo -e "\nDatabase backed up to ~/dump"
    # Delete the oldest backup (get all files in ~/dump, sort them alphabetically, skip the first line
    # that simply shows the path to ~/dump, and take the path to the first (oldest) backup)
    rm -f $(find ~/dump | sort | tail -n +2 | head -n 1) &&
    echo -e "\nCurrent backups:\n" 
    ls ~/dump
    echo -e "\nOldest backup deleted (press ENTER to continue...)"
    read
  fi
}

restart_containers() {
  # Stop Docker containers
  sudo docker compose -f docker-compose-prod.yml down &&

  # Remove all images that contain "denimint"
  echo -e "\nRemoving old images...\n"
  sudo docker images -q | grep cubingcontests | xargs -tI % sudo docker rmi % --force

  sudo docker compose -f docker-compose-prod.yml up -d
}

if [ "$1" == "--revert" ]; then

  #### REVERT TO PREVIOUS VERSION ####

  # Check that a version argument was passed
  if [ -z $2 ]; then
    echo "Please provide a version as the first argument"
    exit
  else
    # If it was, make sure a tag like this exists
    VERSION=$(git tag | grep -x "^$2$")
    
    if [ -z $VERSION ]; then
      echo "Version tag $2 does not exist"
      exit
    fi
  fi

  echo "Reverting to version $VERSION (press ENTER to continue...)"
  read

  create_db_backup

  # Revert to previous version tag
  git reset --hard $VERSION &&

  restart_containers

elif [ "$1" != "--dev" ] && [ "$1" != "-d" ]; then

  #### PRODUCTION ####

  sudo apt update &&
  sudo apt dist-upgrade

  # Pull from Github
  echo -e "Pulling from Github...\n"
  git pull

  create_db_backup
  restart_containers

else #### DEVELOPMENT ####

  # Stop Docker containers
  docker compose -f docker-compose-prod.yml down &&
  docker compose down &&

  # Remove all images that contain "denimint"
  echo -e "\nRemoving old images\n"
  docker images -q | grep cubingcontests | xargs -tI % docker rmi % --force

  if [ "$2" != "--cleanup" ]; then
    docker compose -f docker-compose-prod.yml up
  fi

fi
