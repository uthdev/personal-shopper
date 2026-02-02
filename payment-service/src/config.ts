import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default('3004'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  CUSTOMER_SERVICE_URL: z.string().url('CUSTOMER_SERVICE_URL must be a valid URL'),
  PRODUCT_SERVICE_URL: z.string().url('PRODUCT_SERVICE_URL must be a valid URL'),
  ORDER_SERVICE_URL: z.string().url('ORDER_SERVICE_URL must be a valid URL'),
  RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),
  RABBITMQ_QUEUE: z.string().min(1, 'RABBITMQ_QUEUE is required'),
  RABBITMQ_EXCHANGE: z.string().min(1, 'RABBITMQ_EXCHANGE is required')
});

function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    console.log('Payment service environment variables validated successfully');
    return env;
  } catch (error) {
    console.error('Payment service environment validation failed:', error);
    process.exit(1);
  }
}

export const config = validateEnv();
export type Config = z.infer<typeof envSchema>;