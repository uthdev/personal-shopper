import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required').optional().default('mongodb://localhost:27017/customer_db'),
  DB_NAME: z.string().min(1, 'DB_NAME is required').optional().default('customer_db'),
  PRODUCT_SERVICE_URL: z
    .string()
    .url('PRODUCT_SERVICE_URL must be a valid URL')
    .optional()
    .default('http://localhost:3002'),
  ORDER_SERVICE_URL: z.string().url('ORDER_SERVICE_URL must be a valid URL').optional().default('http://localhost:3003'),
  PAYMENT_SERVICE_URL: z
    .string()
    .url('PAYMENT_SERVICE_URL must be a valid URL')
    .optional()
    .default('http://localhost:3004'),
});

function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    console.log(
      'Customer service environment variables validated successfully'
    );
    return env;
  } catch (error) {
    console.error('Customer service environment validation failed:', error);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    // Return defaults for test environment
    return {
      PORT: 3001,
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://localhost:27017/customer_db',
      DB_NAME: 'customer_db',
      PRODUCT_SERVICE_URL: 'http://localhost:3002',
      ORDER_SERVICE_URL: 'http://localhost:3003',
      PAYMENT_SERVICE_URL: 'http://localhost:3004',
    };
  }
}

export const config = validateEnv();
export type Config = z.infer<typeof envSchema>;
