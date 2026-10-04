#!/bin/sh

# Initialize media directories if they don't exist
MEDIA_PATH="/home/app/assets/media-files"
# Private files (pocket-guide PDFs): never served, kept outside MEDIA_PATH
PRIVATE_PATH="${PRIVATE_ASSET_PATH:-/home/app/assets/private-files}"

echo "Initializing media directories at $MEDIA_PATH"

# Create base directory if it doesn't exist
mkdir -p "$MEDIA_PATH"

# Create all required subdirectories
mkdir -p "$MEDIA_PATH/admin"
mkdir -p "$MEDIA_PATH/lovs"
mkdir -p "$MEDIA_PATH/uploads"
mkdir -p "$MEDIA_PATH/downloads"
mkdir -p "$MEDIA_PATH/diet-Plans"
mkdir -p "$MEDIA_PATH/invoice"
mkdir -p "$MEDIA_PATH/recipes"
mkdir -p "$MEDIA_PATH/blog"
mkdir -p "$MEDIA_PATH/franchise"
mkdir -p "$MEDIA_PATH/member"
mkdir -p "$MEDIA_PATH/pocket-guide"
mkdir -p "$MEDIA_PATH/program"
mkdir -p "$MEDIA_PATH/recipe"
mkdir -p "$MEDIA_PATH/referrer"

# Create private directories
mkdir -p "$PRIVATE_PATH/pocket-guide"

# Set proper permissions
chmod -R 755 "$MEDIA_PATH"
chmod -R 750 "$PRIVATE_PATH"

echo "Media directories initialized successfully"
ls -la "$MEDIA_PATH"
ls -la "$PRIVATE_PATH"
