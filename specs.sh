#!/bin/bash

SPECS_DIR="$(dirname "$0")/specs"
TEMPLATE_DIR="$SPECS_DIR/_template"

usage() {
  echo "Usage: ./specs.sh --new=\"Feature name here\""
  exit 1
}

if [ $# -eq 0 ]; then
  usage
fi

case "$1" in
  --new=*)
    name="${1#--new=}"
    ;;
  *)
    usage
    ;;
esac

if [ -z "$name" ]; then
  echo "Error: feature name cannot be empty"
  exit 1
fi

folder=$(echo "$name" | tr '[:upper:]' '[:lower:]' | tr ' ' '_')
target="$SPECS_DIR/$folder"

if [ -d "$target" ]; then
  echo "Error: spec '$folder' already exists at $target"
  exit 1
fi

cp -r "$TEMPLATE_DIR" "$target"

# Replace [name] placeholder with the feature name
sed -i "s/\[name\]/$name/g" "$target"/*.md

echo "Created spec: $target"
ls "$target"
