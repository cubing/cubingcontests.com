#!/bin/bash

if [[ ! -f "$1" ]]; then
  echo "Please provide a path to the backup file (with .tar.gz.gpg file extension) as the first argument"
  exit 1
fi

gpg_file="$1"
tar_file=$(echo "$gpg_file" | sed -r "s/^(.+\/)?(.+\.tar\.gz)\.gpg$/\2/")
output_dir=$(echo "$tar_file" | sed -r "s/\.tar\.gz$//")

if [[ -d "$output_dir" ]]; then
  echo "There is already an extracted backup at ./$output_dir"
  exit 2
fi

echo "Decrypting $gpg_file to ./$tar_file..."

gpg --decrypt -o "./$tar_file" "$gpg_file" &&

echo "Extracting ./$tar_file..." &&

tar -xzf "./$tar_file" &&
rm "./$tar_file"

