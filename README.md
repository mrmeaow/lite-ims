# Lite IMS - Inventory Management System

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-22.18.0-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.0+-orange.svg?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D.svg?style=flat-square&logo=redis)](https://redis.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**[mrmeaow](https://github.com/mrmeaow)** presents

</div>

---

## 💡 Project Motivation

> **Why this exists:** As a developer, I found myself in a common dilemma—my portfolio lacked a **public, production-ready full-stack application** to showcase. While I'm actively building a **Cloud ERP system with multi-tenancy** (a complex, long-term WIP), I needed something tangible and complete that demonstrates:
>
> - ✅ **Full-stack proficiency** with modern TypeScript
> - ✅ **Real business logic** beyond todo apps and CRUD demos
> - ✅ **Production-ready patterns** (RBAC, testing, deployment configs)
> - ✅ **Monorepo architecture** with shared packages
> - ✅ **Outcome-driven development** with proper documentation
>
> **Lite IMS** is that project—a lightweight but serious inventory management system that proves I can ship complete, type-safe, enterprise-grade applications. It's the portfolio piece I wished I had, built with the same principles I apply to large-scale systems.
>
> — *Built by [@mrmeaow](https://github.com/mrmeaow)*

---

## 📖 Overview

**Lite IMS** is a production-ready, enterprise-grade Inventory Management System built with the PERN stack (PostgreSQL, Express, React, Node.js). Designed for real business needs, it provides comprehensive inventory tracking, role-based access control, and real-time stock management capabilities.

### ✨ Key Features

- 🔐 **Advanced RBAC** - Dynamic role & permission management with granular resource-level access control
- 📦 **Inventory Management** - Track items, categories, stock movements with full audit trail
- 🔑 **Custom Authentication** - JWT-based auth with HTTP-only cookies, refresh tokens, and session management
- 📊 **Real-time Updates** - Server-Sent Events (SSE) for live stock updates and notifications
- 🎯 **Type-Safe** - End-to-end TypeScript with strict type checking and Prisma ORM
- 🧪 **Tested** - Comprehensive test coverage with Vitest and Supertest
- 🚀 **Production Ready** - Optimized for Render.com free-tier deployment

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Lite IMS                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                          ┌──────────────┐     │
│  │   Web App    │◄─────── HTTP ───────────►│   API Server │     │
│  │  React 19    │      (Port 3030)         │  Express 5   │     │
│  │  Vite + TS   │                          │  + TypeScript│     │
│  │  TailwindCSS │                          │              │     │
│  └──────────────┘                          └──────┬───────┘     │
│                                                   │              │
│                    ┌──────────────────────────────┼──────────┐  │
│                    │                              │          │  │
│             ┌──────▼──────┐              ┌───────▼────┐     │  │
│             │  PostgreSQL │              │   Redis    │     │  │
│             │   (Prisma)  │              │  (Cache)   │     │  │
│             │   Database  │              │  Sessions  │     │  │
│             └─────────────┘              └────────────┘     │  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19 + Vite | Modern SPA with fast HMR |
| **Styling** | TailwindCSS v4 | Utility-first CSS framework |
| **State** | Zustand | Lightweight state management |
| **Backend** | Express.js 5 | RESTful API server |
| **Database** | PostgreSQL 15 | Primary data store |
| **ORM** | Prisma 6 | Type-safe database access |
| **Cache** | Redis 7 | Session & cache layer |
| **Auth** | JWT + bcryptjs | Secure authentication |
| **Validation** | Zod | Runtime type validation |
| **Testing** | Vitest + Supertest | Unit & E2E testing |

---

## 📦 Project Structure

```
lite-ims/
├── apps/
│   ├── api/                    # Express.js API server
│   │   ├── src/
│   │   │   ├── config/         # Configuration & database
│   │   │   ├── middleware/     # Auth, RBAC, error handling
│   │   │   ├── routes/         # API route handlers
│   │   │   ├── services/       # Business logic layer
│   │   │   ├── workers/        # Background job processors
│   │   │   └── utils/          # Shared utilities
│   │   └── dist/
│   │       ├── *.js            # Compiled API
│   │       └── client/         # Built web app (SPA)
│   │
│   └── web/                    # React frontend
│       └── src/
│           ├── components/     # Reusable UI components
│           ├── pages/          # Page components
│           ├── hooks/          # Custom React hooks
│           ├── stores/         # Zustand stores
│           └── utils/          # Helpers & API client
│
├── packages/                   # Shared libraries
│   ├── shared/                 # Shared schemas & constants
│   ├── types/                  # TypeScript type definitions
│   └── database/               # Prisma client & migrations
│
├── docker/                     # Docker configurations
├── .env.example                # Environment template
├── docker-compose.yml          # Local development stack
└── render.yaml                 # Production deployment config
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v22.18.0+ (use [fnm](https://github.com/Schniz/fnm) for version management)
- **pnpm** v9.0+ (`npm i -g pnpm`)
- **Docker** & **Docker Compose** (for local database)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/lite-ims.git
cd lite-ims

# Install dependencies
pnpm install

# Start database & Redis (Docker)
docker compose up postgres redis -d

# Push database schema
pnpm db:push

# Start development servers
pnpm dev
```

### Access the Application

| Service | URL | Description |
|---------|-----|-------------|
| **Web App** | http://localhost:5171 | React frontend |
| **API** | http://localhost:3030 | REST API |
| **Health** | http://localhost:3030/monitoring/health | Health check |
| **Metrics** | http://localhost:3030/monitoring/metrics | System metrics |

### Default Credentials

```
Email:    admin@ims.local
Password: admin123
```

> [!IMPORTANT]
> Change default credentials in production!

---

## 📚 Available Commands

```bash
# Development
pnpm dev              # Start all dev servers (API + Web)
pnpm dev:api          # Start API server only
pnpm dev:web          # Start web server only
pnpm dev:all          # Start both API and web

# Building
pnpm build            # Build all packages
pnpm build:api        # Build API only
pnpm build:web        # Build web only
pnpm preview          # Run production build locally

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema to database
pnpm db:migrate       # Run migrations
pnpm db:reset         # Reset database

# Maintenance
pnpm typecheck        # Type check all packages
pnpm clean            # Remove all build artifacts
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/auth/logout` | Logout user |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET`  | `/api/auth/me` | Get current user |

### Inventory

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/inventory/items` | List all items |
| `POST`   | `/api/inventory/items` | Create item |
| `GET`    | `/api/inventory/items/:id` | Get item details |
| `PUT`    | `/api/inventory/items/:id` | Update item |
| `DELETE` | `/api/inventory/items/:id` | Delete item |
| `POST`   | `/api/inventory/stock` | Record stock movement |
| `GET`    | `/api/inventory/categories` | List categories |

### RBAC (Roles & Permissions)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/rbac/roles` | List all roles |
| `POST`   | `/api/rbac/roles` | Create role |
| `PUT`    | `/api/rbac/roles/:id/permissions` | Update permissions |
| `GET`    | `/api/rbac/permissions` | List all permissions |
| `POST`   | `/api/rbac/users/:id/roles` | Assign role to user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`    | `/api/users` | List all users |
| `GET`    | `/api/users/:id` | Get user details |
| `PUT`    | `/api/users/:id` | Update user |
| `DELETE` | `/api/users/:id` | Delete user |
| `PUT`    | `/api/users/:id/status` | Activate/deactivate user |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/settings` | Get system settings |
| `PUT`  | `/api/settings` | Update system settings |

### Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/monitoring/health` | Health check (public) |
| `GET` | `/monitoring/metrics` | System metrics (protected) |

---

## 🔐 Role-Based Access Control

Lite IMS features a sophisticated RBAC system with:

- **Dynamic Roles**: Create custom roles beyond default Admin, Manager, Viewer
- **Granular Permissions**: Resource + Action matrix (e.g., `inventory:create`, `users:delete`)
- **User Role Assignment**: Assign multiple roles per user
- **Real-time Enforcement**: Middleware validates permissions on every request

### Default Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **Admin** | Full system access | All permissions |
| **Manager** | Inventory & staff management | Most operations except user deletion |
| **Staff** | Daily operations | View & basic stock movements |
| **Viewer** | Read-only access | View only |

---

## 🧪 Testing

```bash
# Run all tests
pnpm --filter @ims/api test
pnpm --filter @ims/web test

# Watch mode
pnpm --filter @ims/api test:watch
pnpm --filter @ims/web test:watch

# Type checking
pnpm typecheck
```

### Test Coverage Goals

- ✅ Unit tests for services & utilities
- ✅ Integration tests for API endpoints
- ✅ Component tests for React components
- ✅ E2E test flows for critical paths

---

## 🐳 Docker Setup

### Start All Services

```bash
docker compose up
```

### Start Database Only

```bash
docker compose up postgres redis -d
```

### Useful Commands

```bash
# View logs
docker compose logs -f api
docker compose logs -f postgres

# Stop all services
docker compose down

# Stop and remove volumes (clears data)
docker compose down -v

# Access database
docker compose exec postgres psql -U postgres -d ims
```

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for complete Docker documentation.

---

## 🌐 Production Deployment

Lite IMS is optimized for **Render.com** free-tier deployment.

### Required Services

| Service | Provider | Tier |
|---------|----------|------|
| Database | [Neon](https://neon.tech) | Free |
| Redis | [Upstash](https://upstash.com) | Free |
| Hosting | [Render](https://render.com) | Free |

### Deployment Steps

1. **Create Neon Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create new project
   - Copy connection string

2. **Create Upstash Redis**
   - Sign up at [upstash.com](https://upstash.com)
   - Create Redis database
   - Copy REST API URL

3. **Deploy to Render**
   - Connect GitHub repository
   - Use provided `render.yaml` configuration
   - Add environment variables from `.env.example`

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Redis
REDIS_URL="redis://..."

# JWT
JWT_SECRET="your-secret-key-min-32-chars"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

# Server
NODE_ENV="production"
PORT=3030
CORS_ORIGIN="https://your-app.onrender.com"

# Cookies
COOKIE_NAME="ims_access_token"
COOKIE_MAX_AGE=900000
```

See [RENDER.md](RENDER.md) for detailed deployment guide.

---

## 📝 Development Guidelines

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Consistent indentation & naming
- **Architecture**: Follow SOLID principles
- **Patterns**: DRY, Clean Code practices

### Commit Convention

```
feat: Add stock movement tracking
fix: Resolve JWT expiry calculation
docs: Update API documentation
refactor: Improve RBAC middleware
test: Add user service tests
```

### Branch Strategy

```
main          # Production-ready code
develop       # Integration branch
feature/*     # New features
fix/*         # Bug fixes
release/*     # Release preparation
```

---

## 🛠️ Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3030
lsof -i :5171

# Kill the process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Restart database
docker compose restart postgres

# Reset database
pnpm db:reset

# Check connection
docker compose exec postgres psql -U postgres -d ims
```

### Build Errors

```bash
# Clean and rebuild
pnpm clean
pnpm install
pnpm build
```

### Type Errors

```bash
# Regenerate Prisma client
pnpm db:generate

# Full typecheck
pnpm typecheck
```

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 👨‍💻 Author

**mrmeaow**  

Full-Stack (SWE) Developer | TypeScript Enthusiast

- 🌐 **GitHub**: [@mrmeaow](https://github.com/mrmeaow)
- 💼 **Portfolio**: [My Digital Space](https://mrmeaow.netlify.app)
- 📧 **Contact**: [iam.mahabub@proton.me](mailto:iam.mahabub@proton.me)

### Other Projects

- 🚧 **Cloud ERP** - Multi-tenant ERP system (WIP)
- 📦 **Lite IMS** - This project

---

## 📧 Support

For issues, questions, or contributions:
- 🐛 **Bug Reports**: Open an issue on GitHub
- 💬 **Questions**: Use GitHub Discussions
- 📩 **Contact**: [iam.mahabub@proton.me](mailto:iam.mahabub@proton.me)

---

<div align="center">

**Built with ❤️ by [@mrmeaow](https://github.com/mrmeaow) using TypeScript, Express, React, and PostgreSQL. aka PERN Stack**

*Lite IMS is part of a portfolio showcasing modern full-stack development skills.*
*For enterprise multi-tenant solutions, check out the ongoing [Cloud ERP](https://github.com/mrmeaow) project. (W.I.P)*

[⬆ Back to Top](#lite-ims---inventory-management-system)

</div>
