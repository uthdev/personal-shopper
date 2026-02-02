import express from 'express';
import { config } from './config';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'order-service',
    environment: config.NODE_ENV,
    port: config.PORT
  });
});

app.listen(config.PORT, () => {
  console.log(`Order service running on port ${config.PORT} in ${config.NODE_ENV} mode`);
});