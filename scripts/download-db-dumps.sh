#!/bin/bash

if [ ! -d "$1" ]; then
  echo "Error: please provide a valid path to the directory you want to download the dumps to"
  exit 1
fi

scp "cubingcontests:/dump/*" "$1/"