#!/bin/bash

git tag | sort -t "." -k1,1n -k2,2n -k3,3n -k4,4n | tail
echo "Please give the new version tag:"
read new_version
source .env # needed for the Docker build args below

if [ -z "$1" ] || [ "$1" != '--no-git' ]; then
  echo "Pushing to Github..."
  git push origin main &&
  # git push origin dev &&
  git tag --force --annotate $new_version -m "Version $new_version" &&
  git push --force origin --tags
fi

if [ -z "$1" ] || [ "$1" != '--no-docker' ]; then
  echo -e "\nPushing to Dockerhub"
  docker login -u denimint
  # Remove all images that contain "cubingcontests" (DISABLING THIS TO SEE IF IT WOULD JUST DO AN OVERWRITE CORRECTLY!)
  # docker images | grep cubingcontests | tr -s ' ' | cut -d ' ' -f 3 | xargs -tI % docker rmi % --force
  # Client container
  docker build --build-arg API_BASE_URL="$CLIENT_ARG_API_BASE_URL" \
               --build-arg API_BASE_URL_SERVER_SIDE="$CLIENT_ARG_API_BASE_URL_SERVER_SIDE" \
               --build-arg API_BASE_URL2="$CLIENT_ARG_API_BASE_URL2" \
               --build-arg API_BASE_URL2_SERVER_SIDE="$CLIENT_ARG_API_BASE_URL2_SERVER_SIDE" \
    -t denimint/cubingcontests-client:$new_version --file client.Dockerfile . &&
  docker tag denimint/cubingcontests-client:$new_version denimint/cubingcontests-client:latest &&
  docker push denimint/cubingcontests-client:$new_version &&
  docker push denimint/cubingcontests-client:latest &&
  # Server container
  docker build -t denimint/cubingcontests-server2:$new_version --file server2.Dockerfile . &&
  docker tag denimint/cubingcontests-server2:$new_version denimint/cubingcontests-server2:latest &&
  docker push denimint/cubingcontests-server2:$new_version &&
  docker push denimint/cubingcontests-server2:latest
  # Legacy server container
  docker build -t denimint/cubingcontests-server:$new_version --file server.Dockerfile . &&
  docker tag denimint/cubingcontests-server:$new_version denimint/cubingcontests-server:latest &&
  docker push denimint/cubingcontests-server:$new_version &&
  docker push denimint/cubingcontests-server:latest
fi

echo -e "\nDone!"
