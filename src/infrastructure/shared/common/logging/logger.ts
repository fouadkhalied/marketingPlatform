import pino from 'pino';

// Create logger instance with pretty printing for development
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
});

// Logger interface for dependency injection
export interface ILogger {
  info(message: string, obj?: any): void;
  error(message: string, obj?: any): void;
  warn(message: string, obj?: any): void;
  debug(message: string, obj?: any): void;
  child(bindings: Record<string, any>): ILogger;
}

// Pino logger wrapper that implements ILogger interface
export class PinoLogger implements ILogger {
  constructor(private logger: pino.Logger) {}

  info(message: string, obj?: any): void {
    this.logger.info(obj, message);
  }

  error(message: string, obj?: any): void {
    this.logger.error(obj, message);
  }

  warn(message: string, obj?: any): void {
    this.logger.warn(obj, message);
  }

  debug(message: string, obj?: any): void {
    this.logger.debug(obj, message);
  }

  child(bindings: Record<string, any>): ILogger {
    return new PinoLogger(this.logger.child(bindings));
  }
}

// Factory function to create logger instances
export function createLogger(context?: string): ILogger {
  const childLogger = context ? logger.child({ context }) : logger;
  return new PinoLogger(childLogger);
}

// Default logger instance
export const defaultLogger = createLogger();

// Export types for external use
export type { Logger } from 'pino';
