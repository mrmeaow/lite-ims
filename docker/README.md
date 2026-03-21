# Docker Development Setup

## Overview

This Docker setup provides a complete local development environment that mirrors the production architecture:

| Service | Local (Docker) | Production |
|---------|---------------|------------|
| Database | PostgreSQL 15 | Neon (free-tier) |
| Redis | Redis 7 | Upstash (free-tier) |
| API | Express 5 on Node 22 | Render Web Service |
| Frontend | Vite + React 19 | Served by API |

## Quick Start

### Option 1: Full Docker Stack (Easiest)

Run everything in Docker:

```bash
docker compose up
```

Access:
- Frontend: http://localhost:5173
- API: http://localhost:3000/api/health

### Option 2: Docker for Infrastructure Only (Recommended)

Run only PostgreSQL and Redis in Docker, develop locally:

```bash
# Terminal 1: Start databases
docker compose up postgres redis

# Terminal 2: Run app locally
pnpm install
pnpm db:push
pnpm dev
```

This gives you:
- Fast development with hot-reload
- Local debugging capabilities
- Same database/redis as production

## Docker Compose Services

### PostgreSQL

```yaml
postgres:
  image: postgres:15-alpine
  port: 5433 -> 5432
  volume: postgres_data
```

**Connection:**
- Host: `localhost`
- Port: `5433`
- User: `postgres`
- Password: `postgres`
- Database: `ims`

**Access psql:**
```bash
docker compose exec postgres psql -U postgres -d ims
```

### Redis

```yaml
redis:
  image: redis:7-alpine
  port: 6379
  volume: redis_data
```

**Connection:**
- Host: `localhost`
- Port: `6379`

**Access redis-cli:**
```bash
docker compose exec redis redis-cli ping
```

## Common Commands

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop all services
docker compose down

# Stop and remove data (fresh start)
docker compose down -v

# View logs
docker compose logs -f
docker compose logs -f postgres
docker compose logs -f redis

# Check service status
docker compose ps

# Restart a service
docker compose restart api

# Run one-off commands
docker compose run --rm api pnpm db:push
docker compose run --rm api pnpm typecheck
docker compose run --rm api pnpm test

# Access shell
docker compose exec api sh
docker compose exec postgres sh
```

## Environment Variables

The compose file sets these automatically for the `api` service:

```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ims?schema=public
REDIS_URL=redis://redis:6379
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=super-secret-key-at-least-32-characters-long-for-ims
```

**Note:** Inside Docker, services use container names as hostnames:
- `postgres` instead of `localhost`
- `redis` instead of `localhost`

## Volumes

Data persists in Docker volumes:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect pern_postgres_data

# Remove volume (delete data)
docker volume rm pern_postgres_data
docker volume rm pern_redis_data
```

## Network

All services are on the `ims-network` bridge network:

```bash
# List networks
docker network ls

# Inspect network
docker network inspect pern_ims-network
```

## Production Parity

### Neon PostgreSQL Compatibility

The local PostgreSQL 15 is compatible with Neon's serverless PostgreSQL:

**Local:**
```
postgresql://postgres:postgres@localhost:5433/ims?schema=public
```

**Neon:**
```
postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/ims?sslmode=require
```

### Upstash Redis Compatibility

Local Redis 7 is compatible with Upstash:

**Local:**
```
redis://localhost:6379
```

**Upstash:**
```
redis://default:pass@xxx.upstash.io:6379
```

## Troubleshooting

### Port Already in Use

If a port is in use, modify `docker-compose.yml`:

```yaml
ports:
  - "5434:5432"  # Use different host port
```

### Services Won't Start

Check logs:
```bash
docker compose logs postgres
docker compose logs redis
```

### Database Connection Failed

1. Check if PostgreSQL is healthy:
```bash
docker compose ps postgres
```

2. Test connection:
```bash
docker compose exec postgres pg_isready -U postgres -d ims
```

3. Reset database:
```bash
docker compose down -v
docker compose up -d postgres
pnpm db:push
```

### Redis Connection Failed

1. Check if Redis is running:
```bash
docker compose ps redis
```

2. Test connection:
```bash
docker compose exec redis redis-cli ping
```

### Out of Disk Space

Clean up Docker:
```bash
# Remove stopped containers
docker container prune

# Remove unused volumes
docker volume prune

# Remove unused images
docker image prune
```

## Performance Tips

### Faster Startup

Start only what you need:
```bash
docker compose up postgres redis  # Just databases
```

### Reduce Resource Usage

Limit resources in `docker-compose.yml`:
```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

### Use Watch Mode

For local development, use the `docker-db` option:
```bash
docker compose up postgres redis  # Terminal 1
pnpm dev                          # Terminal 2
```

## Migration to Production

When deploying to Render:

1. **Create Neon Database**
   - Go to https://neon.tech
   - Create project
   - Copy connection string
   - Add to Render environment variables as `DATABASE_URL`

2. **Create Upstash Redis**
   - Go to https://upstash.com
   - Create Redis database
   - Copy URL
   - Add to Render as `REDIS_URL`

3. **Deploy to Render**
   - Connect GitHub
   - Use `render.yaml` configuration
   - Add all environment variables from `.env.example`

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   Docker Compose                    │
│                                                     │
│  ┌─────────────┐         ┌─────────────┐           │
│  │   Web UI    │────────▶│     API     │           │
│  │  (React 19) │         │ (Express 5) │           │
│  │  Port 5173  │         │  Port 3000  │           │
│  └─────────────┘         └──────┬──────┘           │
│                                 │                   │
│                    ┌────────────┼────────────┐     │
│                    │            │            │     │
│             ┌──────▼──────┐ ┌──▼──────┐ ┌──▼──────┐│
│             │  PostgreSQL │ │  Redis  │ │  Prisma ││
│             │   Port 5433 │ │Port 6379│ │  ORM    ││
│             └─────────────┘ └─────────┘ └─────────┘│
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [Neon PostgreSQL](https://neon.tech)
- [Upstash Redis](https://upstash.com)
- [Render Deployment](https://render.com)
