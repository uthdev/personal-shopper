import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  DB_NAME: z.string().min(1, 'DB_NAME is required'),
  RABBITMQ_URL: z.string().min(1, 'RABBITMQ_URL is required'),
  RABBITMQ_QUEUE: z.string().min(1, 'RABBITMQ_QUEUE is required'),
  RABBITMQ_EXCHANGE: z.string().min(1, 'RABBITMQ_EXCHANGE is required'),
});

function validateEnv() {
  try {
    const env = envSchema.parse(process.env);
    console.log('Worker service environment variables validated successfully');
    return env;
  } catch (error) {
    console.error('Worker service environment validation failed:', error);
    process.exit(1);
  }
}

export const config = validateEnv();
export type Config = z.infer<typeof envSchema>;
