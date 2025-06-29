import { z } from 'zod';
import mongoose from 'mongoose';
import { router, publicProcedure } from '../index.js';
import { USE_VARIANT_LABEL, USE_VARIANT_ATTRIBUTES } from '../../utils/featureFlags.js';
import { redis, isRedisHealthy } from '../../lib/redis.js';
import { RedisHealthService } from '../../lib/redis-health.js';
import { queueMonitoring } from '../../lib/queue-monitoring.js';
import { getEmailQueueForShutdown } from '../../lib/email-queue.js';

export const statusRouter = router({
  flags: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/status/flags',
        tags: ['status'],
        summary: 'Get feature flags status',
        description: 'Returns the current state of feature flags for frontend synchronization',
      },
    })
    .output(
      z.object({
        useVariantLabel: z.boolean(),
        useVariantAttributes: z.boolean(),
        timestamp: z.string(),
      }),
    )
    .query(() => {
      return {
        useVariantLabel: USE_VARIANT_LABEL,
        useVariantAttributes: USE_VARIANT_ATTRIBUTES,
        timestamp: new Date().toISOString(),
      };
    }),
    
  health: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/status/health',
        tags: ['status'],
        summary: 'Health check endpoint',
      },
    })
    .output(
      z.object({
        status: z.literal('ok'),
        timestamp: z.string(),
      }),
    )
    .query(() => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    }),
    
  live: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/status/live',
        tags: ['status'],
        summary: 'Liveness check endpoint',
        description: 'Simple liveness check for Kubernetes/Docker health probes',
      },
    })
    .output(
      z.object({
        status: z.literal('ok'),
      }),
    )
    .query(() => {
      return {
        status: 'ok',
      };
    }),
    
  ready: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/status/ready',
        tags: ['status'],
        summary: 'Readiness check endpoint',
        description: 'Checks if the service is ready to handle requests',
      },
    })
    .output(
      z.object({
        status: z.enum(['ready', 'not ready']),
        services: z.object({
          database: z.boolean(),
          redis: z.boolean(),
        }).optional(),
      }),
    )
    .query(async () => {
      try {
        // Quick checks
        await mongoose.connection.db?.admin().ping();
        await redis.ping();
        
        return {
          status: 'ready' as const,
          services: {
            database: true,
            redis: true,
          },
        };
      } catch {
        return {
          status: 'not ready' as const,
          services: {
            database: mongoose.connection.readyState === 1,
            redis: redis.status === 'ready',
          },
        };
      }
    }),
    
  redis: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/status/redis',
        tags: ['status'],
        summary: 'Redis health check',
        description: 'Detailed Redis health status and metrics',
      },
    })
    .output(
      z.object({
        healthy: z.boolean(),
        connected: z.boolean(),
        details: z.object({
          healthy: z.boolean(),
          errorCount: z.number(),
          lastError: z.string().nullable(),
          lastErrorTime: z.date().nullable(),
          inCooldown: z.boolean(),
        }),
        timestamp: z.string(),
      }),
    )
    .query(() => {
      const redisHealth = RedisHealthService.getHealthStatus();
      return {
        healthy: isRedisHealthy(),
        connected: redis.status === 'ready',
        details: {
          healthy: redisHealth.healthy,
          errorCount: redisHealth.errorCount,
          lastError: redisHealth.lastError,
          lastErrorTime: redisHealth.lastErrorTime,
          inCooldown: redisHealth.inCooldown,
        },
        timestamp: new Date().toISOString(),
      };
    }),
    
  comprehensive: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/status/comprehensive',
        tags: ['status'],
        summary: 'Comprehensive health check',
        description: 'Full system health check with all service statuses',
      },
    })
    .output(
      z.object({
        status: z.enum(['healthy', 'degraded', 'unhealthy']),
        timestamp: z.date(),
        services: z.object({
          database: z.object({
            status: z.enum(['connected', 'disconnected']),
            latency: z.number().optional(),
          }),
          redis: z.object({
            status: z.enum(['connected', 'disconnected']),
            latency: z.number().optional(),
            healthy: z.boolean().optional(),
            errorCount: z.number().optional(),
            lastError: z.string().nullable().optional(),
            inCooldown: z.boolean().optional(),
          }),
          emailQueue: z.object({
            status: z.enum(['healthy', 'unhealthy']),
            metrics: z.object({
              waiting: z.number(),
              active: z.number(),
              completed: z.number(),
              failed: z.number(),
              delayed: z.number(),
              paused: z.number(),
            }).optional(),
          }).optional(),
        }),
        version: z.string(),
        uptime: z.number(),
      }),
    )
    .query(async () => {
      const healthStatus: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        timestamp: Date;
        services: {
          database: { status: 'connected' | 'disconnected'; latency?: number };
          redis: { status: 'connected' | 'disconnected'; latency?: number; healthy?: boolean; errorCount?: number; lastError?: string | null; inCooldown?: boolean };
          emailQueue?: { status: 'healthy' | 'unhealthy'; metrics?: { waiting: number; active: number; completed: number; failed: number; delayed: number; paused: number } };
        };
        version: string;
        uptime: number;
      } = {
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
      const emailQueue = getEmailQueueForShutdown();
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
      
      return healthStatus;
    }),
});