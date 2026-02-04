import express from 'express';
import morgan from 'morgan';
import { config } from './config';
import logger from './utils/logger';
import Database from './database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import customerRoutes from './routes/customers';

const app = express();

// Initialize database connection
Database.getInstance().connect();

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
app.use('/', customerRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down customer service...');
  await Database.getInstance().disconnect();
  process.exit(0);
});

app.listen(config.PORT, () => {
  logger.info(
    `Customer service running on port ${config.PORT} in ${config.NODE_ENV} mode`
  );
});
