# 🐳 Docker Setup Complete!

## What's Included

### Files Created

```
pern/
├── docker-compose.yml          # Main Docker Compose configuration
├── setup.sh                    # Linux/Mac setup script
├── setup.bat                   # Windows setup script
├── DEVELOPMENT.md              # Complete development guide
├── docker/
│   ├── README.md              # Docker-specific documentation
│   ├── Dockerfile.api         # API container image
│   └── Dockerfile.web         # Web container image
└── apps/api/
    ├── .env.local             # Local development env (gitignored)
    ├── .env.example           # Production env template
    └── .gitignore             # Ignore local env files
```

## Quick Start Commands

### Option 1: Full Docker (Everything in containers)
```bash
docker compose up
```
- Starts: PostgreSQL, Redis, API, Web
- Access: http://localhost:5171
- Best for: Testing full stack, consistent environment

### Option 2: Docker DB Only (Recommended for dev)
```bash
# Terminal 1
docker compose up postgres redis

# Terminal 2
pnpm install
pnpm db:push
pnpm dev
```
- Starts: Only PostgreSQL and Redis in Docker
- Runs: API and Web locally with hot-reload
- Best for: Active development, fast iteration

### Option 3: Use Setup Script
```bash
# Linux/Mac
./setup.sh

# Windows
.\setup.bat

# With options
./setup.sh full-docker    # Everything in Docker
./setup.sh docker-db      # Docker DB only (default)
./setup.sh local          # Everything local
```

## Services Overview

| Service | Container Name | Port | Internal Port | Volume |
|---------|---------------|------|---------------|--------|
| PostgreSQL | `ims-postgres` | 5433 | 5432 | `postgres_data` |
| Redis | `ims-redis` | 6379 | 6379 | `redis_data` |
| API | `ims-api` | 3030 | 3030 | bind mount |
| Web | `ims-web` | 5171 | 5171 | bind mount |

## Production Services Mapping

| Local Service | Production Service | Provider |
|--------------|-------------------|----------|
| PostgreSQL 15 | Serverless PostgreSQL | Neon (free-tier) |
| Redis 7 | Serverless Redis | Upstash (free-tier) |
| API + Web | Web Service | Render (free-tier) |

### Connection Strings

**Local Development:**
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ims?schema=public"
REDIS_URL="redis://localhost:6379"
```

**Production (example):**
```bash
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/ims?sslmode=require"
REDIS_URL="redis://default:pass@xxx.upstash.io:6379"
```

## Docker Commands Cheat Sheet

```bash
# Lifecycle
docker compose up              # Start all
docker compose up -d           # Start detached
docker compose down            # Stop all
docker compose down -v         # Stop + remove volumes

# Individual services
docker compose up postgres     # Start only PostgreSQL
docker compose restart api     # Restart API
docker compose stop web        # Stop Web only

# Logs
docker compose logs            # All logs
docker compose logs -f         # Follow logs
docker compose logs api        # API logs only

# Status
docker compose ps              # List containers
docker compose top             # Running processes

# Execute commands
docker compose exec api sh     # Shell in API container
docker compose exec postgres psql -U postgres -d ims  # Database shell

# One-off commands
docker compose run --rm api pnpm db:push    # Push schema
docker compose run --rm api pnpm test       # Run tests
docker compose run --rm api pnpm typecheck  # Type check

# Cleanup
docker compose down -v         # Remove volumes (delete data)
docker container prune         # Remove stopped containers
docker volume prune            # Remove unused volumes
```

## Database Management

### Access PostgreSQL
```bash
# Via docker exec
docker compose exec postgres psql -U postgres -d ims

# Via psql client
psql -h localhost -p 5433 -U postgres -d ims

# Common commands
\dt              # List tables
\d items         # Describe table
SELECT * FROM items LIMIT 10;  # Query
\q               # Quit
```

### Reset Database
```bash
# Complete reset (loses all data)
docker compose down -v
docker compose up -d postgres
pnpm db:push

# Keep data, just restart
docker compose restart postgres
```

### Backup/Restore
```bash
# Backup
docker compose exec postgres pg_dump -U postgres ims > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres ims < backup.sql
```

## Redis Management

### Access Redis
```bash
# Via docker exec
docker compose exec redis redis-cli

# Test connection
docker compose exec redis redis-cli ping  # Should return PONG

# Common commands
KEYS *           # List all keys
GET session:xxx  # Get value
DEL session:xxx  # Delete key
INFO             # Server info
```

## Testing

### Run Tests in Docker
```bash
# Backend tests
docker compose run --rm api pnpm --filter @ims/api test

# Frontend tests
docker compose run --rm web pnpm --filter @ims/web test

# Type checking
docker compose run --rm api pnpm typecheck
docker compose run --rm web pnpm typecheck
```

### Run Tests Locally
```bash
# With Docker DB only
docker compose up -d postgres redis
pnpm test
```

## Environment Variables

### For API Service (set automatically in Docker)
```bash
NODE_ENV=development
PORT=3030
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ims?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=super-secret-key-at-least-32-characters-long-for-ims
CORS_ORIGIN=http://localhost:5171
```

**Note:** Inside Docker Compose, use service names (`postgres`, `redis`) as hostnames.

### For Local Development
Create `apps/api/.env.local`:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ims?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-secret-key"
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find what's using the port
lsof -i :5433
lsof -i :6379
lsof -i :3030
lsof -i :5171

# Stop the process or change port in docker-compose.yml
```

**Database won't start:**
```bash
# Check logs
docker compose logs postgres

# Remove volume and restart
docker compose down -v
docker compose up postgres
```

**Can't connect from API to database:**
- Inside Docker: Use `postgres` as hostname
- Locally: Use `localhost` as hostname
- Check `DATABASE_URL` in environment

**Out of disk space:**
```bash
# Clean Docker
docker system prune -a
docker volume prune
```

## Performance Optimization

### Reduce Memory Usage
Edit `docker-compose.yml`:
```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 512M
  redis:
    deploy:
      resources:
        limits:
          memory: 256M
```

### Faster Startup
```bash
# Start only what you need
docker compose up postgres redis  # Just databases

# Use Docker Compose profiles
docker compose --profile minimal up
```

## Next Steps

1. **Start Development**
   ```bash
   docker compose up postgres redis
   pnpm dev
   ```

2. **Test the Application**
   - Open http://localhost:5171
   - Login with `admin@ims.local` / `admin123`
   - Create items, categories, stock movements

3. **Deploy to Production**
   - See `render.yaml` for configuration
   - Create Neon database
   - Create Upstash Redis
   - Deploy to Render

## Support

- **Development Guide**: See `DEVELOPMENT.md`
- **Docker Guide**: See `docker/README.md`
- **Environment Setup**: See `apps/api/.env.example`
- **Plan**: See `PLAN.md`

---

**Happy Coding! 🚀**
