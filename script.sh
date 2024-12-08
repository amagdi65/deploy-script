#!/bin/bash

# Source directory (steps folder)
source_directory="./steps"

# Destination paths for directories and files
destination_folders="../tawaf/src/assets"
destination_files="../tawaf/src/data"

# Create destination directories if they don't exist
mkdir -p "$destination_folders"
mkdir -p "$destination_files"

cp -r "./metadata/addressesData.js" "../tawaf/src/data/metaData/addressesData.js"
cp -r "./metadata/stepsData.js" "../tawaf/src/data/metaData/stepsData.js"



# Loop through each item in the source directory
for item in "$source_directory"/*; do
    # Check if it's a directory
    if [ -d "$item" ]; then
        echo "Copying directory: $item"
        cp -r "$item" "$destination_folders/"
    # Check if it's a file
    elif [ -f "$item" ]; then
        echo "Copying file: $item"
        cp "$item" "$destination_files/"
    fi
done

ls

cd "../tawaf"

npm run build

git add .

git commit -m "commit from bash script"

git push

cd "../tawaf/dist/"

git add .

git commit -m "commit from bash script"

git push

echo "Copy operation complete."
