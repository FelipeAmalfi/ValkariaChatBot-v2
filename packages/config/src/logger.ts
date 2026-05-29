import pino, { type Logger } from 'pino'

export function createLogger(service: string): Logger {
  return pino({
    name: service,
    level: process.env.LOG_LEVEL ?? 'info',
    formatters: {
      level: (label) => ({ level: label }),
    },
    ...(process.env.NODE_ENV !== 'production' && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss' },
      },
    }),
  })
}

export function createChildLogger(logger: Logger, correlationId: string, extra?: Record<string, unknown>): Logger {
  return logger.child({ correlationId, ...extra })
}
