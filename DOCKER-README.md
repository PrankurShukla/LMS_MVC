# Docker Setup for LMS Application

This document provides comprehensive instructions for deploying the Learning Management System (LMS) application using Docker.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Detailed Setup](#detailed-setup)
- [Accessing the Application](#accessing-the-application)
- [Using Prisma Studio](#using-prisma-studio)
- [Environment Variables](#environment-variables)
- [Common Operations](#common-operations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or higher)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or higher)

## Project Structure

The dockerized application consists of three main components:

1. **Frontend**: Next.js application
   - Container name: `lms_mvp-frontend-1`
   - Port: 3000
   - Built from: `./frontend/Dockerfile`

2. **Backend**: Node.js/Express API with Prisma
   - Container name: `lms_mvp-backend-1`
   - Ports: 5000 (API), 5555 (Prisma Studio)
   - Built from: `./backend/Dockerfile`

3. **Database**: PostgreSQL
   - Container name: `lms_mvp-db-1`
   - Port: 5432
   - Uses official postgres:15-alpine image
   - Data persisted in `postgres-data` volume

## Quick Start

### Windows
```powershell
# Navigate to project root directory
cd C:\path\to\LMS_MVP

# Run the application
.\docker-run.ps1
```

### Linux/Mac
```bash
# Navigate to project root directory
cd /path/to/LMS_MVP

# Make the script executable
chmod +x docker-run.sh

# Run the application
./docker-run.sh
```

## Detailed Setup

If you prefer to run commands manually:

1. **Build the containers**:
   ```bash
   docker-compose build
   ```

2. **Start the application**:
   ```bash
   docker-compose up -d
   ```

3. **Initialize the database** (first run only):
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npx prisma db seed
   ```

4. **Stop the application**:
   ```bash
   docker-compose down
   ```

## Accessing the Application

Once the containers are up and running, you can access:

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Prisma Studio**: [http://localhost:5555](http://localhost:5555)

### Default Login Credentials

After running the database seed script, you can log in with these accounts:

```
Admin:
- Email: admin@lms.com
- Password: admin123

Teacher:
- Email: teacher@lms.com
- Password: teacher123

Student:
- Email: student@lms.com
- Password: student123
```

## Using Prisma Studio

Prisma Studio is a visual database management tool that allows you to view and modify your data.

To access Prisma Studio:

1. **Start Prisma Studio** (if not already running):
   ```bash
   docker-compose exec backend npx prisma studio
   ```

2. Open [http://localhost:5555](http://localhost:5555) in your browser

3. You can view and manage all database tables through the interface

## Environment Variables

All environment variables are defined in the `docker-compose.yml` file. You can customize these variables by modifying this file or by creating a `.env` file in the project root.

### Frontend
- `NEXT_PUBLIC_API_URL`: URL of the backend API
  - Default: `http://localhost:5000` (for browser access)
  - Note: Within Docker network, backend is accessible at `http://backend:5000`

### Backend
- `DATABASE_URL`: PostgreSQL connection string
  - Default: `postgresql://postgres:postgres@db:5432/lms?schema=public`
- `JWT_SECRET`: Secret key for JWT token generation
  - Default: `your_jwt_secret` (change this in production)
- `NODE_ENV`: Environment mode
  - Default: `production`

### Database
- `POSTGRES_USER`: PostgreSQL username
  - Default: `postgres`
- `POSTGRES_PASSWORD`: PostgreSQL password
  - Default: `postgres` (change this in production)
- `POSTGRES_DB`: PostgreSQL database name
  - Default: `lms`

## Common Operations

### Viewing Logs
```bash
# View logs for all containers
docker-compose logs

# View logs for a specific container with follow option
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

### Restarting Services
```bash
# Restart a specific service
docker-compose restart frontend
docker-compose restart backend
docker-compose restart db

# Restart all services
docker-compose restart
```

### Rebuilding After Code Changes
```bash
# Rebuild and restart frontend
docker-compose build frontend
docker-compose up -d frontend

# Rebuild and restart backend
docker-compose build backend
docker-compose up -d backend

# Rebuild all services
docker-compose build
docker-compose up -d
```

### Accessing Container Shell
```bash
# Access backend container shell
docker-compose exec backend sh

# Access frontend container shell
docker-compose exec frontend sh

# Access database container shell
docker-compose exec db bash
```

### Database Operations
```bash
# Access PostgreSQL CLI
docker-compose exec db psql -U postgres -d lms

# Run Prisma migrations
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
docker-compose exec backend npx prisma generate
```

## Troubleshooting

### "Cannot connect to the Docker daemon"
- Ensure Docker is running on your system
- Try running the commands with administrative privileges

### "Port is already allocated"
- Check if another application is using ports 3000, 5000, or 5432
- Change the port mapping in docker-compose.yml
  ```yaml
  ports:
    - "3001:3000"  # Maps container port 3000 to host port 3001
  ```

### "Connection refused to backend"
- Ensure all containers are running: `docker-compose ps`
- Check backend logs for errors: `docker-compose logs backend`
- Ensure the database is properly initialized

### Database Issues
- Reset the database and re-apply migrations:
  ```bash
  docker-compose down -v  # This will delete the database volume
  docker-compose up -d
  docker-compose exec backend npx prisma migrate deploy
  docker-compose exec backend npx prisma db seed
  ```

### TypeScript Compilation Errors
- Access the backend or frontend container and check for compilation errors:
  ```bash
  docker-compose exec backend sh
  # Then inside the container:
  npm run build
  ```

### Application Crashes or Performance Issues
- Increase resources in Docker Desktop settings
- Check container resource usage: `docker stats` 