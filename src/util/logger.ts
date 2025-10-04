import pino from 'pino';

// Create a logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info', // Default to 'info'
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});
