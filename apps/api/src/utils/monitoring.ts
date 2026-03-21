/**
 * Monitoring Utilities for IMS
 * Provides metrics collection, health checks, and performance monitoring
 */

import { db } from '../config/database.js';
import type { Redis } from 'ioredis';

// ============================================================================
// Metrics Types
// ============================================================================

export interface Metrics {
  // Request metrics
  requests: {
    total: number;
    successful: number;
    failed: number;
    byEndpoint: Record<string, number>;
    byMethod: Record<string, number>;
    byStatusCode: Record<string, number>;
  };
  
  // Performance metrics
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    slowRequests: number; // > 1000ms
  };
  
  // Database metrics
  database: {
    connections: {
      active: number;
      idle: number;
      total: number;
    };
    queries: {
      total: number;
      slow: number; // > 100ms
      failed: number;
    };
    latency: {
      avg: number;
      p95: number;
    };
  };
  
  // Redis metrics
  redis: {
    connected: boolean;
    memoryUsed?: number;
    connectedClients?: number;
    commandsProcessed?: number;
  };
  
  // System metrics
  system: {
    uptime: number;
    memory: {
      used: number;
      total: number;
      percent: number;
    };
    heap: {
      used: number;
      total: number;
      percent: number;
    };
  };
  
  // Business metrics
  business: {
    totalUsers: number;
    activeUsers: number;
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalCategories: number;
    movementsToday: number;
  };
  
  // Timestamp
  collectedAt: string;
}

// ============================================================================
// Metrics Store (in-memory, for production use Redis or Prometheus)
// ============================================================================

class MetricsStore {
  private requestTimes: number[] = [];
  private queryTimes: number[] = [];
  private startTime: number = Date.now();
  
  // Request counters
  requests = {
    total: 0,
    successful: 0,
    failed: 0,
    byEndpoint: {} as Record<string, number>,
    byMethod: {} as Record<string, number>,
    byStatusCode: {} as Record<string, number>,
  };
  
  // Query counters
  queries = {
    total: 0,
    slow: 0,
    failed: 0,
  };

  recordRequest(endpoint: string, method: string, statusCode: number, responseTime: number) {
    this.requests.total++;
    this.requests.byEndpoint[endpoint] = (this.requests.byEndpoint[endpoint] || 0) + 1;
    this.requests.byMethod[method] = (this.requests.byMethod[method] || 0) + 1;
    this.requests.byStatusCode[statusCode] = (this.requests.byStatusCode[statusCode] || 0) + 1;
    
    if (statusCode >= 200 && statusCode < 400) {
      this.requests.successful++;
    } else {
      this.requests.failed++;
    }
    
    // Keep last 1000 response times for percentile calculations
    this.requestTimes.push(responseTime);
    if (this.requestTimes.length > 1000) {
      this.requestTimes.shift();
    }
  }

  recordQuery(responseTime: number, isSlow: boolean, isFailed: boolean) {
    this.queries.total++;
    if (isSlow) this.queries.slow++;
    if (isFailed) this.queries.failed++;
    
    // Keep last 1000 query times
    this.queryTimes.push(responseTime);
    if (this.queryTimes.length > 1000) {
      this.queryTimes.shift();
    }
  }

  getPerformanceMetrics() {
    if (this.requestTimes.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        slowRequests: 0,
      };
    }

    const sorted = [...this.requestTimes].sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    const slowRequests = sorted.filter(t => t > 1000).length;

    return {
      avgResponseTime: Math.round(avg * 100) / 100,
      p95ResponseTime: Math.round(p95 * 100) / 100,
      p99ResponseTime: Math.round(p99 * 100) / 100,
      slowRequests,
    };
  }

  getQueryMetrics() {
    if (this.queryTimes.length === 0) {
      return {
        avg: 0,
        p95: 0,
      };
    }

    const sorted = [...this.queryTimes].sort((a, b) => a - b);
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;

    return {
      avg: Math.round(avg * 100) / 100,
      p95: Math.round(p95 * 100) / 100,
    };
  }

  getUptime() {
    return Date.now() - this.startTime;
  }

  reset() {
    this.requestTimes = [];
    this.queryTimes = [];
    this.startTime = Date.now();
    this.requests = {
      total: 0,
      successful: 0,
      failed: 0,
      byEndpoint: {},
      byMethod: {},
      byStatusCode: {},
    };
    this.queries = {
      total: 0,
      slow: 0,
      failed: 0,
    };
  }
}

