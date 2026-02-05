import { Request, Response, NextFunction } from 'express';
import { PaymentService } from '../services/paymentService';
import { PaymentRequest } from '../schemas/payment';
import { CustomError } from '../middleware/errorHandler';
import logger from '../logger';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  healthCheck = (_req: Request, res: Response): void => {
    logger.info('Health check requested');
    const response = {
      status: 'OK',
      service: 'payment-service',
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  };

  processPayment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paymentData: PaymentRequest = req.body;

      logger.info('Processing payment request', {
        customerId: paymentData.customerId,
        orderId: paymentData.orderId,
        amount: paymentData.amount,
      });

      const paymentResult = await this.paymentService.processPayment(paymentData);

      const response = {
        status: 'success',
        data: paymentResult,
      };

      logger.info('Payment processed successfully', {
        paymentId: paymentResult.paymentId,
        transactionId: paymentResult.transactionId,
        orderId: paymentData.orderId,
      });

      res.status(201).json(response);
    } catch (error) {
      logger.error('Payment processing error:', error);
      
      if (error instanceof CustomError) {
        next(error);
        return;
      }

      if (error instanceof Error) {
        next(new CustomError(error.message, 500));
        return;
      }

      next(new CustomError('Payment processing failed', 500));
    }
  };
}
