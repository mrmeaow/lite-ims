import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./config/index.js";
import { logger } from "./utils/monitoring.js";
import { monitoringMiddleware, errorTrackingMiddleware, userActivityMiddleware } from "./middleware/monitoring.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import monitoringRoutes from "./routes/monitoring.js";
import { rbacService } from "./services/rbacService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app: Express = express();

// ============================================================================
// Middleware
// ============================================================================

// CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Monitoring middleware (must be early)
app.use(monitoringMiddleware());

// User activity tracking
app.use(userActivityMiddleware());

// ============================================================================
// API Routes
// ============================================================================

// Monitoring routes (public health checks + protected metrics)
app.use("/monitoring", monitoringRoutes);

// Main API routes
app.use("/api", routes);

// ============================================================================
// Static Files (Production)
// ============================================================================

// Serve static files from the built web app (SPA)
// Path resolution works for both local and Render deployment:
// - Local: Running from apps/api/dist/index.js, client at apps/api/dist/client
// - Render: Running from /opt/render/project/apps/api/dist/index.js
const clientPath = process.env["CLIENT_PATH"]
  ? path.resolve(process.env["CLIENT_PATH"])
  : path.resolve(__dirname, "client"); // resolves to => apps/api/dist/client/

app.use(express.static(clientPath));

// Handle SPA routing - serve index.html for all non-API routes
// Note: Express 5 requires (*path) instead of * for wildcard routes
app.get("/*path", (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/monitoring")) {
    next();
  } else {
    res.sendFile(path.resolve(clientPath, "index.html"));
  }
});

// ============================================================================
// Error Handling
// ============================================================================

// Error tracking middleware
app.use(errorTrackingMiddleware());

// Standard error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// ============================================================================
// Server Startup
// ============================================================================

async function start() {
  try {
    // Seed default roles and permissions
    await rbacService.seedDefaults();

    app.listen(config.port, () => {
      logger.info('Server started successfully', {
        port: config.port,
        environment: config.nodeEnv,
        corsOrigin: config.corsOrigin,
      });
      
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 IMS API Server Running                               ║
║                                                           ║
║   Port:        ${config.port}                               ║
║   Environment: ${config.nodeEnv.padEnd(30)} ║
║   API:         http://localhost:${config.port}/api          ║
║   Health:      http://localhost:${config.port}/monitoring/health    ║
║   Metrics:     http://localhost:${config.port}/monitoring/metrics   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `.trim());
    });
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();

export default app;