#!/bin/bash

##################################################
# Script for (re)starting production environment #
##################################################

# $1 - (optional) --revert - revert to previous version
# $1 - (optional) --dev/-d - run in development
# $1 - (optional) --restart - skip apt update and DB dump

# $2 - (optional, required if $1 = --revert) version
# $2 - (optional) --cleanup - only used when $1 = --dev/-d

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

  ./scripts/dump-db.sh /dump

  # Stop Docker containers
  sudo docker compose -f docker-compose-prod.yml down &&

  # Revert to previous version tag
  git reset --hard $VERSION &&

  restart_containers

elif [ "$1" != "--dev" ] && [ "$1" != "-d" ]; then

  #### PRODUCTION ####

  if [ "$1" != "--restart" ]; then  
    sudo apt update &&
    sudo apt dist-upgrade

    ./scripts/dump-db.sh /dump
  fi

  # Stop Docker containers
  sudo docker compose -f docker-compose-prod.yml down &&

  # Pull from Github
  echo -e "Pulling from Github...\n"
  git pull

  restart_containers

else #### DEVELOPMENT ####

  # Stop Docker containers
  docker compose -f docker-compose-prod-dev.yml down &&
  docker compose down &&

  # Remove all images that contain "denimint"
  echo -e "\nRemoving old images\n"
  docker images | grep cubingcontests | tr -s ' ' | cut -d ' ' -f 3 | xargs -tI % docker rmi % --force

  if [ "$2" != "--cleanup" ]; then
    docker build --build-arg BASE_URL=http://localhost:5000 -t cubingcontests-client --file client.Dockerfile . &&
    # Build API container
    docker build -t cubingcontests-api --file server.Dockerfile . &&

    docker compose -f docker-compose-prod-dev.yml up
  fi

fi
