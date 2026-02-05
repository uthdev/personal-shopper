import { z } from 'zod';
import mongoose from 'mongoose';

// Custom Zod validator for MongoDB ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

export const createOrderRequestSchema = z.object({
  customerId: objectIdSchema,
  productId: objectIdSchema,
  quantity: z.number().positive('Quantity must be a positive integer').int('Quantity must be an integer').optional(),
});

export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>;
