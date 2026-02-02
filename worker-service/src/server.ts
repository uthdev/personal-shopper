import { config } from './config';

console.log(`Worker service starting in ${config.NODE_ENV} mode...`);
console.log(`Connected to RabbitMQ: ${config.RABBITMQ_URL}`);
console.log(`Listening to queue: ${config.RABBITMQ_QUEUE}`);

// Worker service will consume RabbitMQ messages
// Implementation will be added in later issues

process.on('SIGINT', () => {
  console.log('Worker service shutting down...');
  process.exit(0);
});