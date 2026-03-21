# 🚀 Render Deployment Guide

Complete guide for deploying the IMS application to Render using GitHub integration (no CLI required).

## Table of Contents

- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
  - [Create Web Service](#create-web-service)
  - [Create PostgreSQL Database](#create-postgresql-database)
  - [Create Redis](#create-redis)
- [Environment Variables](#environment-variables)
- [Build & Start Commands](#build--start-commands)
- [Health Checks](#health-checks)
- [Updating Deployments](#updating-deployments)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- GitHub account with the IMS codebase pushed to a repository
- Render account (sign up at [render.com](https://render.com))
- Render account linked to your GitHub account

---

## Architecture Overview

The deployment consists of three Render services with a **single server** architecture:

```
┌─────────────────────────────────────────┐
│         Web Service (ims-api)           │
│  ┌─────────────────────────────────┐    │
│  │  Node.js API Server             │    │
│  │  - Serves API endpoints         │    │
│  │  - Serves built static SPA      │    │
│  └─────────────────────────────────┘    │
└───────────┬─────────────────────────────┘
            │
            ├──► PostgreSQL Database (ims-db)
            │
            └──► Redis (ims-redis)
```

**Service Configuration:**
- **Web Service**: Single Node.js server serving both API and static SPA files
- **Database**: PostgreSQL (free tier)
- **Redis**: Redis cache (free tier)
- **Region**: Oregon (us-west)

**Key Points:**
- Frontend is built as static files during build process
- API server serves both `/api/*` routes and static SPA files
- SPA routing is handled with fallback to `index.html`
- Only ONE server to manage and monitor

---

## Quick Start

### Option 1: One-Click Deploy (Recommended)

1. Click the **Deploy to Render** button below (you'll need to create the blueprint from the template)
2. Authorize Render to access your GitHub repository
3. Render will automatically provision all services

### Option 2: Manual Setup

Follow the [Manual Setup](#manual-setup) steps below for full control over configuration.

---

## Manual Setup

### Create Web Service

1. **Log in to Render Dashboard**
   - Go to [dashboard.render.com](https://dashboard.render.com)

2. **Create New Web Service**
   - Click **New +** → **Web Service**
   - Connect your GitHub repository:
     - Select your GitHub account
     - Choose the IMS repository
     - Branch: `main`

3. **Configure Build Settings**

   | Setting | Value |
   |---------|-------|
   | **Name** | `ims-api` |
   | **Region** | Oregon |
   | **Root Directory** | (leave blank) |
   | **Runtime** | Node |
   | **Build Command** | `pnpm install --frozen-lockfile && pnpm build` |
   | **Start Command** | `pnpm preview` |
   | **Instance Type** | Free |

   **Build Process:**
   The build command performs these steps:
   1. Installs all dependencies with locked versions
   2. Builds the frontend web app (`@ims/web`) → outputs to `apps/api/client/`
   3. Compiles the API TypeScript to JavaScript in `apps/api/dist/`

   This ensures the API server has everything needed to serve both API and frontend.

4. **Configure Auto-Deploy**
   - Ensure **Auto-Deploy** is enabled (deploys on every push to `main`)

5. **Click "Create Web Service"**

---

### Create PostgreSQL Database

1. **Create New Database**
   - Click **New +** → **PostgreSQL**

2. **Configure Database**

   | Setting | Value |
   |---------|-------|
   | **Name** | `ims-db` |
   | **Database Name** | `ims` |
   | **Region** | Oregon (same as web service) |
   | **Plan** | Free |

3. **Click "Create Database"**

4. **Note the Connection String**
   - After creation, go to the **Overview** tab
   - Copy the **Internal Database URL** (used for environment variables)

---

### Create Redis

1. **Create New Redis**
   - Click **New +** → **Redis**

2. **Configure Redis**

   | Setting | Value |
   |---------|-------|
   | **Name** | `ims-redis` |
   | **Region** | Oregon (same as web service) |
   | **Plan** | Free |
   | **Max Memory Policy** | No Eviction |

3. **Click "Create Redis"**

4. **Note the Connection String**
   - After creation, go to the **Overview** tab
   - Copy the **Internal Redis URL**

---

## Environment Variables

Configure these environment variables in your Web Service:

1. Go to your Web Service dashboard
2. Click the **Environment** tab
3. Add the following variables:

### Required Variables

| Key | Value | Source |
|-----|-------|--------|
| `NODE_ENV` | `production` | Manual |
| `PORT` | `10000` | Manual |
| `DATABASE_URL` | *(from PostgreSQL)* | Database → Overview → Internal URL |
| `REDIS_URL` | *(from Redis)* | Redis → Overview → Internal URL |
| `JWT_SECRET` | *(auto-generate)* | Click "Generate" button |
| `JWT_ACCESS_EXPIRY` | `15m` | Manual |
| `JWT_REFRESH_EXPIRY` | `7d` | Manual |
| `COOKIE_NAME` | `ims_access_token` | Manual |
| `COOKIE_MAX_AGE` | `900000` | Manual |
| `NODE_OPTIONS` | `--max-old-space-size=512` | Manual |

### Optional Variables

| Key | Value | Description |
|-----|-------|-------------|
| `LOG_LEVEL` | `info` | Logging level (debug, info, warn, error) |
| `CORS_ORIGIN` | `https://your-domain.com` | Allowed CORS origin |
| `FRONTEND_URL` | `https://your-frontend.com` | Frontend URL for redirects |

### How to Add Environment Variables

```
1. Navigate to: Dashboard → Your Web Service → Environment tab
2. Click "Add Environment Variable"
3. Enter Key and Value
4. Click "Save Changes"
5. Service will automatically redeploy with new variables
```

---

## Build & Start Commands

### Build Command (Root)

```bash
pnpm install --frozen-lockfile && pnpm build
```

**What this does:**
1. Installs all dependencies with locked versions
2. Builds the frontend web app (`@ims/web`) → outputs to `apps/api/client/`
3. Compiles the API TypeScript to JavaScript in `apps/api/dist/`

### Start Command (Root Preview)

```bash
pnpm preview
```

**What this does:**
- Starts the Node.js API server from `apps/api/dist/index.js`
- Server serves both:
  - **SPA (Frontend)** at root `/` → serves static files from `apps/api/client/`
  - **API endpoints** at `/api/*` → handles all API requests
  - **Monitoring endpoints** at `/monitoring/*` → health checks and metrics
- SPA fallback routing sends all non-API/monitoring requests to `index.html`

**Local Production Testing:**
```bash
# Full production simulation
pnpm build && pnpm preview

# Access in browser:
# - Frontend: http://localhost:10000/
# - API: http://localhost:10000/api/*
# - Health: http://localhost:10000/monitoring/health
```

---

## Health Checks

Render automatically monitors your service health.

### Configuration

| Setting | Value |
|---------|-------|
| **Health Check Path** | `/monitoring/health` |
| **Interval** | 30 seconds (default) |
| **Timeout** | 10 seconds (default) |

### Setup

1. Go to your Web Service dashboard
2. Click **Settings**
3. Scroll to **Health Check**
4. Enter path: `/monitoring/health`
5. Click **Save Changes**

### Health Check Endpoints

| Endpoint | Purpose | Access |
|----------|---------|--------|
| `/monitoring/health` | Basic health status | Public |
| `/monitoring/health/detailed` | Detailed health with DB/Redis checks | Authenticated |
| `/monitoring/metrics` | Full metrics dashboard | Admin only |

---

## Updating Deployments

### Automatic Deployment (Recommended)

When **Auto-Deploy** is enabled:

1. Push changes to your `main` branch
2. Render automatically detects the push
3. Build and deploy starts automatically
4. Monitor progress in the **Logs** tab

### Manual Deployment

To manually trigger a deployment:

1. Go to your Web Service dashboard
2. Click **Manual Deploy**
3. Select branch (usually `main`)
4. Click **Deploy**

### Viewing Deployment Status

1. Go to **Dashboard** → Your Web Service
2. View current deployment status at the top
3. Click **Logs** to see real-time build/deploy logs

---

## Troubleshooting

### Build Fails

**Common Issues:**

| Error | Solution |
|-------|----------|
| `pnpm: command not found` | Ensure `.node-version` file exists with Node 22+ |
| `Cannot find module` | Check `package.json` dependencies |
| `TypeScript compilation error` | Run `pnpm typecheck` locally first |
| `Out of memory during build` | Upgrade to paid plan or optimize build |

**Debug Steps:**
1. Check the **Logs** tab for detailed error messages
2. Verify build command is correct
3. Test build locally: `pnpm install && pnpm --filter @ims/api build`

### Service Won't Start

**Common Issues:**

| Error | Solution |
|-------|----------|
| `Port already in use` | Ensure PORT=10000 in environment |
| `Database connection failed` | Verify DATABASE_URL is correct |
| `Redis connection failed` | Verify REDIS_URL is correct |
| `Crash on start` | Check logs for specific error |

**Debug Steps:**
1. Check **Logs** tab for startup errors
2. Verify all environment variables are set
3. Test database connectivity in Render dashboard

### Health Check Fails

**Common Issues:**

| Error | Solution |
|-------|----------|
| `Health check returned 503` | Service is unhealthy, check logs |
| `Health check timeout` | Service is slow, check database/redis |
| `Health check returned 404` | Verify endpoint path is `/api/health` |

**Debug Steps:**
1. Check **Logs** for health check requests
2. Test health endpoint manually via browser/curl
3. Review detailed health: `/api/monitoring/health/detailed`

### Database Connection Issues

1. **Verify Database is Running**
   - Go to PostgreSQL dashboard
   - Check status is "Running"

2. **Verify Connection String**
   - Use **Internal Database URL** (not external)
   - Format: `postgresql://user:pass@host:port/db`

3. **Check Region Match**
   - Database and Web Service must be in same region

### Redis Connection Issues

1. **Verify Redis is Running**
   - Go to Redis dashboard
   - Check status is "Running"

2. **Verify Connection String**
   - Use **Internal Redis URL**
   - Format: `redis://user:pass@host:port`

3. **Check Max Memory Policy**
   - Should be set to `noeviction`

### Performance Issues

| Symptom | Solution |
|---------|----------|
| Slow responses | Check database query performance |
| Memory errors | Increase `NODE_OPTIONS` memory limit |
| Timeout errors | Review slow request logs |

### Accessing Logs

1. **Real-time Logs**
   - Dashboard → Web Service → **Logs** tab
   - Shows live deployment and runtime logs

2. **Historical Logs**
   - Dashboard → Web Service → **Logs** tab
   - Use time range selector

3. **Download Logs**
   - Click **Download** button in Logs tab
   - Saves as `.txt` file

---

## Cost Estimation

### Free Tier Limits

| Service | Free Tier Limit |
|---------|-----------------|
| Web Service | 750 hours/month, 512MB RAM |
| PostgreSQL | 1GB storage, 25 connections |
| Redis | 25MB memory |

### When to Upgrade

Consider upgrading when you experience:
- Frequent service suspensions (free tier sleeps after inactivity)
- Memory errors (512MB limit)
- Database connection limits reached
- Need for custom domains with SSL

---

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to GitHub
   - Use Render's environment variable UI
   - Mark sensitive variables as "Sensitive"

2. **Database Security**
   - Use internal database URL (not public)
   - Enable SSL for database connections
   - Regular backups (automatic on paid plans)

3. **Network Security**
   - Enable CORS only for trusted origins
   - Use HTTPS for all endpoints
   - Implement rate limiting

4. **Secrets Management**
   - Rotate JWT_SECRET periodically
   - Use strong, randomly generated secrets
   - Never expose secrets in logs

---

## Support & Resources

- [Render Documentation](https://render.com/docs)
- [Render Pricing](https://render.com/pricing)
- [Render Status](https://status.render.com)
- [Community Forum](https://community.render.com)

---

## Quick Reference

### URLs

| Service | URL Pattern |
|---------|-------------|
| Web Service (Home) | `https://<service-name>.onrender.com` |
| API Base | `https://<service-name>.onrender.com/api` |
| Health Check | `https://<service-name>.onrender.com/monitoring/health` |
| Detailed Health | `https://<service-name>.onrender.com/monitoring/health/detailed` |
| Metrics | `https://<service-name>.onrender.com/monitoring/metrics` |
| Database | Internal only |
| Redis | Internal only |

### Example Endpoints

| Endpoint | Full URL Example |
|----------|------------------|
| Frontend SPA | `https://ims-api.onrender.com/` |
| Login API | `https://ims-api.onrender.com/api/auth/login` |
| Inventory API | `https://ims-api.onrender.com/api/inventory` |
| Health Check | `https://ims-api.onrender.com/monitoring/health` |

### Commands Reference

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Full production build (web + api)
pnpm build

# Run production server locally (after build)
pnpm preview

# Full build and preview in one command
pnpm build && pnpm preview

# Type check before deploy
pnpm typecheck

# Development (separate dev servers with proxy)
pnpm dev
```

### Development vs Production

| Mode | Command | Behavior |
|------|---------|----------|
| **Development** | `pnpm dev` | Runs Vite dev server (port 5171) + API server (port 3030) with proxy |
| **Production Build** | `pnpm build` | Builds web to `apps/api/client/` + compiles API to `apps/api/dist/` |
| **Production Run** | `pnpm preview` | Single server serving both SPA and API on port 10000 |

### Default Ports

| Service | Port |
|---------|------|
| Web Service (Production) | 10000 |
| API Server (Production) | 10000 |
| Vite Dev Server | 5171 |
| API Dev Server | 3030 |
| PostgreSQL | 5432 |
| Redis | 6379 |
