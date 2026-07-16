#!/bin/bash

cd "$(dirname "$0")/.."

set -o allexport
source .env
set +o allexport
# Substitutes variables, excludes PORT variable (not used in k8s pods), strips out comments and removes double quotes
envsubst < .env | grep -v "^PORT=" | sed 's/\s*#.*$//;s/"//g' > .env.temp

kubectl create configmap recordranks-config --from-env-file=.env.temp -o yaml --dry-run=client > ./k8s/configmap.yaml || exit 1
rm .env.temp

kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/service.yaml 
sed "s|__DOCKER_IMAGE_NAME__|${DOCKER_IMAGE_NAME}|" k8s/deployment.yaml | kubectl apply -f -

./bin/apply-db-migrations.sh || exit 2
