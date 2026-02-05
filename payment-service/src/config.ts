import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default('3004'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required').optional().default('mongodb://localhost:27017/payment_db'),
  DB_NAME: z.string().min(1, 'DB_NAME is required').optional().default('payment_db'),
  CUSTOMER_SERVICE_URL: z
    .string()
    .url('CUSTOMER_SERVICE_URL must be a valid URL')
    .optional()
    .default('http://localhost:3001'),
  PRODUCT_SERVICE_URL: z
    .string()
    .url('PRODUCT_SERVICE_URL must be a valid URL')
    .optional()
    .default('http://localhost:3002'),
  ORDER_SERVICE_URL: z.string().url('ORDER_SERVICE_URL must be a valid URL').optional().default('http://localhost:3003'),
  RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required').optional().default('amqp://guest:guest@localhost:5672'),
  RABBITMQ_QUEUE: z.string().min(1, 'RABBITMQ_QUEUE is required').optional().default('transactions'),
  RABBITMQ_EXCHANGE: z.string().min(1, 'RABBITMQ_EXCHANGE is required').optional().default('orders'),
});

function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    console.log('Payment service environment variables validated successfully');
    return env;
  } catch (error) {
    console.error('Payment service environment validation failed:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    // Return defaults for test environment
    return {
      PORT: 3004,
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://localhost:27017/payment_db',
      DB_NAME: 'payment_db',
      CUSTOMER_SERVICE_URL: 'http://localhost:3001',
      PRODUCT_SERVICE_URL: 'http://localhost:3002',
      ORDER_SERVICE_URL: 'http://localhost:3003',
      RABBITMQ_URL: 'amqp://guest:guest@localhost:5672',
      RABBITMQ_QUEUE: 'transactions',
      RABBITMQ_EXCHANGE: 'orders',
    };
  }
}

export const config = validateEnv();
export type Config = z.infer<typeof envSchema>;
