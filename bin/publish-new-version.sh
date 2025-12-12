#!/bin/bash

# First, make sure there are no errors and that the frontend builds successfully
if [ -z "$1" ] || [ "$1" != "--no-checks" ]; then
  cd client
  deno task check

  if [ $? -gt 0 ]; then
    echo -e "\n\nPlease fix all errors before publishing a new version"
    exit
  fi

  deno task build

  if [ $? -gt 0 ]; then
    echo -e "\n\nPlease make sure the frontend builds successfully before publishing a new version"
    exit
  fi

  # Check that the tests run successfully
  deno test &&
  cd ..
fi

git tag | sort -t "." -k1,1n -k2,2n -k3,3n -k4,4n | tail
echo "Please give the new version tag:"
read new_version

if [ -z "$1" ] || [ "$1" != '--no-git' ]; then
  echo "Pushing version $new_version to Github..."
  git push origin main &&
  # git push origin dev &&
  git tag --force --annotate "$new_version" -m "Version $new_version" &&
  git push --force origin --tags
fi

if [ -z "$1" ] || [ "$1" != '--no-docker' ]; then
  echo -e "\nPushing to Dockerhub"
  docker login
  # Remove old images
  docker images | grep cubingcontests | tr -s ' ' | cut -d ' ' -f 2 | xargs -tI % docker rmi % --force
  # Client container
  rm client/.env.local
  source .env
  docker build --build-arg NEXT_PUBLIC_BASE_URL="$PROD_BASE_URL" -t denimint/cubingcontests-client:$new_version --file client.Dockerfile . &&
  docker tag denimint/cubingcontests-client:$new_version denimint/cubingcontests-client:latest &&
  docker push denimint/cubingcontests-client:$new_version &&
  docker push denimint/cubingcontests-client:latest &&
fi

echo -e "\nDone!"
