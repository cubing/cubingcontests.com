#!/bin/bash

docker rm --force cc-api
docker rmi cubingcontests-api:latest
docker build --tag cubingcontests-api --file server.Dockerfile . &&
docker compose up