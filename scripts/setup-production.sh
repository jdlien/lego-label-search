#!/bin/bash

# Production setup script for LEGO Label Search
# This script helps configure the environment for production use

# Exit on error
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up production environment for LEGO Label Search...${NC}"

# Check if we are running as root/sudo
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}Warning: This script should typically be run with sudo privileges${NC}"
  echo -e "Continue anyway? (y/n)"
  read -r answer
  if [ "$answer" != "y" ]; then
    echo "Exiting..."
    exit 1
  fi
fi

# Create .env file if it doesn't exist
if [ ! -f "$PROJECT_ROOT/.env" ]; then
  echo -e "${YELLOW}Creating .env file...${NC}"

  # Ask for lbx-utils path
  echo -e "Enter the absolute path to lbx-utils directory (default: /opt/lbx-utils):"
  read -r LBX_PATH
  LBX_PATH=${LBX_PATH:-/opt/lbx-utils}

  # Create .env file
  cat > "$PROJECT_ROOT/.env" << EOF
# Production environment settings
NODE_ENV=production

# LBX-Utils Path Configuration
LBX_UTILS_PATH=$LBX_PATH
EOF

  echo -e "${GREEN}.env file created successfully!${NC}"
else
  echo -e "${YELLOW}.env file already exists. Skipping creation.${NC}"
fi

# Create directories for static files
echo -e "${YELLOW}Creating directories for static files...${NC}"
mkdir -p "$PROJECT_ROOT/public/data/images"
mkdir -p "$PROJECT_ROOT/public/data/labels"

# Set permissions
echo -e "${YELLOW}Setting permissions...${NC}"
chown -R www-data:www-data "$PROJECT_ROOT/public/data"
chmod -R 775 "$PROJECT_ROOT/public/data"

echo -e "${GREEN}Production setup complete!${NC}"
echo -e "${YELLOW}IMPORTANT: Don't forget to:${NC}"
echo -e "1. Install lbx-utils on your server (if not already installed)"
echo -e "2. Update your Nginx configuration to serve files from /data/ path"
echo -e "3. Restart Nginx after configuration changes"
echo ""

# NGINX config tip
echo -e "${YELLOW}Add this to your Nginx server block:${NC}"
echo -e "    # Handle static files in data directory"
echo -e "    location /data/ {"
echo -e "        alias $PROJECT_ROOT/public/data/;"
echo -e "        expires 30d;"
echo -e "        access_log off;"
echo -e "    }"
echo -e "${GREEN}Setup complete!${NC}"