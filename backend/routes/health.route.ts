import { Router } from 'express';
import mongoose from 'mongoose';
import { redis, isRedisHealthy } from '../lib/redis.js';
import { queueMonitoring } from '../lib/queue-monitoring.js';
import { getEmailQueueForShutdown } from '../lib/email-queue.js';
import { RedisHealthService } from '../lib/redis-health.js';

const router = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latency?: number;
    };
    redis: {
      status: 'connected' | 'disconnected';
      latency?: number;
      healthy?: boolean;
      errorCount?: number;
      lastError?: string | null;
      inCooldown?: boolean;
    };
    emailQueue?: {
      status: 'healthy' | 'unhealthy';
      metrics?: {
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: number;
      };
    };
  };
  version: string;
  uptime: number;
}

router.get('/health', (_req, res) => {
  void (async () => {
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date(),
    services: {
      database: { status: 'disconnected' },
      redis: { status: 'disconnected' },
    },
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: process.uptime(),
  };
  
  // Check database connection
  try {
    const start = Date.now();
    await mongoose.connection.db?.admin().ping();
    healthStatus.services.database = {
      status: 'connected',
      latency: Date.now() - start,
    };
  } catch {
    healthStatus.status = 'unhealthy';
  }
  
  // Check Redis connection with enhanced status
  try {
    const start = Date.now();
    await redis.ping();
    const redisHealth = RedisHealthService.getHealthStatus();
    healthStatus.services.redis = {
      status: 'connected',
      latency: Date.now() - start,
      healthy: redisHealth.healthy,
      errorCount: redisHealth.errorCount,
      lastError: redisHealth.lastError,
      inCooldown: redisHealth.inCooldown,
    };
  } catch (error) {
    const redisHealth = RedisHealthService.getHealthStatus();
    healthStatus.status = 'degraded';
    healthStatus.services.redis = {
      status: 'disconnected',
      healthy: false,
      errorCount: redisHealth.errorCount,
      lastError: redisHealth.lastError ?? (error instanceof Error ? error.message : 'Unknown error'),
      inCooldown: redisHealth.inCooldown,
    };
  }
  
  // Check email queue if available
  const emailQueue = await getEmailQueueForShutdown();
  if (emailQueue) {
    try {
      const queueHealth = await queueMonitoring.getQueueHealth();
      healthStatus.services.emailQueue = {
        status: queueHealth.status === 'healthy' ? 'healthy' : 'unhealthy',
        metrics: queueHealth.metrics,
      };
      
      // Mark as degraded if too many failed jobs
      if (queueHealth.metrics.failed > 10) {
        healthStatus.status = 'degraded';
      }
    } catch {
      healthStatus.services.emailQueue = {
        status: 'unhealthy',
      };
      healthStatus.status = 'degraded';
    }
  }
  
  // Return appropriate status code
  const statusCode = healthStatus.status === 'healthy' ? 200 : 
                    healthStatus.status === 'degraded' ? 503 : 500;
  
  res.status(statusCode).json(healthStatus);
  })();
});

// Simpler liveness check for k8s
router.get('/health/live', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Readiness check for k8s
router.get('/health/ready', (_req, res) => {
  void (async () => {
  try {
    // Quick checks
    await mongoose.connection.db?.admin().ping();
    await redis.ping();
    res.status(200).json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'not ready' });
  }
  })();
});

// Redis-specific health check
router.get('/redis', (_req, res) => {
  const redisHealth = RedisHealthService.getHealthStatus();
  const status = {
    healthy: isRedisHealthy(),
    connected: redis.status === 'ready',
    details: redisHealth,
    timestamp: new Date().toISOString(),
  };

  const httpStatus = status.healthy ? 200 : 503;
  res.status(httpStatus).json(status);
});

export default router;