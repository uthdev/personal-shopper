import { config } from './config';
import logger from './logger';
import Database from './database';

// Initialize database connection
Database.getInstance().connect();

logger.info(`Worker service starting in ${config.NODE_ENV} mode...`);
logger.info(`Connected to RabbitMQ: ${config.RABBITMQ_URL}`);
logger.info(`Listening to queue: ${config.RABBITMQ_QUEUE}`);

// Worker service will consume RabbitMQ messages
// Implementation will be added in later issues

process.on('SIGINT', async () => {
  logger.info('Worker service shutting down...');
  await Database.getInstance().disconnect();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  await Database.getInstance().disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await Database.getInstance().disconnect();
  process.exit(1);
});