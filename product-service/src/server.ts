import express from 'express';
import morgan from 'morgan';
import { config } from './config';
import logger from './logger';
import Database from './database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

// Initialize database connection
Database.getInstance().connect();

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

app.use(express.json());

app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({ 
    status: 'OK', 
    service: 'product-service',
    environment: config.NODE_ENV,
    port: config.PORT
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down product service...');
  await Database.getInstance().disconnect();
  process.exit(0);
});

app.listen(config.PORT, () => {
  logger.info(`Product service running on port ${config.PORT} in ${config.NODE_ENV} mode`);
});