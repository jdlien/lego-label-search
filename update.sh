#!/bin/bash

# Preemptively ask for sudo password and cache credentials
sudo -v
if [ $? -ne 0 ]; then
  echo "Error: You need sudo privileges to run this script."
  exit 1
fi

# Keep sudo session alive while the script runs
( while true; do sudo -n true; sleep 60; done ) &
SUDO_PID=$!
trap 'kill $SUDO_PID' EXIT

# Run git pull and handle errors
if ! git pull; then
  echo "Error: git pull failed. Please resolve any issues and try again."
  exit 2
fi

# Run npm build
if ! npm run build; then
  echo "Error: npm run build failed."
  exit 3
fi

# Restart the service as root
if ! sudo systemctl restart search-brck-ca; then
  echo "Error: Failed to restart search-brck-ca service."
  exit 4
fi

echo "Update and restart completed successfully."
