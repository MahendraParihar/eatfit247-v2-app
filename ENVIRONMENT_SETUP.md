# Environment Setup Guide

## Overview
This document explains how to set up environment variables for the EatFit247 v2 application.

## Environment Files

### 1. Backend Environment File
**File**: `eatfit247-cms-api/.env`
**Purpose**: Configuration for the NestJS backend application

### 2. Docker Environment File  
**File**: `infra/main.env`
**Purpose**: Environment variables for Docker containers

## Setup Instructions

### Step 1: Copy Example Files
```bash
# Copy backend environment template
cp eatfit247-cms-api/.env.example eatfit247-cms-api/.env

# Copy Docker environment template
cp infra/main.env.example infra/main.env
```

### Step 2: Configure Database Settings
Update the following variables in both files:
```env
DB_USERNAME='your_actual_db_username'
DB_PASSWORD='your_actual_db_password'
DB_NAME='your_actual_database_name'
DB_SERVER='your_db_server_host'
DB_PORT='5432'
DB_SCHEMA='public'
```

### Step 3: Configure JWT Secret
**IMPORTANT**: Generate a strong, random JWT secret:
```env
JWTKEY='your_strong_random_jwt_secret_here'
```

You can generate a secure JWT secret using:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

### Step 4: Configure Asset Path
Ensure the asset path is correct:
```env
ASSET_PATH=/home/app/assets/media-files
```

### Step 5: Configure Token Expiration
Set appropriate token expiration times:
```env
ACCESS_TOKEN_TIME='5m'
REFRESH_TOKEN_TIME='7d'
TOKEN_EXPIRATION='5m'
```

## Security Notes

### ✅ What's Protected
- Environment files are in `.gitignore`
- Sensitive data is not committed to git
- Example files contain no real credentials

### 🔒 Security Best Practices
1. **Never commit** `.env` or `main.env` files
2. **Use strong passwords** for database and JWT secrets
3. **Rotate secrets** regularly in production
4. **Limit database access** to necessary permissions only
5. **Use environment-specific** configurations

## File Locations

```
eatfit247-v2-app/
├── eatfit247-cms-api/
│   ├── .env                    # ❌ NOT in git (local only)
│   └── .env.example           # ✅ In git (template)
├── infra/
│   ├── main.env               # ❌ NOT in git (local only)
│   └── main.env.example       # ✅ In git (template)
└── .gitignore                 # ✅ Contains env file patterns
```

## Docker Integration

### Environment File Usage
The `infra/main.env` file is automatically loaded by Docker Compose:
```yaml
services:
  eatfit247-api:
    env_file:
      - main.env
```

### Volume Mounting
Media files are persisted using Docker volumes:
```yaml
volumes:
  - media_files:/home/app/assets/media-files
```

## Troubleshooting

### Environment Variables Not Loading
1. Check file exists: `ls -la eatfit247-cms-api/.env infra/main.env`
2. Check file permissions: `chmod 644 eatfit247-cms-api/.env infra/main.env`
3. Verify Docker Compose is using correct env file

### Database Connection Issues
1. Verify database credentials
2. Check database server is running
3. Ensure network connectivity
4. Verify database exists

### JWT Authentication Issues
1. Check JWT secret is set correctly
2. Verify token expiration times
3. Ensure secret is consistent across restarts

## Production Deployment

### Environment Variables
- Set environment variables in your deployment platform
- Use secure secret management (e.g., Kubernetes secrets, AWS Secrets Manager)
- Never hardcode secrets in deployment scripts

### Database Security
- Use connection pooling
- Enable SSL/TLS for database connections
- Implement proper backup and recovery procedures
- Monitor database performance and security

### Application Security
- Use HTTPS in production
- Implement rate limiting
- Set up proper logging and monitoring
- Regular security audits and updates
