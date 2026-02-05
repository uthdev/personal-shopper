import express from 'express';
import { config } from './config';
import logger from './logger';
import Database from './database';
import RabbitMQConsumer from './rabbitmq';
import { version } from '../package.json';

const app = express();
const startTime = Date.now();

// Initialize database connection
Database.getInstance().connect();

// Initialize RabbitMQ consumer
RabbitMQConsumer.getInstance().connect();

logger.info(`Worker service starting in ${config.NODE_ENV} mode...`);
logger.info(`Connected to RabbitMQ: ${config.RABBITMQ_URL}`);
logger.info(`Listening to queue: ${config.RABBITMQ_QUEUE}`);

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    const dbHealthy = require('mongoose').connection.readyState === 1;
    const startLatency = Date.now();
    
    if (dbHealthy) {
      await require('mongoose').connection.db?.admin().ping();
    }
    
    const dbLatency = Date.now() - startLatency;

    // Check RabbitMQ connection
    const rabbitmq = RabbitMQConsumer.getInstance();
    let rabbitmqHealthy = true;
    let rabbitmqLatency = 0;

    try {
      const startRabbitMQ = Date.now();
      rabbitmqHealthy = true;
      rabbitmqLatency = Date.now() - startRabbitMQ;
    } catch {
      rabbitmqHealthy = false;
    }

    const overallStatus = dbHealthy && rabbitmqHealthy ? 'OK' : 
                         (dbHealthy || rabbitmqHealthy ? 'DEGRADED' : 'ERROR');

    const response = {
      status: overallStatus,
      service: 'worker-service',
      version,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
        latency: dbLatency,
      },
      rabbitmq: {
        status: rabbitmqHealthy ? 'connected' : 'disconnected',
        queue: 'transactions',
        exchange: 'orders',
        latency: rabbitmqLatency,
      },
    };

    const statusCode = dbHealthy && rabbitmqHealthy ? 200 : 503;
    res.status(statusCode).json(response);
  } catch (error) {
    logger.error('Health check error:', error);
    const response = {
      status: 'ERROR',
      service: 'worker-service',
      version,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - startTime) / 1000),
      database: {
        status: 'disconnected',
        latency: undefined,
      },
      rabbitmq: {
        status: 'disconnected',
        queue: 'transactions',
        exchange: 'orders',
        latency: undefined,
      },
    };
    res.status(503).json(response);
  }
});

// Start health check server on port 3005
const HEALTH_CHECK_PORT = 3005;
app.listen(HEALTH_CHECK_PORT, () => {
  logger.info(`Worker service health check server running on port ${HEALTH_CHECK_PORT}`);
});

process.on('SIGINT', async () => {
  logger.info('Worker service shutting down...');
  await RabbitMQConsumer.getInstance().disconnect();
  await Database.getInstance().disconnect();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  logger.error('Uncaught Exception:', error);
  await RabbitMQConsumer.getInstance().disconnect();
  await Database.getInstance().disconnect();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await RabbitMQConsumer.getInstance().disconnect();
  await Database.getInstance().disconnect();
  process.exit(1);
});
