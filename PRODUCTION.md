<!-- @format -->

# LEGO Label Search - Production Deployment Guide

This guide covers the steps needed to deploy the LEGO Label Search application to a production environment.

## Prerequisites

- Node.js 16+ and npm
- Python 3.7+ for label conversion
- Nginx web server
- Git

## Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/lego-label-search.git
cd lego-label-search
```

2. **Install dependencies**

```bash
npm install
```

3. **Install lbx-utils**

The application requires lbx-utils for label conversion. Install it in a location of your choice:

```bash
# Example: Installing in /opt
sudo mkdir -p /opt
cd /opt
git clone https://github.com/jdlien/lbx-utils.git
cd lbx-utils
# Install any Python dependencies if needed
pip install -r requirements.txt  # if available
```

4. **Run the production setup script**

This script will create the necessary directories and set correct permissions:

```bash
sudo bash scripts/setup-production.sh
```

Follow the prompts to configure your environment.

5. **Build the application**

```bash
npm run build
```

6. **Configure Nginx**

Update your Nginx configuration to include:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Next.js application - Reverse proxy configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files handling for Next.js
    location /_next/static/ {
        proxy_pass http://localhost:3000/_next/static/;
        proxy_cache_valid 60m;
        proxy_set_header Host $host;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # Next.js image optimization
    location /_next/image {
        proxy_pass http://localhost:3000/_next/image;
        proxy_cache_valid 60m;
        proxy_set_header Host $host;
        access_log off;
    }

    # Handle static files in data directory
    location /data/ {
        alias /path/to/lego-label-search/public/data/;
        expires 30d;
        access_log off;
    }

    # Handle static files in public directory
    location /public/ {
        alias /path/to/lego-label-search/public/;
        expires 30d;
        access_log off;
    }
}
```

Replace `/path/to/lego-label-search` with your actual installation path.

7. **Start the application**

For a production deployment, it's recommended to use a process manager like PM2:

```bash
# Install PM2 if you haven't already
npm install -g pm2

# Start the application
pm2 start npm --name "lego-label-search" -- start

# Set up PM2 to start on boot
pm2 startup
pm2 save
```

## Troubleshooting

### Label Conversion Issues

If you encounter problems with label conversion:

1. Verify the LBX_UTILS_PATH in your .env file
2. Check if Python 3 is installed and available
3. Ensure the lbx-utils repository is properly cloned
4. Verify permissions on the label directories

### 404 Errors for Images or Labels

If you get 404 errors when accessing images or labels:

1. Make sure the directories exist and have proper permissions
2. Check the Nginx configuration for the /data/ path
3. Restart Nginx after configuration changes: `sudo systemctl restart nginx`

## Maintenance

### Updating the Application

```bash
cd /path/to/lego-label-search
git pull
npm install
npm run build
pm2 restart lego-label-search
```
