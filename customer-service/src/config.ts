import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().transform(Number).default('3001'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  PRODUCT_SERVICE_URL: z
    .string()
    .url('PRODUCT_SERVICE_URL must be a valid URL'),
  ORDER_SERVICE_URL: z.string().url('ORDER_SERVICE_URL must be a valid URL'),
  PAYMENT_SERVICE_URL: z
    .string()
    .url('PAYMENT_SERVICE_URL must be a valid URL'),
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
    process.exit(1);
  }
}

export const config = validateEnv();
export type Config = z.infer<typeof envSchema>;
