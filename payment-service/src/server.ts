import express, { Application } from 'express';
import morgan from 'morgan';
import { config } from './config';
import logger from './logger';
import Database from './database';
import RabbitMQConnection from './rabbitmq';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import paymentRoutes from './routes/payments';

const app: Application = express();

// Initialize database connection
Database.getInstance().connect();

// Initialize RabbitMQ connection
RabbitMQConnection.getInstance().connect();

// Request logging
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  })
);

app.use(express.json());

// Routes
app.use('/api', paymentRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down payment service...');
  await Database.getInstance().disconnect();
  await RabbitMQConnection.getInstance().disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down payment service...');
  await Database.getInstance().disconnect();
  await RabbitMQConnection.getInstance().disconnect();
  process.exit(0);
});

app.listen(config.PORT, () => {
  logger.info(
    `Payment service running on port ${config.PORT} in ${config.NODE_ENV} mode`
  );
});

export default app;
