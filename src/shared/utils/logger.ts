export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...(meta ? { meta } : {}),
    };

    console.log(JSON.stringify(logEntry));
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log(LogLevel.DEBUG, message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.log(LogLevel.WARN, message, meta);
  }

  error(message: string, error?: Error | unknown, meta?: Record<string, unknown>) {
    this.log(LogLevel.ERROR, message, {
      ...(meta || {}),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : error,
    });
  }
}

export const createLogger = (context: string): Logger => {
  return new Logger(context);
};
