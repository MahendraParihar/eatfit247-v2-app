# EatFit247 v2 - CMS Application

A full-stack application with Angular Material frontend and NestJS backend for managing EatFit247 content management system.

## Project Structure

- **eatfit247-cms**: Angular Material frontend application
- **eatfit247-cms-api**: NestJS backend API
- **infra**: Docker configuration and deployment files

## Prerequisites

- Docker and Docker Compose
- Node.js 22+ (for local development)

## Quick Start with Docker

All Docker commands should be executed from the root of the project.

### Build Images

Build the server (NestJS API) image:
```shell
docker build . -f ./infra/Dockerfile.server -t eatfit247-cms-server
```

Build the client (Angular) image:
```shell
docker build . -f ./infra/Dockerfile.client -t eatfit247-cms-client
```

### Run the Application

Start all services:
```shell
docker compose -f ./infra/docker-compose.yml up -d
```

Stop all services:
```shell
docker compose -f ./infra/docker-compose.yml down
```

### Access the Application

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8001
- **Health Check**: http://localhost:8001/api/v1/health

## Environment Configuration

Ensure you have a `main.env` file in the `infra` folder with the following variables:

```env
DB_USERNAME='postgres'
DB_PASSWORD='postgres'
DB_NAME='DB_NAME'
DB_SERVER='localhost'
DB_PORT='5432'
DB_SCHEMA='public'
ASSET_PATH=/home/app/assets/media-files
ACCESS_TOKEN_TIME='5m'
REFRESH_TOKEN_TIME='7d'
TOKEN_EXPIRATION='5m'
JWTKEY='SOME_RANDOM_SECRET'
```

## Docker Management Commands

### List containers
```shell
docker ps -a
```

### View container logs
```shell
docker logs [CONTAINER_NAME]
```

### Access container shell
```shell
docker exec -it [CONTAINER_NAME] bash
```

### List Docker images
```shell
docker images
```

### Clean up Docker resources
```shell
# Delete unused images
docker image prune

# Delete all containers and volumes
docker rm -vf $(docker ps -aq)
```

## Development

For local development, you can run the services individually:

### Frontend (Angular)
```shell
cd eatfit247-cms
npm install --legacy-peer-deps
npm start
```

### Backend (NestJS)
```shell
cd eatfit247-cms-api
npm install --legacy-peer-deps
npm run start:dev
```

## Health Checks

The application includes health check endpoints:
- API Health: `GET /api/v1/health`
- Returns: `{"status":"ok","timestamp":"2025-09-13T08:14:43.305Z"}`

## Troubleshooting

1. **Container fails to start**: Check logs with `docker logs [CONTAINER_NAME]`
2. **Health check failures**: Ensure all environment variables are properly set
3. **Build failures**: Verify Node.js dependencies and build scripts
4. **Network issues**: Check Docker network connectivity between services