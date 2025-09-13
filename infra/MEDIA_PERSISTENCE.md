# Media Files Persistence Documentation

## Overview
This document explains how media files are preserved across all Docker operations including build, up, down, and crash scenarios.

## Architecture

### Volume Configuration
- **Volume Name**: `infra_media_files`
- **Mount Point**: `/home/app/assets/media-files`
- **Driver**: `local`
- **Persistence**: Files survive all Docker operations

### Directory Structure
```
/home/app/assets/media-files/
├── admin/          # Admin user files
├── blog/           # Blog images and files
├── diet-Plans/     # Diet plan documents
├── downloads/      # Download files
├── franchise/      # Franchise related files
├── invoice/        # Invoice documents
├── lovs/           # List of values files
├── member/         # Member files and documents
├── pocket-guide/   # Pocket guide documents
├── program/        # Program related files
├── recipe/         # Recipe images and files
├── recipes/        # Recipe documents
├── referrer/       # Referrer files
└── uploads/        # General upload files
```

## Persistence Mechanisms

### 1. Docker Volume
- **Type**: Named volume with local driver
- **Location**: `/var/lib/docker/volumes/infra_media_files/_data`
- **Persistence**: Survives container removal, rebuilds, and system restarts

### 2. Initialization Script
- **File**: `/home/app/init-media-dirs.sh`
- **Purpose**: Creates directory structure on container startup
- **Execution**: Runs automatically before NestJS starts
- **Safety**: Ensures directories exist even if volume is empty

### 3. Backup System
- **Script**: `./backup-media.sh`
- **Purpose**: Create and restore backups of media files
- **Location**: `./media-backups/`
- **Format**: Compressed tar archives with timestamps

## Tested Scenarios

### ✅ Docker Operations
1. **docker compose down** - Files preserved
2. **docker build** - Files preserved
3. **docker compose up** - Files preserved
4. **Container restart** - Files preserved
5. **Force kill container** - Files preserved
6. **System reboot** - Files preserved

### ✅ File Operations
1. **File creation** - Works correctly
2. **File access via API** - Works correctly
3. **File access via proxy** - Works correctly
4. **Directory creation** - Works correctly
5. **Permission setting** - Works correctly

## Usage Examples

### Check Volume Status
```bash
./backup-media.sh check
```

### Create Backup
```bash
./backup-media.sh backup
```

### List Backups
```bash
./backup-media.sh list
```

### Restore from Backup
```bash
./backup-media.sh restore ./media-backups/media-backup-20250913_154448.tar.gz
```

### Manual File Access
```bash
# Create file
docker exec eatfit247-cms-api sh -c "echo 'test' > /home/app/assets/media-files/admin/test.txt"

# Access via API
curl http://localhost:80/media-files/admin/test.txt

# Access directly
curl http://localhost:8001/media-files/admin/test.txt
```

## Configuration Files

### Docker Compose
```yaml
volumes:
  media_files:
    driver: local
    external: false
```

### Dockerfile
```dockerfile
# Copy initialization script
COPY ./infra/init-media-dirs.sh /home/app/init-media-dirs.sh
RUN chmod +x /home/app/init-media-dirs.sh

# Run initialization script before starting NestJS
CMD ["sh", "-c", "/home/app/init-media-dirs.sh && node eatfit247-cms-api/dist/main.js"]
```

### NestJS Configuration
```typescript
ServeStaticModule.forRoot({
  rootPath: join('/home/app/assets/media-files'),
  serveRoot: '/media-files',
})
```

## Safety Features

### 1. Automatic Directory Creation
- Directories are created automatically on container startup
- No manual intervention required
- Works even with empty volumes

### 2. Backup System
- Regular backups can be created
- Easy restoration process
- Timestamped backups for version control

### 3. Volume Inspection
- Easy status checking
- File count monitoring
- Directory structure verification

### 4. Error Handling
- Graceful handling of missing directories
- Proper permission setting
- Logging of initialization process

## Troubleshooting

### Volume Not Found
```bash
docker volume ls
docker volume inspect infra_media_files
```

### Container Not Running
```bash
docker ps
docker compose up -d
```

### Files Not Accessible
```bash
# Check if files exist
docker exec eatfit247-cms-api ls -la /home/app/assets/media-files/

# Check API access
curl http://localhost:80/api/v1/health
curl http://localhost:80/media-files/admin/
```

### Directory Structure Missing
```bash
# Run initialization script manually
docker exec eatfit247-cms-api /home/app/init-media-dirs.sh
```

## Best Practices

### 1. Regular Backups
- Create backups before major deployments
- Store backups in version control or external storage
- Test restore procedures regularly

### 2. Monitoring
- Check volume status regularly
- Monitor file counts and sizes
- Set up alerts for volume issues

### 3. Development Workflow
- Always use `docker compose down` instead of `docker system prune`
- Test file persistence after code changes
- Verify backup/restore procedures

### 4. Production Deployment
- Create backup before deployment
- Verify volume mounting in production
- Monitor disk space for volumes
- Set up automated backups

## File Limits and Considerations

### Volume Size
- No hard limit on volume size
- Limited by available disk space
- Monitor disk usage regularly

### File Permissions
- Files created with 755 permissions
- Proper ownership maintained
- Security considerations for uploaded files

### Performance
- Local volume driver provides good performance
- Consider SSD storage for better I/O
- Monitor I/O performance under load

## Conclusion

The media files persistence system is designed to be robust and reliable. Files are preserved across all Docker operations, and multiple safety mechanisms ensure data integrity. Regular backups provide additional protection against data loss.
