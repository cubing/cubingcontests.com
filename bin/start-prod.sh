#!/bin/bash

##################################################
# Script for (re)starting production environment #
##################################################

# $1 - (optional) --restart/-r - skip apt update and DB dump
# $2 - (optional) --no-backup - skip creating the backup

cd "$(dirname "$0")/.."

source .env
docker pull "$DOCKER_IMAGE_NAME"

# Restart
if [[ "$1" == "--restart" || "$1" == "-r" ]]; then  
  if [ "$2" != "--no-backup" ]; then
    ./bin/create-full-backup.sh || exit 1
  fi

  docker stop rr-nextjs

  if [ "$DISABLE_CADDY_DOCKER_SERVICE" != "true" ]; then
    docker exec -w /etc/caddy rr-caddy caddy reload || exit 2
  fi
fi

./bin/apply-db-migrations.sh || exit 3

if [ "$DISABLE_CADDY_DOCKER_SERVICE" == "true" ]; then
  docker compose up nextjs -d
else
  docker compose up -d
fi
