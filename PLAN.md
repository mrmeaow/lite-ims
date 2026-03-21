# Plan - PERN stack potfolio app

## Topic: An Inventory Management System (IMS) using PERN Stack

> I always use TypeScript as my first programming language, and proper advanced type-safe codebase is a must. Also using `pnpm` as my primary package manager with workspace/monorepo style.

**What I want to build ?**

I want to make an inventory management system that helps to manage almost any resource as canonical data-structure driven robust application. It must be a real-world solution for real business clients not any toy or vibe-coded fancy UI application only.

> [!NOTE]
> Node Version: `.node-version` value is `v22.18.0` as we are using fnm 

### Tech Stack Overview

- **Common**: Following DRY, SOLID, Clean Code principles strictly, PNPM workspace with apps & shared libs + types etc. RBAC + pre-defined permission sets driven custom access-control where ADMIN can add new roles and allocate resource-matrix permissions selectivly and add memebers to the roles + this process should DB persistence backed not static or hard-coded. Modular application structure, NOT MVC only or MVVP etc.

- **API / Backend**: Express.js (v5 strictly, even for @tyles/express), Prisma ORM, PostgreSQL (dev: docker, prod: Neon free-tier), Redis (dev: docker, prod: Upstash free-tier), Custom Auth system exlcuding passport.js or similar libs, JWT based Auth. and Redis driven hot-stores, Structured API Response outgoing and logger middleware for incoming/outgoing requests/responses. SSE for various needs e.g. Stock updates, Reason driven Access-Control. Background jobs and queues with separated worker entry file isolated from main API entry file for better ops & scalability. JWT but we accept HTTP-ONLY Cookies for now as p0 level.

- **Frontend**: Vite-React19 based SPA, TailwindCSS@v4 with custom design-system-theme and key components, Corporate/Enterprise like design sense and color combo + file structures. Evalutes access-control and render on demand e.g. X member has no access to R1 resource, so that member should not able to see the sidebar-menu for it.

- **Deployment Ready**: Will be deployed Render free-tier from our Github repository, API will be the main server and the frontend app should be build and placed as its client resource to serve under it as SPA static site. 

- **TDD/BDD**: We must ensure that our apps behaving as per our requirements and our codebase is ready or aligned with. We want proper tests and also E2E test flows to ensure it is working properly and our vision is fulfilled. Before we go for a manulal human SQA checks. 

> [!TIPS]
> Use `supertest` for express.js app & `vitest` for react19 vite app. Make sure our all features and its in depth requirement are working properly. Also, always check for typechecks e.g. `pnpm api typecheck` -> `pnpm --filter @ims/api typecheck` as it will run `tsc --noEmit` to ensure our build will be alright. And, use `tsx` for development runtime in API app, for frontend vite app tsx is not necessary.

---

## 🐳 Development Setup (Docker)

### Quick Start

**Option 1: Full Docker Stack**
```bash
docker compose up
```

**Option 2: Docker DB Only (Recommended)**
```bash
# Terminal 1
docker compose up postgres redis

# Terminal 2
pnpm install
pnpm db:push
pnpm dev
```

**Option 3: Setup Script**
```bash
./setup.sh          # Linux/Mac
.\setup.bat         # Windows
```

### Services

| Service | Port | Access |
|---------|------|--------|
| PostgreSQL | 5433 | `localhost:5433` |
| Redis | 6379 | `localhost:6379` |
| API | 3030 | `localhost:3030` |
| Web | 5171 | `localhost:5171` |

### Documentation

- **DOCKER_SETUP.md** - Complete Docker guide
- **DEVELOPMENT.md** - Development setup guide
- **docker/README.md** - Docker-specific documentation

### Production Services

| Local | Production | Provider |
|-------|-----------|----------|
| PostgreSQL 15 | Neon PostgreSQL | free-tier |
| Redis 7 | Upstash Redis | free-tier |
| Render API | Render Web Service | free-tier |

See `render.yaml` for deployment configuration.
 
