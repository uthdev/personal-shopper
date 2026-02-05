import { z } from 'zod';
import mongoose from 'mongoose';
import { TransactionStatus, TransactionType } from '../models/Transaction';

// Custom MongoDB ObjectId validator
const objectIdValidator = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

export const transactionMessageSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  customerId: objectIdValidator,
  orderId: objectIdValidator,
  productId: objectIdValidator,
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.string().optional().default('USD'),
  paymentMethod: z.string().optional().default('credit_card'),
  timestamp: z.coerce.date(),
});

export const transactionSaveSchema = z.object({
  transactionId: z.string().min(1, 'Transaction ID is required'),
  customerId: objectIdValidator,
  orderId: objectIdValidator,
  productId: objectIdValidator,
  amount: z.number().positive('Amount must be a positive number'),
  currency: z.string().toUpperCase().default('USD'),
  status: z.enum(Object.values(TransactionStatus) as [string, ...string[]]).default(TransactionStatus.COMPLETED),
  type: z.enum(Object.values(TransactionType) as [string, ...string[]]).default(TransactionType.PAYMENT),
  paymentMethod: z.string().trim().toLowerCase().default('credit_card'),
  paymentGateway: z.string().trim().toLowerCase().default('stripe'),
  gatewayTransactionId: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

export type TransactionMessage = z.infer<typeof transactionMessageSchema>;
export type TransactionSaveData = z.infer<typeof transactionSaveSchema>;
