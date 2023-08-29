#!/bin/bash

git tag | tail
echo "Please give the new version tag:"
read NEW_VERSION

if [ -z "$1" ] || [ "$1" != '--no-git' ]; then
  echo "Pushing to Github..."
  git push origin main &&
  git tag --force --annotate $NEW_VERSION -m "Version $NEW_VERSION" &&
  git push --force origin --tags
fi

if [ -z "$1" ] || [ "$1" != '--no-docker' ]; then
  echo -e "\nPushing to Dockerhub"
  docker login -u denimint
  # Remove all images that contain "cubingcontests"
  docker images -q | grep cubingcontests | xargs -tI % docker rmi % --force
  # Client container
  docker build -t denimint/cubingcontests-client:$NEW_VERSION --file client.Dockerfile . &&
  docker tag denimint/cubingcontests-client:$NEW_VERSION denimint/cubingcontests-client:latest &&
  docker push denimint/cubingcontests-client:$NEW_VERSION &&
  docker push denimint/cubingcontests-client:latest &&
  # API container
  docker build -t denimint/cubingcontests-api:$NEW_VERSION --file server.Dockerfile . &&
  docker tag denimint/cubingcontests-api:$NEW_VERSION denimint/cubingcontests-api:latest &&
  docker push denimint/cubingcontests-api:$NEW_VERSION &&
  docker push denimint/cubingcontests-api:latest
fi

echo -e "\nProvide a path to the directory you want to download the DB dumps to (leave empty to abort)"
read PATH

if [ -n "$PATH" ]; then
  ./scripts/download-db-dumps.sh "$PATH"
fi

echo -e "\nDone!"
