type LogLevel = "info" | "warn" | "error" | "debug";

export interface LoggerOptions {
  level?: string;
  service?: string;
}

interface LogData {
  [key: string]: unknown;
}

export interface Logger {
  info: (message: string, meta?: LogData) => void;
  warn: (message: string, meta?: LogData) => void;
  error: (message: string, meta?: LogData) => void;
  debug: (message: string, meta?: LogData) => void;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const createLogger = (options?: LoggerOptions): Logger => {
  const logLevel = options?.level || process.env.LOG_LEVEL || "info";
  const serviceName = options?.service || process.env.SERVICE_NAME || "app";
  const minLevel = LOG_LEVELS[logLevel as LogLevel] ?? LOG_LEVELS.info;

  const log = (level: LogLevel, message: string, meta?: LogData) => {
    if (LOG_LEVELS[level] < minLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: serviceName,
      ...meta,
    };

    console.log(JSON.stringify(logEntry));
  };

  return {
    info: (message, meta) => log("info", message, meta),
    warn: (message, meta) => log("warn", message, meta),
    error: (message, meta) => log("error", message, meta),
    debug: (message, meta) => log("debug", message, meta),
  };
};

export const logger = createLogger();
export default logger;
