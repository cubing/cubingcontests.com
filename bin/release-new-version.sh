#!/bin/bash

cd "$(dirname "$0")/.."

if [[ -z "$1" || "$1" != "--no-checks" ]]; then
  cd client
  pnpm run test --bail=1 && pnpm run check

  if [[ $? > 0 ]]; then
    echo -e "\nPlease make sure all checks and tests pass before publishing a new version"
    exit 2
  fi

  pnpm run build

  if [[ $? > 0 ]]; then
    echo -e "\nPlease make sure the application can build successfully before publishing a new version"
    exit 3
  fi

  cd ..
fi

cyan='\033[0;36m'
nc='\033[0m' # no color

git tag --sort=creatordate | tail
echo -e "\n${cyan}Please give the new version tag:${nc}"
read new_version

echo -e "\n${cyan}Pushing version $new_version to origin...${nc}"
git tag --force --annotate "$new_version" -m "Version $new_version" &&
git push --force origin --tags &&
git push &&

echo -e "\n${cyan}Release new Docker image? (y/N)${nc}" &&
read answer &&

if [[ $? == 0 && ( "$answer" == "y" || "$answer" == "Y" ) ]]; then
  ./bin/release-new-image.sh "$new_version"
fi
