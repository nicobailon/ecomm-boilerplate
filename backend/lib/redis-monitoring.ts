import { redis, isRedisHealthy } from './redis.js';
import { RedisHealthService } from './redis-health.js';
import { getEmailQueueForShutdown } from './email-queue.js';
import { defaultLogger as logger } from '../utils/logger.js';

interface RedisMetrics {
  connected: boolean;
  health: {
    healthy: boolean;
    errorCount: number;
    lastError: string | null;
    lastErrorTime: Date | null;
    inCooldown: boolean;
  };
  clients: {
    main: boolean;
    emailQueue: boolean;
    websocketPub: boolean;
    websocketSub: boolean;
  };
  memory?: {
    used: number;
    peak: number;
    fragmentation: number;
  };
  stats?: {
    connectedClients: number;
    totalConnections: number;
    commandsProcessed: number;
    instantaneousOps: number;
  };
}

interface MonitoringAlert {
  type: 'connection' | 'health' | 'performance' | 'threshold';
  severity: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}

export class RedisMonitoring {
  private alertHandlers: ((alert: MonitoringAlert) => void)[] = [];
  private lastAlerts = new Map<string, Date>();
  private alertCooldown = 60000; // 1 minute cooldown per alert type
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start monitoring Redis health
   */
  startMonitoring(intervalMs = 30000): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }
    
    logger.info('[RedisMonitoring] Starting Redis monitoring', { intervalMs });
    
    // Initial check
    void this.checkRedisHealth();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      void this.checkRedisHealth();
    }, intervalMs);
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      logger.info('[RedisMonitoring] Stopped Redis monitoring');
    }
  }
  
  /**
   * Register an alert handler
   */
  onAlert(handler: (alert: MonitoringAlert) => void): void {
    this.alertHandlers.push(handler);
  }
  
  /**
   * Get current Redis metrics
   */
  async getMetrics(): Promise<RedisMetrics> {
    const healthStatus = RedisHealthService.getHealthStatus();
    
    const metrics: RedisMetrics = {
      connected: isRedisHealthy(),
      health: healthStatus,
      clients: {
        main: redis.status === 'ready',
        emailQueue: false, // Will be checked asynchronously
        websocketPub: false, // Will be updated by WebSocket service
        websocketSub: false, // Will be updated by WebSocket service
      },
    };
    
    // Check email queue status
    const emailQueue = await getEmailQueueForShutdown();
    if (emailQueue && 'client' in emailQueue) {
      metrics.clients.emailQueue = (emailQueue as any).client?.status === 'ready' || false;
    }
    
    // Get Redis server info if connected
    if (metrics.connected && redis.status === 'ready') {
      try {
        const info = await redis.info();
        const lines = info.split('\r\n');
        const infoObj: Record<string, string> = {};
        
        lines.forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) {
            infoObj[key] = value;
          }
        });
        
        metrics.memory = {
          used: parseInt(infoObj.used_memory ?? '0'),
          peak: parseInt(infoObj.used_memory_peak ?? '0'),
          fragmentation: parseFloat(infoObj.mem_fragmentation_ratio ?? '1'),
        };
        
        metrics.stats = {
          connectedClients: parseInt(infoObj.connected_clients ?? '0'),
          totalConnections: parseInt(infoObj.total_connections_received ?? '0'),
          commandsProcessed: parseInt(infoObj.total_commands_processed ?? '0'),
          instantaneousOps: parseInt(infoObj.instantaneous_ops_per_sec ?? '0'),
        };
      } catch (error) {
        logger.error('[RedisMonitoring] Failed to get Redis info:', error);
      }
    }
    
    return metrics;
  }
  
  /**
   * Check Redis health and send alerts if needed
   */
  private async checkRedisHealth(): Promise<void> {
    try {
      const metrics = await this.getMetrics();
      
      // Check connection status
      if (!metrics.connected) {
        this.sendAlert({
          type: 'connection',
          severity: 'critical',
          service: 'redis-main',
          message: 'Redis connection lost',
          details: metrics.health,
        });
      }
      
      // Check error threshold
      if (metrics.health.errorCount >= 5) {
        this.sendAlert({
          type: 'threshold',
          severity: 'error',
          service: 'redis-main',
          message: `High error rate: ${metrics.health.errorCount} errors`,
          details: metrics.health,
        });
      }
      
      // Check memory usage
      if (metrics.memory && metrics.memory.fragmentation > 1.5) {
        this.sendAlert({
          type: 'performance',
          severity: 'warning',
          service: 'redis-main',
          message: `High memory fragmentation: ${metrics.memory.fragmentation.toFixed(2)}`,
          details: metrics.memory,
        });
      }
      
      // Check client connections
      if (metrics.stats && metrics.stats.connectedClients > 100) {
        this.sendAlert({
          type: 'performance',
          severity: 'warning',
          service: 'redis-main',
          message: `High number of connections: ${metrics.stats.connectedClients}`,
          details: metrics.stats,
        });
      }
    } catch (error) {
      logger.error('[RedisMonitoring] Health check failed:', error);
    }
  }
  
  /**
   * Send alert with deduplication
   */
  private sendAlert(alert: Omit<MonitoringAlert, 'timestamp'>): void {
    const alertKey = `${alert.type}-${alert.service}-${alert.severity}`;
    const lastAlertTime = this.lastAlerts.get(alertKey);
    const now = new Date();
    
    // Check cooldown
    if (lastAlertTime && now.getTime() - lastAlertTime.getTime() < this.alertCooldown) {
      return; // Skip alert due to cooldown
    }
    
    const fullAlert: MonitoringAlert = {
      ...alert,
      timestamp: now,
    };
    
    // Update last alert time
    this.lastAlerts.set(alertKey, now);
    
    // Log the alert
    const logLevel = alert.severity === 'critical' || alert.severity === 'error' ? 'error' : 'warn';
    logger[logLevel](`[RedisMonitoring] ${alert.severity.toUpperCase()} Alert:`, {
      type: alert.type,
      service: alert.service,
      message: alert.message,
      details: alert.details,
    });
    
    // Send to all registered handlers
    this.alertHandlers.forEach(handler => {
      try {
        handler(fullAlert);
      } catch (error) {
        logger.error('[RedisMonitoring] Alert handler error:', error);
      }
    });
  }
  
  /**
   * Get monitoring dashboard data
   */
  async getDashboard(): Promise<{
    metrics: RedisMetrics;
    recentAlerts: MonitoringAlert[];
    queueHealth?: unknown;
  }> {
    const metrics = await this.getMetrics();
    
    // Get queue health if available
    let queueHealth;
    const emailQueue = await getEmailQueueForShutdown();
    if (emailQueue) {
      try {
        const { queueMonitoring } = await import('./queue-monitoring.js');
        queueHealth = await queueMonitoring.getQueueHealth();
      } catch (error) {
        logger.error('[RedisMonitoring] Failed to get queue health:', error);
      }
    }
    
    return {
      metrics,
      recentAlerts: [], // Would store recent alerts in production
      queueHealth,
    };
  }
}

// Create singleton instance
export const redisMonitoring = new RedisMonitoring();

// Alert handler presets
export const monitoringHandlers = {
  // Console logging (default)
  console: (alert: MonitoringAlert) => {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    }[alert.severity];
    
    console.error(`${emoji} [${alert.service}] ${alert.message}`);
  },
  
  // Metrics collection (e.g., for Prometheus)
  metrics: (alert: MonitoringAlert) => {
    // In production, would increment counters for monitoring systems
    const metricName = `redis_alert_${alert.type}_${alert.severity}_total`;
    logger.debug('[RedisMonitoring] Metric:', { metricName, service: alert.service });
  },
  
  // Health endpoint integration
  healthEndpoint: (alert: MonitoringAlert) => {
    // Update health endpoint status based on alerts
    if (alert.severity === 'critical') {
      process.env.REDIS_HEALTH_STATUS = 'unhealthy';
    } else if (alert.severity === 'error') {
      process.env.REDIS_HEALTH_STATUS = 'degraded';
    }
  },
};