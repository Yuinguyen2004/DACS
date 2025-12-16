# Docker Setup Guide for Backend

This guide explains how to run the NestJS backend using Docker and Docker Compose.

## Prerequisites

- Docker installed ([download](https://www.docker.com/products/docker-desktop))
- Docker Compose installed (usually bundled with Docker Desktop)
- Git

## Quick Start

### Option 1: Using Docker Compose (Recommended)

Docker Compose handles both the backend and MongoDB database automatically.

```bash
# From project root directory
docker-compose up --build
```

This will:
- Build the backend Docker image
- Start MongoDB with proper initialization
- Start the backend on port 3000
- Mount `Backend/src/` for live reload in development mode

Access the API at: `http://localhost:3000`

### Option 2: Build and Run Manually

```bash
# Navigate to Backend directory
cd Backend

# Build the Docker image
docker build -t dacs-backend:latest .

# Run container (with MongoDB running separately)
docker run -p 3000:3000 \
  -e MONGODB_URI=mongodb://localhost:27017/dacs \
  -e NODE_ENV=production \
  dacs-backend:latest
```

## Configuration

### Environment Variables

Edit the `docker-compose.yml` to add your environment variables:

```yaml
environment:
  NODE_ENV: development
  PORT: 3000
  MONGODB_URI: mongodb://admin:password@mongodb:27017/dacs?authSource=admin
  FIREBASE_PROJECT_ID: your_project_id
  FIREBASE_PRIVATE_KEY: your_private_key
  FIREBASE_CLIENT_EMAIL: your_client_email
  GOOGLE_GEMINI_API_KEY: your_gemini_key
  SENDGRID_API_KEY: your_sendgrid_key
  VNPAY_TERMINAL_ID: your_vnpay_id
  PAYPAL_CLIENT_ID: your_paypal_id
  # ... other variables
```

Or create a `.env` file and reference it:

```yaml
env_file:
  - .env
```

## Common Commands

```bash
# Start services in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Remove volumes (clean database)
docker-compose down -v

# Run a command in the container
docker-compose exec backend npm run seed

# Shell access to backend
docker-compose exec backend sh

# Check container status
docker-compose ps
```

## Development Workflow

### With Hot Reload (Recommended)

The `docker-compose.yml` is configured for development with:
- Hot reload enabled (mounts `Backend/src/`)
- Running `npm run start:dev`
- All logs visible

```bash
docker-compose up
```

### Production Build

```bash
# Build optimized image
docker build -t dacs-backend:prod --target builder Backend/

# Run with environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e MONGODB_URI=mongodb://your-production-db \
  dacs-backend:prod
```

## Database Access

### MongoDB from Docker

```bash
# Connect to MongoDB container
docker-compose exec mongodb mongosh -u admin -p password

# Or from host machine (if exposed)
mongosh "mongodb://admin:password@localhost:27017/dacs?authSource=admin"
```

### Seed Database

```bash
docker-compose exec backend npm run seed
docker-compose exec backend npm run seed:simple
docker-compose exec backend npm run seed:clean
```

## Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Or use different ports in docker-compose.yml
ports:
  - "3001:3000"  # Map 3001 on host to 3000 in container
```

### MongoDB Connection Refused

```bash
# Check MongoDB is healthy
docker-compose ps

# View MongoDB logs
docker-compose logs mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Permission Denied Errors

```bash
# Ensure proper permissions
docker-compose down
docker-compose up --build

# Or run with sudo (not recommended)
sudo docker-compose up
```

### Hot Reload Not Working

- Ensure `Backend/src/` is mounted in `docker-compose.yml`
- Restart container: `docker-compose restart backend`
- Check file system events are supported: `npm run start:dev` in container logs should show "watching for file changes"

## Deployment to Cloud

### Docker Hub

```bash
# Build image
docker build -t your-username/dacs-backend:latest Backend/

# Push to Docker Hub
docker login
docker push your-username/dacs-backend:latest
```

### AWS/Google Cloud

See `README.md` deployment section for cloud-specific instructions.

## Performance Tips

1. **Use .dockerignore** - Already configured to exclude unnecessary files
2. **Multi-stage builds** - Dockerfile uses builder stage for smaller production images
3. **Alpine Linux** - Using lightweight `node:18-alpine` base
4. **Non-root user** - Container runs as `nodejs` user for security
5. **Health checks** - MongoDB has health check configured

## Security

- Container runs as non-root user `nodejs`
- MongoDB requires authentication (admin:password)
- Use strong passwords in production
- Keep Docker and base images updated
- Never commit `.env` files with real credentials
- Use secrets management in production (AWS Secrets Manager, etc.)

## Further Reading

- [Docker Documentation](https://docs.docker.com/)
- [NestJS Docker Deployment](https://docs.nestjs.com/deployment)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
