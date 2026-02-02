import { config } from './config';
import logger from './logger';

logger.info(`Worker service starting in ${config.NODE_ENV} mode...`);
logger.info(`Connected to RabbitMQ: ${config.RABBITMQ_URL}`);
logger.info(`Listening to queue: ${config.RABBITMQ_QUEUE}`);

// Worker service will consume RabbitMQ messages
// Implementation will be added in later issues

process.on('SIGINT', () => {
  logger.info('Worker service shutting down...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});