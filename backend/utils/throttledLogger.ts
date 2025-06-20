import { createLogger, LogMetadata } from './logger.js';

interface ThrottleConfig {
  maxLogsPerMinute: number;
  summaryInterval: number; // in milliseconds
}

interface LogStats {
  total: number;
  throttled: number;
  lastReset: number;
}

/**
 * Creates a throttled logger for high-volume operations like migrations.
 * Prevents log flooding by limiting the number of logs per minute and
 * providing periodic summaries instead of individual entries.
 */
export function createThrottledLogger(
  defaultMetadata?: LogMetadata,
  config: ThrottleConfig = {
    maxLogsPerMinute: 100,
    summaryInterval: 30000, // 30 seconds
  }
) {
  const baseLogger = createLogger(defaultMetadata);
  const stats: LogStats = {
    total: 0,
    throttled: 0,
    lastReset: Date.now(),
  };

  let summaryTimer: NodeJS.Timeout | null = null;
  const pendingLogs = new Map<string, number>(); // message -> count

  const resetIfNeeded = () => {
    const now = Date.now();
    if (now - stats.lastReset >= 60000) {
      stats.total = 0;
      stats.lastReset = now;
    }
  };

  const shouldThrottle = (): boolean => {
    resetIfNeeded();
    return stats.total >= config.maxLogsPerMinute;
  };

  const logSummary = () => {
    if (pendingLogs.size > 0) {
      const summary = Array.from(pendingLogs.entries())
        .map(([msg, count]) => `${msg} (${count}x)`)
        .join(', ');
      
      baseLogger.info(`Log summary: ${summary}`, {
        throttled: stats.throttled,
        period: `${config.summaryInterval / 1000}s`,
      });
      
      pendingLogs.clear();
      stats.throttled = 0;
    }
  };

  const startSummaryTimer = () => {
    if (!summaryTimer) {
      summaryTimer = setInterval(logSummary, config.summaryInterval);
    }
  };

  const stopSummaryTimer = () => {
    if (summaryTimer) {
      clearInterval(summaryTimer);
      summaryTimer = null;
      logSummary(); // Final summary
    }
  };

  return {
    info: (message: string, metadata?: LogMetadata) => {
      if (shouldThrottle()) {
        stats.throttled++;
        const count = pendingLogs.get(message) || 0;
        pendingLogs.set(message, count + 1);
        startSummaryTimer();
      } else {
        stats.total++;
        baseLogger.info(message, metadata);
      }
    },
    error: (message: string, error?: unknown, metadata?: LogMetadata) => {
      // Never throttle errors
      baseLogger.error(message, error, metadata);
    },
    warn: (message: string, metadata?: LogMetadata) => {
      if (shouldThrottle()) {
        stats.throttled++;
        const count = pendingLogs.get(message) || 0;
        pendingLogs.set(message, count + 1);
        startSummaryTimer();
      } else {
        stats.total++;
        baseLogger.warn(message, metadata);
      }
    },
    debug: (message: string, metadata?: LogMetadata) => {
      if (shouldThrottle()) {
        stats.throttled++;
        const count = pendingLogs.get(message) || 0;
        pendingLogs.set(message, count + 1);
        startSummaryTimer();
      } else {
        stats.total++;
        baseLogger.debug(message, metadata);
      }
    },
    /**
     * Force a summary log and reset throttling
     */
    flush: () => {
      stopSummaryTimer();
    },
    /**
     * Get current throttling statistics
     */
    getStats: () => ({
      ...stats,
      pendingLogs: pendingLogs.size,
    }),
  };
}