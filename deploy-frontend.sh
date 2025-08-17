#!/bin/bash

# Frontend Production Deployment Script
# This script builds the frontend and sets up static file serving

set -e  # Exit on any error

echo "🚀 Starting Frontend Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_DIR="genone-frontend"
BUILD_DIR="$FRONTEND_DIR/dist"
NGINX_ROOT="/var/www/html"
BACKUP_DIR="/var/www/html.backup.$(date +%Y%m%d_%H%M%S)"

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if frontend directory exists
if [ ! -d "$FRONTEND_DIR" ]; then
    print_error "Frontend directory '$FRONTEND_DIR' not found!"
    exit 1
fi

# Navigate to frontend directory
cd "$FRONTEND_DIR"

print_status "Installing dependencies..."
npm install

print_status "Building frontend for production..."
npm run build:prod

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Build failed! dist directory not found."
    exit 1
fi

print_status "Build completed successfully!"

# Go back to root directory
cd ..

# Backup existing files if they exist
if [ -d "$NGINX_ROOT" ] && [ "$(ls -A $NGINX_ROOT)" ]; then
    print_warning "Backing up existing files to $BACKUP_DIR"
    sudo mv "$NGINX_ROOT" "$BACKUP_DIR"
fi

# Create nginx root directory
sudo mkdir -p "$NGINX_ROOT"

# Copy built files to nginx root
print_status "Copying built files to $NGINX_ROOT..."
sudo cp -r "$BUILD_DIR"/* "$NGINX_ROOT/"

# Set proper permissions
sudo chown -R www-data:www-data "$NGINX_ROOT"
sudo chmod -R 755 "$NGINX_ROOT"

print_status "Frontend deployment completed!"
print_status "Static files are now served from $NGINX_ROOT"

echo ""
echo "📋 Next Steps:"
echo "1. Configure your load balancer to serve static files from $NGINX_ROOT"
echo "2. Update your DNS/load balancer to point to the static file server"
echo "3. Test the application at your production URL"
echo ""
echo "🔧 Alternative: Use the built-in serve command for testing:"
echo "   cd $FRONTEND_DIR && npm run serve"
