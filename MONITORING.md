# 📊 Monitoring & Observability Guide

This document describes the monitoring capabilities built into the IMS API.

## Table of Contents

- [Overview](#overview)
- [Health Endpoints](#health-endpoints)
- [Metrics Endpoints](#metrics-endpoints)
- [Logging](#logging)
- [Alerting](#alerting)
- [Production Deployment](#production-deployment)

---

## Overview

The IMS API includes comprehensive monitoring and observability features:

- **Health Checks**: Multiple endpoints for different probe types
- **Metrics**: Request, database, and business metrics
- **Structured Logging**: JSON logs for production aggregation
- **Error Tracking**: Automatic error logging with context
- **Performance Monitoring**: Response time tracking and slow request detection

---

## Health Endpoints

### Basic Health Check

**Endpoint:** `GET /monitoring/health`

**Access:** Public (no authentication)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-21T12:00:00.000Z"
}
```

**Status Codes:**
- `200` - Service is healthy or degraded
- `503` - Service is unhealthy

**Use Case:** Load balancer health checks

---

### Detailed Health Check

**Endpoint:** `GET /monitoring/health/detailed`

**Access:** Admin/Manager only

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "status": "healthy",
      "message": "Database connection healthy",
      "details": {
        "responseTime": "12ms"
      },
      "responseTime": 12
    },
    "redis": {
      "status": "healthy",
      "message": "Redis connection healthy",
      "details": {
        "responseTime": "5ms",
        "connectedClients": "3",
        "memoryUsed": "1.2M",
        "commandsProcessed": "1234"
      },
      "responseTime": 5
    },
    "memory": {
      "status": "healthy",
      "message": "Memory usage normal",
      "details": {
        "heapUsed": "45MB",
        "heapTotal": "128MB",
        "heapUsedPercent": "35.2%",
        "rss": "98MB"
      }
    }
  },
  "uptime": 3600000,
  "version": "1.0.0",
  "timestamp": "2026-03-21T12:00:00.000Z"
}
```

---

### Kubernetes Probes

**Readiness Probe:** `GET /monitoring/ready`

Checks if the service is ready to receive traffic.

**Liveness Probe:** `GET /monitoring/live`

Checks if the service process is running.

**Example Kubernetes Config:**
```yaml
livenessProbe:
  httpGet:
    path: /monitoring/live
    port: 3030
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /monitoring/ready
    port: 3030
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## Metrics Endpoints

### Comprehensive Metrics

**Endpoint:** `GET /monitoring/metrics`

**Access:** Admin only

**Response:**
```json
{
  "requests": {
    "total": 15234,
    "successful": 14890,
    "failed": 344,
    "byEndpoint": {
      "/items": 5234,
      "/categories": 2341,
      "/auth/login": 1523
    },
    "byMethod": {
      "GET": 10234,
      "POST": 3523,
      "PATCH": 1234,
      "DELETE": 243
    },
    "byStatusCode": {
      "200": 12345,
      "201": 2345,
      "400": 234,
      "401": 56,
      "403": 34,
      "404": 12,
      "500": 8
    }
  },
  "performance": {
    "avgResponseTime": 145.23,
    "p95ResponseTime": 456.78,
    "p99ResponseTime": 892.34,
    "slowRequests": 23
  },
  "database": {
    "connections": {
      "active": 5,
      "idle": 3,
      "total": 8
    },
    "queries": {
      "total": 45234,
      "slow": 123,
      "failed": 5
    },
    "latency": {
      "avg": 23.45,
      "p95": 89.12
    }
  },
  "redis": {
    "connected": true,
    "memoryUsed": "1.2M",
    "connectedClients": "3",
    "commandsProcessed": "45234"
  },
  "system": {
    "uptime": 86400000,
    "memory": {
      "used": 98,
      "total": 16384,
      "percent": 0.6
    },
    "heap": {
      "used": 45,
      "total": 128,
      "percent": 35.2
    }
  },
  "business": {
    "totalUsers": 156,
    "activeUsers": 142,
    "totalItems": 2345,
    "lowStockItems": 23,
    "outOfStockItems": 5,
    "totalCategories": 45,
    "movementsToday": 234
  },
  "collectedAt": "2026-03-21T12:00:00.000Z"
}
```

---

### Request Metrics

**Endpoint:** `GET /monitoring/metrics/requests`

**Access:** Admin only

**Response:** Request-specific metrics including response times and slow request count.

---

### Database Metrics

**Endpoint:** `GET /monitoring/metrics/database`

**Access:** Admin only

**Response:** Query performance metrics and latency statistics.

---

### Business Metrics

**Endpoint:** `GET /monitoring/metrics/business`

**Access:** Admin/Manager only

**Response:** Business-level metrics like user counts, inventory status, and movement statistics.

---

### Reset Metrics

**Endpoint:** `POST /monitoring/metrics/reset`

**Access:** Admin only

Resets all accumulated metrics counters.

---

## Logging

### Log Levels

- `debug` - Detailed debugging information
- `info` - General operational information
- `warn` - Warning conditions (e.g., slow requests)
- `error` - Error conditions

### Log Format

**Development:**
```
[12:34:56] [INFO] Server started successfully
  { port: 3030, environment: 'development' }
```

**Production (JSON):**
```json
{
  "timestamp": "2026-03-21T12:34:56.789Z",
  "level": "info",
  "message": "Server started successfully",
  "context": {
    "port": 3030,
    "environment": "development"
  },
  "metadata": {
    "service": "ims-api",
    "version": "1.0.0",
    "environment": "production",
    "hostname": "server-01",
    "pid": 12345
  }
}
```

### Request Logging

Every request is automatically logged with:
- HTTP method and URL
- Response status code
- Response time
- User agent
- Client IP
- Memory change during request

### Slow Request Detection

Requests taking longer than 1000ms are automatically logged as warnings.

### Configure Log Level

Set via environment variable:
```bash
LOG_LEVEL=debug  # debug, info, warn, error
```

---

## Alerting

### Recommended Alerts

Configure alerts based on these conditions:

| Metric | Warning | Critical |
|--------|---------|----------|
| Health Status | degraded | unhealthy |
| Error Rate | > 5% | > 10% |
| P95 Latency | > 500ms | > 1000ms |
| Memory Usage | > 75% | > 90% |
| Database Latency | > 100ms | > 500ms |
| Slow Requests | > 10/min | > 50/min |

### Example Prometheus Rules

```yaml
groups:
  - name: ims-alerts
    rules:
      - alert: IMSServiceUnhealthy
        expr: ims_health_status == 2
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "IMS API is unhealthy"
          
      - alert: IMSHighErrorRate
        expr: rate(ims_requests_failed_total[5m]) / rate(ims_requests_total[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "IMS API error rate above 5%"
          
      - alert: IMSHighLatency
        expr: ims_request_latency_p95 > 500
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "IMS API P95 latency above 500ms"
```

---

## Production Deployment

### Environment Variables

```bash
# Monitoring
LOG_LEVEL=info                    # debug, info, warn, error

# Health Check Configuration
HEALTH_CHECK_INTERVAL=30000       # ms between health checks
SLOW_REQUEST_THRESHOLD=1000       # ms
SLOW_QUERY_THRESHOLD=100          # ms
```

### Docker Health Check

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3030/monitoring/health || exit 1
```

### Render.com Configuration

The `render.yaml` already includes health check configuration:

```yaml
healthCheckPath: /monitoring/health
```

### Grafana Dashboard

Import the provided Grafana dashboard JSON (see `monitoring/grafana-dashboard.json`) for visualization.

### Log Aggregation

For production, configure log aggregation:

**Example: ELK Stack**
```yaml
# Filebeat configuration
filebeat.inputs:
  - type: log
    paths:
      - /var/log/ims-api/*.log
    json.keys_under_root: true
    json.add_error_key: true
```

**Example: Datadog**
```yaml
# datadog.yaml
logs:
  - type: file
    path: /var/log/ims-api/*.log
    service: ims-api
    source: nodejs
```

---

## API Examples

### Check Service Health

```bash
curl http://localhost:3030/monitoring/health
```

### Get Detailed Status

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3030/monitoring/health/detailed
```

### Get All Metrics

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3030/monitoring/metrics
```

### Get Business Metrics Only

```bash
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:3030/monitoring/metrics/business
```

---

## Troubleshooting

### Service Shows as Unhealthy

1. Check detailed health: `GET /monitoring/health/detailed`
2. Review database connection
3. Check memory usage
4. Review recent error logs

### High Latency

1. Check database metrics: `GET /monitoring/metrics/database`
2. Review slow query logs
3. Check system resources (memory, CPU)
4. Review request metrics for specific slow endpoints

### Memory Issues

1. Check memory health in detailed status
2. Review heap usage in metrics
3. Consider increasing container memory limit
4. Check for memory leaks in logs

---

## Support

For monitoring-related issues, check:
1. Application logs
2. Health endpoint responses
3. Metrics trends
4. Recent deployments or configuration changes
