#!/bin/bash

# This script generates the icons for the app.

# Create the iconset directory if it doesn't exist
mkdir -p icon.iconset

# Generate all sizes
sips -z 16 16     1024.png --out icon.iconset/icon_16x16.png
sips -z 32 32     1024.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     1024.png --out icon.iconset/icon_32x32.png
sips -z 64 64     1024.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   1024.png --out icon.iconset/icon_128x128.png
sips -z 256 256   1024.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   1024.png --out icon.iconset/icon_256x256.png
sips -z 512 512   1024.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   1024.png --out icon.iconset/icon_512x512.png
cp 1024.png icon.iconset/icon_512x512@2x.png

# Convert to icns
iconutil -c icns icon.iconset

echo "Icon successfully created as icon.icns"

# Optional: copy the icns file to the app's resources directory
# Uncomment and modify the path as needed
# mkdir -p ../src/img/
# cp icon.icns ../src/img/
