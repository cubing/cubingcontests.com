#!/bin/bash

cd "$(dirname "$0")/.."

source .env # needed for the build args

cyan='\033[0;36m'
nc='\033[0m' # no color

if [[ -n "$1" ]]; then
  version="$1"
else
  git tag --sort=creatordate | tail
  echo -e "\n${cyan}Please give the new version tag:${nc}"
  read version
fi

image="${DOCKER_IMAGE_NAME%:*}:$version"
latest_tag="${DOCKER_IMAGE_NAME%:*}:latest"

echo -e "${cyan}Releasing image $image to Dockerhub...${nc}\n"

docker login || exit 1

# Build Next JS container
docker build --build-arg PROJECT_ID="$PROJECT_ID" \
             --build-arg NEXT_PUBLIC_BASE_URL="https://$PROD_HOSTNAME" \
             --build-arg NEXT_PUBLIC_PROJECT_NAME="$NEXT_PUBLIC_PROJECT_NAME" \
             --build-arg NEXT_PUBLIC_AUTH_PROVIDERS="$NEXT_PUBLIC_AUTH_PROVIDERS" \
             --build-arg NEXT_PUBLIC_STORAGE_PUBLIC_BUCKET_BASE_URL="https://$SUPABASE_HOSTNAME/storage/v1/object/public/$PUBLIC_BUCKET_NAME" \
             --build-arg NEXT_PUBLIC_MULTITENANCY_ENABLED="$NEXT_PUBLIC_MULTITENANCY_ENABLED" \
             --build-arg NEXT_PUBLIC_VERSION="$version" \
             --build-arg NEXT_PUBLIC_BUILD_DATE="$(date --utc +'%Y-%m-%dT%H:%M:%SZ')" \
             -t "$image" ./client || exit 2

docker push "$image" || exit 3

docker tag "$image" "$latest_tag" || exit 4
docker push "$latest_tag" || exit 5

if [[ $? == 0 ]]; then
  echo -e "\n${cyan}Done!${nc}"
fi