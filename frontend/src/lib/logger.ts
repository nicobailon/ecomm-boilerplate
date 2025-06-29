interface LogEntry {
  level: 'log' | 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class FrontendLogger {
  private logBuffer: LogEntry[] = [];
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 50;
  private flushTimer?: NodeJS.Timeout;
  private apiUrl: string = '/api/frontend-logs';

  constructor() {
    this.patchConsole();
    this.startAutoFlush();

    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    window.addEventListener('error', (event) => {
      this.error('Uncaught error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', {
        reason: event.reason,
        promise: String(event.promise),
      });
    });
  }

  private patchConsole(): void {
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info,
      debug: console.debug,
    };

    console.log = (...args: unknown[]) => {
      this.log('log', args);
      originalConsole.log.apply(console, args);
    };

    console.error = (...args: unknown[]) => {
      this.log('error', args);
      originalConsole.error.apply(console, args);
    };

    console.warn = (...args: unknown[]) => {
      this.log('warn', args);
      originalConsole.warn.apply(console, args);
    };

    console.info = (...args: unknown[]) => {
      this.log('info', args);
      originalConsole.info.apply(console, args);
    };

    console.debug = (...args: unknown[]) => {
      this.log('debug', args);
      originalConsole.debug.apply(console, args);
    };
  }

  private log(level: LogEntry['level'], args: unknown[]): void {
    const message = args
      .map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
      },
    };

    this.logBuffer.push(entry);

    if (this.logBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  private error(message: string, metadata: Record<string, unknown>): void {
    const entry: LogEntry = {
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
      },
    };

    this.logBuffer.push(entry);
    this.flush(); // Immediately flush errors
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('log-session-id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('log-session-id', sessionId);
    }
    return sessionId;
  }

  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.logBuffer.length > 0) {
        this.flush();
      }
    }, this.flushInterval);
  }

  private async flush(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    const logs = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logs),
      });
    } catch (error) {
      // If sending logs fails, put them back in the buffer
      // but limit the buffer size to prevent memory issues
      if (this.logBuffer.length < this.maxBufferSize * 2) {
        this.logBuffer = [...logs, ...this.logBuffer];
      }
    }
  }

  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

let loggerInstance: FrontendLogger | null = null;

export function initializeFrontendLogger(): void {
  if (!loggerInstance && typeof window !== 'undefined') {
    loggerInstance = new FrontendLogger();
  }
}

export function destroyFrontendLogger(): void {
  if (loggerInstance) {
    loggerInstance.destroy();
    loggerInstance = null;
  }
}