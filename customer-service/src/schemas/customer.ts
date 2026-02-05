import { z } from 'zod';
import mongoose from 'mongoose';

// Custom Zod validator for MongoDB ObjectId
const objectIdSchema = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId format',
  });

export const getCustomerByIdParamSchema = z.object({
  id: objectIdSchema,
});

export type GetCustomerByIdParam = z.infer<typeof getCustomerByIdParamSchema>;
