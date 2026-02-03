import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';

export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      const errors: Record<string, string> = {};

      // Convert string[] to string for each field
      Object.keys(fieldErrors).forEach((key) => {
        const errorArray = fieldErrors[key];
        if (errorArray && errorArray.length > 0) {
          errors[key] = errorArray[0]; // Take first error message
        }
      });

      return res.status(400).json({
        message: 'Invalid input',
        errors,
      });
    }
    req.body = validation.data;
    return next();
  };
};
