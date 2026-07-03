#!/bin/bash

cd "$(dirname "$0")/.."

source .env # needed for the build args

cyan='\033[0;36m'
nc='\033[0m' # no color
version=$(git tag --sort=creatordate | tail -n 1)
image="$DOCKER_IMAGE_NAME:$version"

echo -e "${cyan}Releasing image $image to Dockerhub...${nc}\n"
docker login

# Build Next JS container
docker build --build-arg PROJECT_ID="$PROJECT_ID" \
             --build-arg NEXT_PUBLIC_BASE_URL="https://$PROD_HOSTNAME" \
             --build-arg NEXT_PUBLIC_PROJECT_NAME="$NEXT_PUBLIC_PROJECT_NAME" \
             --build-arg NEXT_PUBLIC_AUTH_PROVIDERS="$NEXT_PUBLIC_AUTH_PROVIDERS" \
             --build-arg NEXT_PUBLIC_STORAGE_PUBLIC_BUCKET_BASE_URL="https://$SUPABASE_HOSTNAME/storage/v1/object/public/$PUBLIC_BUCKET_NAME" \
             --build-arg NEXT_PUBLIC_MULTITENANCY_ENABLED="$NEXT_PUBLIC_MULTITENANCY_ENABLED" \
             --build-arg NEXT_PUBLIC_VERSION="$version" \
             --build-arg NEXT_PUBLIC_BUILD_DATE="$(date --utc +'%Y-%m-%dT%H:%M:%SZ')" \
             -t "$image" ./client &&

docker tag "$DOCKER_IMAGE_NAME:$version" "$DOCKER_IMAGE_NAME:latest" &&
docker push "$DOCKER_IMAGE_NAME:$version" &&
docker push "$DOCKER_IMAGE_NAME:latest"

if [[ $? == 0 ]]; then
  echo -e "\n${cyan}Done!${nc}"
fi