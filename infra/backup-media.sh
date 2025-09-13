#!/bin/bash

# Backup and Restore Script for Media Files
# This script provides additional safety for media files

set -e

BACKUP_DIR="./media-backups"
VOLUME_NAME="infra_media_files"
CONTAINER_NAME="eatfit247-cms-api"
MEDIA_PATH="/home/app/assets/media-files"

# Function to create backup
backup_media() {
    echo "Creating backup of media files..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create timestamped backup
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/media-backup-$TIMESTAMP.tar.gz"
    
    # Create backup from volume
    docker run --rm -v "$VOLUME_NAME":/source -v "$(pwd)/$BACKUP_DIR":/backup alpine tar czf /backup/media-backup-$TIMESTAMP.tar.gz -C /source .
    
    echo "Backup created: $BACKUP_FILE"
    ls -lh "$BACKUP_FILE"
}

# Function to restore from backup
restore_media() {
    if [ -z "$1" ]; then
        echo "Usage: $0 restore <backup-file>"
        echo "Available backups:"
        ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "Backup file not found: $BACKUP_FILE"
        exit 1
    fi
    
    echo "Restoring media files from: $BACKUP_FILE"
    echo "WARNING: This will overwrite existing media files!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Restore backup to volume
        docker run --rm -v "$VOLUME_NAME":/target -v "$(pwd)":/backup alpine sh -c "cd /target && tar xzf /backup/$(basename $BACKUP_FILE)"
        echo "Media files restored successfully!"
    else
        echo "Restore cancelled."
    fi
}

# Function to list backups
list_backups() {
    echo "Available backups:"
    ls -la "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "No backups found"
}

# Function to check volume status
check_volume() {
    echo "Checking volume status..."
    
    if docker volume inspect "$VOLUME_NAME" >/dev/null 2>&1; then
        echo "✅ Volume '$VOLUME_NAME' exists"
        
        # Check if container is running
        if docker ps | grep -q "$CONTAINER_NAME"; then
            echo "✅ Container '$CONTAINER_NAME' is running"
            
            # Check media directory
            if docker exec "$CONTAINER_NAME" test -d "$MEDIA_PATH"; then
                echo "✅ Media directory exists: $MEDIA_PATH"
                
                # Count files
                FILE_COUNT=$(docker exec "$CONTAINER_NAME" find "$MEDIA_PATH" -type f | wc -l)
                echo "📁 Total files in media directory: $FILE_COUNT"
                
                # Show directory structure
                echo "📂 Directory structure:"
                docker exec "$CONTAINER_NAME" find "$MEDIA_PATH" -type d | sort
            else
                echo "❌ Media directory not found: $MEDIA_PATH"
            fi
        else
            echo "⚠️  Container '$CONTAINER_NAME' is not running"
        fi
    else
        echo "❌ Volume '$VOLUME_NAME' does not exist"
    fi
}

# Main script logic
case "$1" in
    "backup")
        backup_media
        ;;
    "restore")
        restore_media "$2"
        ;;
    "list")
        list_backups
        ;;
    "check")
        check_volume
        ;;
    *)
        echo "Media Files Backup/Restore Script"
        echo "Usage: $0 {backup|restore|list|check}"
        echo ""
        echo "Commands:"
        echo "  backup           - Create a timestamped backup of media files"
        echo "  restore <file>   - Restore media files from backup"
        echo "  list             - List available backups"
        echo "  check            - Check volume and container status"
        echo ""
        echo "Examples:"
        echo "  $0 backup"
        echo "  $0 restore ./media-backups/media-backup-20250913_120000.tar.gz"
        echo "  $0 list"
        echo "  $0 check"
        ;;
esac
