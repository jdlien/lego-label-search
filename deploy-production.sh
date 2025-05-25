#!/bin/bash

# Production deployment script for LEGO Label Search
# This script deploys the application without using a custom server

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Deploying LEGO Label Search to production...${NC}"

# Check if we are in the correct directory
if [ ! -f "package.json" ]; then
  echo -e "${RED}Error: package.json not found. Please run this script from the project root.${NC}"
  exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci --production=false

# Build the application (skip linting to avoid memory issues)
echo -e "${YELLOW}Building application (skipping lint)...${NC}"
npm run build -- --no-lint

# Stop existing PM2 process
echo -e "${YELLOW}Stopping existing PM2 process...${NC}"
pm2 stop search-brck-ca || true

# Install/update cron service (optional - only if you want the separate cron service)
if [ "$1" = "--with-cron-service" ]; then
  echo -e "${YELLOW}Installing systemd cron service...${NC}"
  sudo cp scripts/search.brck-ca-cron.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable search.brck-ca-cron.service
  sudo systemctl restart search.brck-ca-cron.service
fi

# Start/reload the application with PM2
echo -e "${YELLOW}Starting application with PM2...${NC}"
pm2 reload search-brck-ca || pm2 start npm --name "search-brck-ca" -- run start:next

# Update nginx configuration if needed
if [ -f "nginx-production.conf" ]; then
  echo -e "${YELLOW}Updating Nginx configuration...${NC}"
  sudo cp nginx-production.conf /etc/nginx/sites-available/search.brck.ca
  sudo nginx -t && sudo systemctl reload nginx
fi

# Wait a moment for PM2 to start
sleep 3

# Check PM2 status
echo -e "${YELLOW}Checking PM2 status...${NC}"
pm2 list
pm2 info search-brck-ca

# Save PM2 configuration
pm2 save

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${YELLOW}You can check logs and manage the app with:${NC}"
echo -e "  pm2 logs search-brck-ca        # View application logs"
echo -e "  pm2 monit                      # Monitor CPU/Memory usage"
echo -e "  pm2 reload search-brck-ca      # Zero-downtime reload"
echo -e "  pm2 restart search-brck-ca     # Restart the application"
echo -e ""
if [ "$1" = "--with-cron-service" ]; then
  echo -e "${YELLOW}Cron service logs:${NC}"
  echo -e "  sudo journalctl -u search.brck-ca-cron.service -f"
fi