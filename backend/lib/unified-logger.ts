import winston from 'winston';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';

interface UnifiedLogMetadata {
  source: string;
  userAgent?: string;
  ip?: string;
  [key: string]: unknown;
}

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, source, ...metadata }) => {
    const logData = {
      timestamp,
      level,
      source: source ?? 'backend',
      message,
      ...metadata,
    };
    return JSON.stringify(logData);
  }),
);

const unifiedLogger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'unified.log'),
      maxsize: 50 * 1024 * 1024, // 50MB
      maxFiles: 5,
      tailable: true,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;
const originalConsoleDebug = console.debug;

export function patchConsoleForUnifiedLogging(): void {
  console.log = (...args: unknown[]) => {
    unifiedLogger.info(args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' '), { source: 'backend' });
    originalConsoleLog.apply(console, args);
  };

  console.error = (...args: unknown[]) => {
    unifiedLogger.error(args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' '), { source: 'backend' });
    originalConsoleError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    unifiedLogger.warn(args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' '), { source: 'backend' });
    originalConsoleWarn.apply(console, args);
  };

  console.info = (...args: unknown[]) => {
    unifiedLogger.info(args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' '), { source: 'backend' });
    originalConsoleInfo.apply(console, args);
  };

  console.debug = (...args: unknown[]) => {
    unifiedLogger.debug(args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' '), { source: 'backend' });
    originalConsoleDebug.apply(console, args);
  };
}

export function enableMongooseQueryLogging(): void {
  mongoose.set('debug', (collectionName: string, methodName: string, ...args: unknown[]) => {
    const query = args[0];
    const options = args[1];
    const duration = args[args.length - 1];
    
    unifiedLogger.debug('MongoDB Query', {
      source: 'database',
      collection: collectionName,
      method: methodName,
      query: query ? JSON.stringify(query) : undefined,
      options: options ? JSON.stringify(options) : undefined,
      duration: typeof duration === 'number' ? duration : undefined,
    });
  });
}

export const frontendLogMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (req.path === '/api/frontend-logs' && req.method === 'POST') {
    const logs = req.body as Array<{
      level: string;
      message: string;
      timestamp: string;
      metadata?: Record<string, unknown>;
    }>;

    if (Array.isArray(logs)) {
      logs.forEach(log => {
        const metadata: UnifiedLogMetadata = {
          source: 'frontend',
          userAgent: req.headers['user-agent'],
          ip: req.ip,
          ...log.metadata,
        };

        switch (log.level) {
          case 'error':
            unifiedLogger.error(log.message, metadata);
            break;
          case 'warn':
            unifiedLogger.warn(log.message, metadata);
            break;
          case 'debug':
            unifiedLogger.debug(log.message, metadata);
            break;
          default:
            unifiedLogger.info(log.message, metadata);
        }
      });
    }

    res.status(204).send();
  } else {
    next();
  }
};


export function getLogsPath(): string {
  return path.join(logsDir, 'unified.log');
}

export { unifiedLogger as default };