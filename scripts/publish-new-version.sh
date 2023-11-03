#!/bin/bash

git tag | sort -t "." -k1,1n -k2,2n -k3,3n | tail
echo "Please give the new version tag:"
read NEW_VERSION

if [ -z "$1" ] || [ "$1" != '--no-git' ]; then
  echo "Pushing to Github..."
  git push origin main &&
  # git push origin dev &&
  git tag --force --annotate $NEW_VERSION -m "Version $NEW_VERSION" &&
  git push --force origin --tags
fi

if [ -z "$1" ] || [ "$1" != '--no-docker' ]; then
  echo -e "\nPushing to Dockerhub"
  docker login -u denimint
  # Remove all images that contain "cubingcontests"
  docker images | grep cubingcontests | tr -s ' ' | cut -d ' ' -f 3 | xargs -tI % docker rmi % --force
  # Client container
  docker build --build-arg API_BASE_URL=https://cubingcontests.com/api -t denimint/cubingcontests-client:$NEW_VERSION --file client.Dockerfile . &&
  docker tag denimint/cubingcontests-client:$NEW_VERSION denimint/cubingcontests-client:latest &&
  docker push denimint/cubingcontests-client:$NEW_VERSION &&
  docker push denimint/cubingcontests-client:latest &&
  # API container
  docker build -t denimint/cubingcontests-api:$NEW_VERSION --file server.Dockerfile . &&
  docker tag denimint/cubingcontests-api:$NEW_VERSION denimint/cubingcontests-api:latest &&
  docker push denimint/cubingcontests-api:$NEW_VERSION &&
  docker push denimint/cubingcontests-api:latest
fi

echo -e "\nDone!"
