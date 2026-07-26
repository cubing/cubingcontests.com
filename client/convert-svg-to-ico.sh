#!/bin/sh

# Param 1 (optional): project ID (has to match the PROJECT_ID environment variable)

cd "$(dirname "$0")"

cyan='\033[0;36m'
nc='\033[0m' # no color
ico_file_path="./app/favicon.ico"
project_id="$1"

if [ -n "$project_id" ] && [ -f "./icon.$project_id.svg" ]; then
  svg_file_path="./icon.$project_id.svg"
else
  svg_file_path="./icon.svg"
fi

echo -e "${cyan}Creating ICO file at $ico_file_path from $svg_file_path...${nc}\n"

if [ ! -f "$svg_file_path" ]; then
  echo "Error: SVG icon file not found at $svg_file_path"
  exit 1
fi

if [ -f "$ico_file_path" ]; then
  echo "Error: there is already an ICO file at $ico_file_path"
  exit 2
fi

inkscape -w 16 -h 16 -o 16.png "$svg_file_path" &&
inkscape -w 32 -h 32 -o 32.png "$svg_file_path" &&
inkscape -w 48 -h 48 -o 48.png "$svg_file_path" || exit 3

if [ -n "$(command -v magick)" ]; then
  magick 16.png 32.png 48.png "$ico_file_path" || exit 4
elif [ -n "$(command -v convert)" ]; then
  convert 16.png 32.png 48.png "$ico_file_path" || exit 4
else
  echo "Error: ImageMagick not installed"
  exit 5
fi

rm -f 16.png 32.png 48.png
identify "$ico_file_path"

echo -e "\n${cyan}Created ICO file at $ico_file_path${nc}"
