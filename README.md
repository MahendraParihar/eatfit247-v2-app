# EatFit247 v2 - CMS Application

A full-stack content management system built with Angular Material frontend and NestJS backend for managing EatFit247's digital content and operations.

## 🏗️ Project Structure

```
eatfit247-v2-app/
├── eatfit247-cms/          # Angular Material frontend
├── eatfit247-cms-api/      # NestJS backend API
├── infra/                  # Docker configuration and deployment
└── README.md              # This file
```

## 🔧 Environment Setup (Required First!)

### 1. Copy Environment Templates
```bash
cp eatfit247-cms-api/.env.example eatfit247-cms-api/.env
cp infra/main.env.example infra/main.env
```

### 2. Configure Environment Variables
Update `infra/main.env` with your settings:
- Database credentials (DB_USERNAME, DB_PASSWORD, DB_NAME, DB_SERVER)
- JWT secret key (JWTKEY)
- Mail server configuration
- Application paths

See [ENVIRONMENT_SETUP.md](ENVIRONMENT_SETUP.md) for detailed configuration guide.

## 🚀 Quick Start with Docker

### Prerequisites
- Docker Desktop running (macOS/Windows) or Docker Engine (Linux)
- Docker Compose v2.x+
- Node.js 22+ (for local development only)

### Option 1: Using Docker Compose (Recommended)

```bash
# Navigate to infra directory
cd infra

# Build and start all services
docker compose up -d

# Verify services are running
docker ps

# Check health
curl http://localhost:8001/api/v1/health

# Stop all services
docker compose down
```

**Note for macOS users**: If `docker compose` doesn't work, use the full path:
```bash
/Applications/Docker.app/Contents/Resources/cli-plugins/docker-compose up -d
```

### Option 2: Manual Build (From Project Root)

```bash
# Build server image
docker build -f ./infra/Dockerfile.server -t eatfit247-cms-server:latest .

# Build client image
docker build -f ./infra/Dockerfile.client -t eatfit247-cms-client:latest .

# Start services
cd infra && docker compose up -d
```

### Access Points
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8001  
- **API via Proxy**: http://localhost:80/api/v1
- **Health Check**: http://localhost:8001/api/v1/health

### Verify Deployment
```bash
# Check container status
docker ps

# View logs
docker logs eatfit247-cms-api
docker logs eatfit247-cms-client

# Test health endpoint
curl http://localhost:8001/api/v1/health
# Expected: {"status":"ok","timestamp":"..."}
```

## 💻 Local Development

### Frontend (Angular)
```bash
cd eatfit247-cms
npm install --legacy-peer-deps
npm start
# Runs on http://localhost:4200
```

### Backend (NestJS)
```bash
cd eatfit247-cms-api
npm install --legacy-peer-deps
npm run start:dev
# Runs on http://localhost:3000
```

## 📁 Media Files Management

Media files are stored in persistent Docker volumes at `/home/app/assets/media-files/` with the following structure:

```
media-files/
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

### Media Files Backup
```bash
# Check media files status
./infra/backup-media.sh check

# Create backup
./infra/backup-media.sh backup

# Restore from backup
./infra/backup-media.sh restore ./infra/media-backups/media-backup-TIMESTAMP.tar.gz
```

## 🛠️ Development Commands

### Angular CLI Commands
```bash
# Generate component
ng g c PATH/COMPONENT_NAME --module=MODULE_NAME --skipTests=true

# Generate module
ng g m PATH/MODULE_NAME --skipTests=true --routing

# Build for production
ng build --configuration production
```

### NestJS CLI Commands
```bash
# Generate module
nest g module [PATH]/[MODULE_NAME]

# Generate controller
nest g controller [PATH]/[CONTROLLER_NAME]

# Generate service
nest g service [PATH]/[SERVICE_NAME]
```

## 🧪 Testing

### Backend Tests
```bash
cd eatfit247-cms-api

# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Tests
```bash
cd eatfit247-cms

# Unit tests
ng test

# E2E tests
ng e2e
```

## 🐳 Docker Management

### Container Operations
```bash
# View running containers
docker ps

# View container logs
docker logs eatfit247-cms-api
docker logs eatfit247-cms-client

# Access container shell (Alpine uses sh, not bash)
docker exec -it eatfit247-cms-api sh
docker exec -it eatfit247-cms-client sh

# Restart containers (from project root)
docker compose -f ./infra/docker-compose.yml restart

# Or from infra directory
cd infra && docker compose restart
```

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect infra_media_files

# Clean up unused volumes
docker volume prune
```

### Image Management
```bash
# List images
docker images

# Remove unused images
docker image prune

# Remove all containers and volumes
docker rm -vf $(docker ps -aq)
```

## 🔒 Security Features

### Environment Protection
- Environment files (`.env`, `main.env`) are not tracked in git
- Example files provided for setup
- Comprehensive security documentation

### Data Persistence
- Media files stored in persistent Docker volumes
- Automatic directory initialization
- Backup and restore capabilities
- Files survive container restarts and rebuilds

## 📚 API Documentation

### Health Endpoints
- `GET /api/v1/health` - Application health status

### Media Endpoints
- `GET /media-files/*` - Serve static media files
- `POST /api/v1/common/media/upload-media` - Upload media files

### Authentication
- JWT-based authentication
- Configurable token expiration
- Secure secret management

## 🚨 Troubleshooting

### Common Issues

#### Container Won't Start
```bash
# Check logs
docker logs eatfit247-cms-api

# Check environment variables
docker exec eatfit247-cms-api env | grep -E "(DB_|JWT)"
```

#### Media Files Not Accessible
```bash
# Check volume mounting
docker exec eatfit247-cms-api ls -la /home/app/assets/media-files/

# Run initialization script
docker exec eatfit247-cms-api /home/app/init-media-dirs.sh
```

#### Database Connection Issues
- Verify database credentials in environment files
- Ensure database server is running
- Check network connectivity

### Health Checks
```bash
# API health
curl http://localhost:8001/api/v1/health

# Frontend access
curl -I http://localhost:80/

# Media files access
curl http://localhost:80/media-files/admin/
```

## 📖 Documentation

- [Environment Setup Guide](ENVIRONMENT_SETUP.md) - Detailed environment configuration
- [Media Persistence Documentation](infra/MEDIA_PERSISTENCE.md) - Media files management
- [Backup Script Documentation](infra/backup-media.sh) - Backup and restore procedures

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Author**: [EatFit247](https://eatfit247.com)
- **Website**: [https://eatfit247.com](https://eatfit247.com)

## 🔗 Useful Links

- [Angular Documentation](https://angular.io/docs)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Docker Documentation](https://docs.docker.com/)
- [Angular Material](https://material.angular.io/)

---

**Note**: This is a full-stack application with persistent media storage, comprehensive security measures, and production-ready Docker configuration. For detailed setup instructions, please refer to the documentation files in the project root.