export const metricsStore = new MetricsStore();

// ============================================================================
// Health Check Functions
// ============================================================================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
    memory: HealthCheck;
    disk?: HealthCheck;
  };
  uptime: number;
  version: string;
  timestamp: string;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  details?: Record<string, unknown>;
  responseTime?: number;
}

export async function checkDatabaseHealth(): Promise<HealthCheck> {
  const startTime = Date.now();

  try {
    // Test database connection with a simple query
    await db.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // Get connection pool stats
    const responseTimeMs = responseTime;
    const stats = {
      responseTime: responseTimeMs,
      status: responseTimeMs < 100 ? 'healthy' as const : responseTimeMs < 500 ? 'degraded' as const : 'unhealthy' as const,
    };

    return {
      status: stats.status,
      message: responseTime < 100 ? 'Database connection healthy' : 'Database response slow',
      details: {
        responseTime: `${responseTime}ms`,
      },
      responseTime,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    // During startup, connection may not be ready yet - return degraded instead of unhealthy
    if (errorMsg.toLowerCase().includes('connect') || errorMsg.toLowerCase().includes('connection')) {
      return {
        status: 'degraded',
        message: 'Database connecting...',
        details: {
          error: errorMsg,
        },
      };
    }

    return {
      status: 'unhealthy',
      message: 'Database connection failed',
      details: {
        error: errorMsg,
      },
    };
  }
}

export async function checkRedisHealth(redis?: Redis): Promise<HealthCheck> {
  if (!redis) {
    return {
      status: 'degraded',
      message: 'Redis not configured',
    };
  }
  
  const startTime = Date.now();
  
  try {
    const info = await redis.info('stats');
    const responseTime = Date.now() - startTime;
    
    // Parse Redis info
    const stats: Record<string, string> = {};
    info.split('\r\n').forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        stats[key] = value.trim();
      }
    });
    
    return {
      status: 'healthy',
      message: 'Redis connection healthy',
      details: {
        responseTime: `${responseTime}ms`,
        connectedClients: stats['connected_clients'] || 'N/A',
        memoryUsed: stats['used_memory_human'] || 'N/A',
        commandsProcessed: stats['total_commands_processed'] || 'N/A',
      },
      responseTime,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Redis connection failed',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

export function checkMemoryHealth(): HealthCheck {
  const memUsage = process.memoryUsage();
  const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  let message = 'Memory usage normal';
  
  if (heapUsedPercent > 90) {
    status = 'unhealthy';
    message = 'Memory usage critical';
  } else if (heapUsedPercent > 75) {
    status = 'degraded';
    message = 'Memory usage high';
  }
  
  return {
    status,
    message,
    details: {
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsedPercent: `${heapUsedPercent.toFixed(1)}%`,
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
    },
  };
}

export async function getHealthStatus(redis?: Redis): Promise<HealthStatus> {
  const [database, redisHealth, memory] = await Promise.all([
    checkDatabaseHealth(),
    checkRedisHealth(redis),
    Promise.resolve(checkMemoryHealth()),
  ]);
  
  // Determine overall status
  const checks = [database, redisHealth, memory];
  const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
  const hasDegraded = checks.some(c => c.status === 'degraded');
  
  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (hasUnhealthy) status = 'unhealthy';
  else if (hasDegraded) status = 'degraded';
  
  return {
    status,
    checks: {
      database,
      redis: redisHealth,
      memory,
    },
    uptime: metricsStore.getUptime(),
    version: process.env['npm_package_version'] || '1.0.0',
    timestamp: new Date().toISOString(),
  };
}

// ============================================================================
// Metrics Collection
// ============================================================================

export async function collectMetrics(redis?: Redis): Promise<Metrics> {
  // Get business metrics from database
  const [
    totalUsers,
    activeUsers,
    totalItems,
    lowStockItems,
    outOfStockItems,
    totalCategories,
    movementsToday,
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
  ]);

  const memUsage = process.memoryUsage();
  const performance = metricsStore.getPerformanceMetrics();
  const queryMetrics = metricsStore.getQueryMetrics();

  return {
    requests: { ...metricsStore.requests },
    performance,
    database: {
      connections: {
        active: 0, // Prisma doesn't expose this directly
        idle: 0,
        total: 0,
      },
      queries: { ...metricsStore.queries },
      latency: queryMetrics,
    },
    redis: redis
      ? {
          connected: redis.status === 'ready',
          ...(await checkRedisHealth(redis)).details,
        }
      : { connected: false },
    system: {
      uptime: metricsStore.getUptime(),
      memory: {
        used: Math.round(memUsage.rss / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024),
        percent: Math.round((memUsage.rss / os.totalmem()) * 100),
      },
      heap: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
    },
    business: {
      totalUsers,
      activeUsers,
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalCategories,
      movementsToday,
    },
    collectedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Logger
// ============================================================================

import os from 'os';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  metadata?: {
    service: string;
    version: string;
    environment: string;
    hostname: string;
    pid: number;
  };
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  request?: {
    method: string;
    url: string;
    statusCode?: number;
    responseTime?: number;
    userAgent?: string;
    ip?: string;
  };
}

class Logger {
  private service: string;
  private version: string;
  private environment: string;
  private hostname: string;
  private pid: number;
  private minLevel: LogLevel;

  constructor(options?: {
    service?: string;
    version?: string;
    environment?: string;
    minLevel?: LogLevel;
  }) {
    this.service = options?.service || 'ims-api';
    this.version = options?.version || process.env['npm_package_version'] || '1.0.0';
    this.environment = options?.environment || process.env['NODE_ENV'] || 'development';
    this.hostname = os.hostname();
    this.pid = process.pid;
    this.minLevel = options?.minLevel || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata: {
        service: this.service,
        version: this.version,
        environment: this.environment,
        hostname: this.hostname,
        pid: this.pid,
      },
    };
  }

  private output(entry: LogEntry) {
    // In production, output JSON for log aggregation
    if (this.environment === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      // Pretty print in development
      const colorMap: Record<LogLevel, string> = {
        debug: '\x1b[36m', // Cyan
        info: '\x1b[32m',  // Green
        warn: '\x1b[33m',  // Yellow
        error: '\x1b[31m', // Red
      };
      const color = colorMap[entry.level] || '\x1b[0m';

      const reset = '\x1b[0m';
      const time = (entry.timestamp.split('T')[1] || '').split('.')[0];

      console.log(`${color}[${time}] [${entry.level.toUpperCase()}]${reset} ${entry.message}`);
      if (entry.context) {
        console.log('  ', entry.context);
      }
      if (entry.error) {
        console.log(`  ${entry.error.stack || entry.error.message}`);
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog('debug')) return;
    this.output(this.createEntry('debug', message, context));
  }

  info(message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog('info')) return;
    this.output(this.createEntry('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>) {
    if (!this.shouldLog('warn')) return;
    this.output(this.createEntry('warn', message, context));
  }

  error(message: string, error?: Error, context?: Record<string, unknown>) {
    if (!this.shouldLog('error')) return;
    const entry = this.createEntry('error', message, context);
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    this.output(entry);
  }

  request(entry: Omit<LogEntry, 'timestamp' | 'level' | 'metadata'> & {
    method: string;
    url: string;
    statusCode: number;
    responseTime: number;
  }) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: entry.statusCode >= 500 ? 'error' : entry.statusCode >= 400 ? 'warn' : 'info',
      message: `${entry.request?.method} ${entry.request?.url}`,
      request: entry.request,
      metadata: {
        service: this.service,
        version: this.version,
        environment: this.environment,
        hostname: this.hostname,
        pid: this.pid,
      },
    };
    this.output(logEntry);
  }
}

export const logger = new Logger({
  service: 'ims-api',
  minLevel: (process.env['LOG_LEVEL'] as LogLevel) || 'info',
});

export function createLogger(service: string, minLevel?: LogLevel) {
  return new Logger({ service, minLevel });
}
