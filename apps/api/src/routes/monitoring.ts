/**
 * Monitoring Routes
 * Health checks, metrics, and system status endpoints
 */

import { Router, type Request, type Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import {
  getHealthStatus,
  collectMetrics,
  metricsStore,
  logger,
} from '../utils/monitoring.js';
import { getRedisClient } from '../config/redis.js';

const router: Router = Router();

// ============================================================================
// Public Endpoints (no auth required)
// ============================================================================

/**
 * GET /monitoring/health
 * Basic health check for load balancers
 */
router.get('/health', async (_req, res) => {
  try {
    const health = await getHealthStatus();
    
    const statusCode = 
      health.status === 'healthy' ? 200 :
      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      status: health.status,
      timestamp: health.timestamp,
    });
  } catch (error) {
    logger.error('Health check failed', error as Error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /monitoring/ready
 * Readiness probe for Kubernetes
 */
router.get('/ready', async (_req, res) => {
  try {
    const health = await getHealthStatus();
    
    if (health.status === 'unhealthy') {
      return res.status(503).json({
        ready: false,
        reason: 'Service unhealthy',
      });
    }
    
    res.json({ ready: true });
  } catch (error) {
    res.status(503).json({
      ready: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /monitoring/live
 * Liveness probe for Kubernetes
 */
router.get('/live', (_req, res) => {
  // Simple endpoint that just confirms the process is running
  res.json({ live: true, uptime: process.uptime() });
});

// ============================================================================
// Protected Endpoints (auth required)
// ============================================================================

/**
 * GET /monitoring/health/detailed
 * Detailed health check with all component statuses
 */
router.get(
  '/health/detailed',
  authenticate,
  requireRole('admin', 'manager'),
  async (_req, res) => {
    try {
      const redis = getRedisClient();
      const health = await getHealthStatus(redis);
      
      res.json(health);
    } catch (error) {
      logger.error('Detailed health check failed', error as Error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /monitoring/metrics
 * Comprehensive system metrics
 */
router.get(
  '/metrics',
  authenticate,
  requireRole('admin'),
  async (_req, res) => {
    try {
      const redis = getRedisClient();
      const metrics = await collectMetrics(redis);
      
      res.json(metrics);
    } catch (error) {
      logger.error('Metrics collection failed', error as Error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /monitoring/metrics/requests
 * Request-specific metrics
 */
router.get(
  '/metrics/requests',
  authenticate,
  requireRole('admin'),
  async (_req, res) => {
    try {
      const performance = metricsStore.getPerformanceMetrics();
      
      res.json({
        requests: { ...metricsStore.requests },
        performance,
        slowRequestThreshold: 1000,
      });
    } catch (error) {
      logger.error('Request metrics failed', error as Error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /monitoring/metrics/database
 * Database-specific metrics
 */
router.get(
  '/metrics/database',
  authenticate,
  requireRole('admin'),
  async (_req, res) => {
    try {
      const queryMetrics = metricsStore.getQueryMetrics();
      
      res.json({
        queries: { ...metricsStore.queries },
        latency: queryMetrics,
        slowQueryThreshold: 100,
      });
    } catch (error) {
      logger.error('Database metrics failed', error as Error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * GET /monitoring/metrics/business
 * Business metrics (users, items, etc.)
 */
router.get(
  '/metrics/business',
  authenticate,
  requireRole('admin', 'manager'),
  async (_req, res) => {
    try {
      const { db } = await import('../config/database.js');
      
      const [
        totalUsers,
        activeUsers,
        totalItems,
        lowStockItems,
        outOfStockItems,
        totalCategories,
        movementsToday,
        movementsThisWeek,
        movementsThisMonth,
      ] = await Promise.all([
        db.user.count(),
        db.user.count({ where: { isActive: true } }),
        db.item.count(),
        db.item.count({
          where: {
            quantity: { gt: 0 },
            minQuantity: { gte: db.item.fields.quantity },
          },
        }),
        db.item.count({ where: { quantity: 0 } }),
        db.category.count(),
        db.stockMovement.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        db.stockMovement.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        }),
        db.stockMovement.count({
          where: {
            createdAt: {
              gte: new Date(new Date().setDate(1)),
            },
          },
        }),
      ]);
      
      res.json({
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        inventory: {
          totalItems,
          totalCategories,
          lowStock: lowStockItems,
          outOfStock: outOfStockItems,
          inStock: totalItems - lowStockItems - outOfStockItems,
        },
        movements: {
          today: movementsToday,
          thisWeek: movementsThisWeek,
          thisMonth: movementsThisMonth,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Business metrics failed', error as Error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

/**
 * POST /monitoring/metrics/reset
 * Reset metrics counters (admin only)
 */
router.post(
  '/metrics/reset',
  authenticate,
  requireRole('admin'),
  async (_req, res) => {
    try {
      metricsStore.reset();
      logger.info('Metrics reset by admin');
      
      res.json({
        success: true,
        message: 'Metrics have been reset',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Metrics reset failed', error as Error);
      res.status(500).json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

export default router;
