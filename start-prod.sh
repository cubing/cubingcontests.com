#!/bin/bash

##################################################
# Script for (re)starting production environment #
##################################################

# $1 - (optional) --revert - revert to previous version | --dev/-d - run in development
# $2 - (optional, required if $1 = --revert) version | --cleanup - only used when $1 = --dev/-d

restart_containers() {
  # Remove all images that contain "denimint"
  echo -e "\nRemoving old images...\n"
  sudo docker images | grep cubingcontests | tr -s ' ' | cut -d ' ' -f 3 | xargs -tI % sudo docker rmi % --force

  sudo docker compose -f docker-compose-prod.yml up -d
}

if [ "$1" == "--revert" ]; then

  #### REVERT TO PREVIOUS VERSION ####

  # Check that a version argument was passed
  if [ -z "$2" ]; then
    echo "Please provide a version as the first argument"
    exit
  else
    # If it was, make sure a tag like this exists
    VERSION=$(git tag | grep -x "^$2$")
    
    if [ -z "$VERSION" ]; then
      echo "Version tag $2 does not exist"
      exit
    fi
  fi

  echo "Reverting to version $VERSION (press ENTER to continue...)"
  read

  ./dump-db.sh ~/dump

  # Stop Docker containers
  sudo docker compose -f docker-compose-prod.yml down &&

  # Revert to previous version tag
  git reset --hard $VERSION &&

  restart_containers

elif [ "$1" != "--dev" ] && [ "$1" != "-d" ]; then

  #### PRODUCTION ####

  sudo apt update &&
  sudo apt dist-upgrade

  # Stop Docker containers
  sudo docker compose -f docker-compose-prod.yml down &&

  # Pull from Github
  echo -e "Pulling from Github...\n"
  git pull

  ./dump-db.sh ~/dump
  restart_containers

else #### DEVELOPMENT ####

  # Stop Docker containers
  docker compose -f docker-compose-prod.yml down &&
  docker compose down &&

  # Remove all images that contain "denimint"
  echo -e "\nRemoving old images\n"
  docker images | grep cubingcontests | tr -s ' ' | cut -d ' ' -f 3 | xargs -tI % docker rmi % --force

  if [ "$2" != "--cleanup" ]; then
    docker compose -f docker-compose-prod.yml up
  fi

fi
