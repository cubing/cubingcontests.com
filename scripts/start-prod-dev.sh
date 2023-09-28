#!/bin/bash

# This script starts the production version of the full website, but in development

# Remove all images that contain "cubingcontests"
docker images | grep cubingcontests | tr -s ' ' | cut -d ' ' -f 3 | xargs -tI % docker rmi % --force
# Client container
docker build --build-arg API_BASE_URL='http://localhost:5000/api' -t cubingcontests-client --file client.Dockerfile . &&
# API container
docker build -t cubingcontests-api --file server.Dockerfile . &&

docker compose -f docker-compose-prod-dev.yml up