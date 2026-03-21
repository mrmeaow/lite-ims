/**
 * Monitoring Middleware
 * Adds request logging, metrics collection, and performance monitoring
 */

import { Request, Response, NextFunction } from 'express';
import { metricsStore, logger, type LogEntry } from '../utils/monitoring.js';
import type { AuthRequest } from './auth.js';

// Slow request threshold in ms
const SLOW_REQUEST_THRESHOLD = 1000;

/**
 * Request logging and metrics middleware
 */
export function monitoringMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const startMemory = process.memoryUsage();
    
    // Get response after it's sent
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const endMemory = process.memoryUsage();
      const memoryDiff = endMemory.heapUsed - startMemory.heapUsed;
      
      // Record metrics
      const endpoint = req.route?.path || req.path;
      metricsStore.recordRequest(
        endpoint,
        req.method,
        res.statusCode,
        responseTime
      );
      
      // Log request
      logger.request({
        message: `${req.method} ${req.originalUrl}`,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        responseTime,
        request: {
          method: req.method,
          url: req.originalUrl,
          statusCode: res.statusCode,
          responseTime,
          userAgent: req.get('user-agent'),
          ip: req.ip,
        },
        context: {
          responseTime: `${responseTime}ms`,
          memoryChange: `${Math.round(memoryDiff / 1024)}KB`,
          slow: responseTime > SLOW_REQUEST_THRESHOLD,
        },
      });
      
      // Log slow requests
      if (responseTime > SLOW_REQUEST_THRESHOLD) {
        logger.warn('Slow request detected', {
          method: req.method,
          url: req.originalUrl,
          responseTime: `${responseTime}ms`,
          threshold: `${SLOW_REQUEST_THRESHOLD}ms`,
        });
      }
    });
    
    next();
  };
}

/**
 * Error tracking middleware
 * Must be used after routes
 */
export function errorTrackingMiddleware() {
  return (err: Error, req: Request, _res: Response, next: NextFunction) => {
    // Log the error
    logger.error('Unhandled error', err, {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    next(err);
  };
}

/**
 * User activity tracking middleware
 * Tracks authenticated user actions
 */
export function userActivityMiddleware() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      // Only track successful authenticated requests
      if (req.userId && res.statusCode >= 200 && res.statusCode < 300) {
        logger.info('User action', {
          userId: req.userId,
          action: `${req.method} ${req.route?.path || req.path}`,
          resource: getResourceFromPath(req.path),
          statusCode: res.statusCode,
        });
      }
    });
    
    next();
  };
}

/**
 * Extract resource type from path
 */
function getResourceFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  // Get the main resource (e.g., /api/inventory/items/123 -> items)
  const resourceIndex = parts.findIndex(p => !p.startsWith(':'));
  return parts[resourceIndex] || 'unknown';
}

/**
 * Database query monitoring wrapper
 * Wrap Prisma queries to track performance
 */
export function monitorQuery<T>(
  operation: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  return queryFn()
    .then(result => {
      const duration = Date.now() - startTime;
      const isSlow = duration > 100;
      
      metricsStore.recordQuery(duration, isSlow, false);
      
      if (isSlow) {
        logger.warn('Slow database query', {
          operation,
          duration: `${duration}ms`,
          threshold: '100ms',
        });
      }
      
      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      metricsStore.recordQuery(duration, false, true);
      
      logger.error('Database query failed', error, {
        operation,
        duration: `${duration}ms`,
      });
      
      throw error;
    });
}
