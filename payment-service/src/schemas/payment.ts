import { z } from 'zod';
import mongoose from 'mongoose';

// Custom Zod validator for MongoDB ObjectId
const objectIdSchema = z.string().refine(
  (val) => mongoose.Types.ObjectId.isValid(val),
  { message: 'Invalid ObjectId format' }
);

export const paymentRequestSchema = z.object({
  customerId: objectIdSchema,
  orderId: objectIdSchema,
  productId: objectIdSchema,
  amount: z.number().positive('Amount must be greater than 0'),
  paymentMethod: z.string().optional().default('credit_card')
});

export type PaymentRequest = z.infer<typeof paymentRequestSchema>;