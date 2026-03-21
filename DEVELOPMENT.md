# Development Setup Guide

## Quick Start with Docker Compose

### Prerequisites
- Docker & Docker Compose installed
- Node.js 22+ (for local development without Docker)
- pnpm 9+ installed

### Option 1: Full Docker Setup (Recommended)

Start all services (database, redis, api, web):
```bash
docker compose up
```

Access the application:
- **Frontend**: http://localhost:5171
- **API**: http://localhost:3030
- **Health Check**: http://localhost:3030/api/health

Default admin credentials:
- Email: `admin@ims.local`
- Password: `admin123`

### Option 2: Docker for DB/Redis only + Local Development

1. Start only database and Redis:
```bash
docker compose up postgres redis
```

2. In a new terminal, install dependencies:
```bash
pnpm install
```

3. Push database schema:
```bash
pnpm db:push
```

4. Start development servers:
```bash
pnpm dev
```

### Option 3: Pure Local (No Docker)

You'll need PostgreSQL and Redis installed locally.

1. Create `.env` file in `apps/api/`:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ims?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="super-secret-key-at-least-32-characters-long-for-ims"
NODE_ENV="development"
PORT=3030
CORS_ORIGIN="http://localhost:5171"
```

2. Install and run:
```bash
pnpm install
pnpm db:push
pnpm dev
```

## Docker Commands

```bash
# Start all services
docker compose up

# Start in background (detached)
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (clears data)
docker compose down -v

# View logs
docker compose logs -f
docker compose logs -f api
docker compose logs -f web
docker compose logs -f postgres
docker compose logs -f redis

# Check status
docker compose ps

# Restart a service
docker compose restart api

# Run database migrations
docker compose run --rm api pnpm db:migrate

# Access database directly
docker compose exec postgres psql -U postgres -d ims
```

## Production Deployment

This application is configured for **Render.com** free-tier deployment with:
- **Database**: Neon PostgreSQL (free-tier)
- **Redis**: Upstash Redis (free-tier)
- **Hosting**: Render Web Service (free-tier)

### Setup Production Services

1. **Create Neon Database** (https://neon.tech)
   - Create new project
   - Copy connection string
   - Add to Render environment variables

2. **Create Upstash Redis** (https://upstash.com)
   - Create new Redis database
   - Copy REST API URL
   - Add to Render environment variables

3. **Deploy to Render**
   - Connect GitHub repository
   - Use `render.yaml` configuration
   - Add environment variables from `.env.example`

### Environment Variables for Production

See `apps/api/.env.example` for all required variables.

## Testing

### Backend Tests
```bash
pnpm --filter @ims/api test
pnpm --filter @ims/api test:watch
```

### Frontend Tests
```bash
pnpm --filter @ims/web test
pnpm --filter @ims/web test:watch
```

### Type Checking
```bash
pnpm typecheck
```

### Building
```bash
pnpm build
```

## Troubleshooting

### Port Already in Use
If ports 5433, 6379, 3030, or 5171 are in use, modify `docker-compose.yml`:
```yaml
ports:
  - "5434:5432"  # Change host port
```

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d postgres
pnpm db:push
```

### Redis Connection Issues
```bash
# Check if Redis is running
docker compose ps redis

# Test Redis connection
docker compose exec redis redis-cli ping
# Should return: PONG
```

### Clear All Data
```bash
docker compose down -v
pnpm db:push
```

## Architecture

```
┌─────────────┐     ┌─────────────┐
│   Web UI    │────▶│     API     │
│  (React 19) │     │ (Express 5) │
│  Port 5171  │     │  Port 3030  │
└─────────────┘     └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼──────┐ ┌──▼──────┐
       │  PostgreSQL │ │  Redis  │ │  Prisma │
       │   Port 5433 │ │Port 6379│ │  ORM    │
       └─────────────┘ └─────────┘ └─────────┘
```

## Default Credentials

**Admin User:**
- Email: `admin@ims.local`
- Password: `admin123`

**Note**: Change these in production!
