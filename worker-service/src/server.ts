import dotenv from 'dotenv';

dotenv.config();

console.log('Worker service starting...');

// Worker service will consume RabbitMQ messages
// Implementation will be added in later issues

process.on('SIGINT', () => {
  console.log('Worker service shutting down...');
  process.exit(0);
});