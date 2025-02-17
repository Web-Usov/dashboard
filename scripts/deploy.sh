#!/bin/bash

# Load environment variables from .env file
set -a
source .env
set +a

# Check if source directory exists
if [ ! -d "dist" ]; then
  echo "Error: dist directory not found!"
  exit 1
fi

# Sync all files from dist directory to remote server
rsync -avz --delete ./dist/ $SSH_DEPLOY/

echo "Deployment completed successfully!"
