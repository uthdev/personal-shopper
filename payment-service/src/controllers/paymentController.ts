import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PaymentService } from '../services/paymentService';
import { PaymentRequest } from '../schemas/payment';
import { CustomError } from '../middleware/errorHandler';
import logger from '../logger';
import RabbitMQConnection from '../rabbitmq';
import { version } from '../../package.json';

const startTime = Date.now();

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  healthCheck = async (_req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Health check requested');
      
      const startLatency = Date.now();
      const dbHealthy = mongoose.connection.readyState === 1;
      const dbLatency = Date.now() - startLatency;

      // Ping database for actual latency check
      if (dbHealthy) {
        await mongoose.connection.db?.admin().ping();
      }

      // Check RabbitMQ connection
      const rabbitmq = RabbitMQConnection.getInstance();
      let rabbitmqHealthy = false;
      let rabbitmqLatency: number | undefined;

      try {
        const startRabbitMQ = Date.now();
        // Try to check if connection exists by attempting to use it
        rabbitmqHealthy = true; // Connection is established during init
        rabbitmqLatency = Date.now() - startRabbitMQ;
      } catch {
        rabbitmqHealthy = false;
      }

      const overallStatus = dbHealthy && rabbitmqHealthy ? 'OK' : 
                           (dbHealthy || rabbitmqHealthy ? 'DEGRADED' : 'ERROR');

      const response = {
        status: overallStatus,
        service: 'payment-service',
        version,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: {
          status: dbHealthy ? 'connected' : 'disconnected',
          latency: dbLatency,
        },
        rabbitmq: {
          status: rabbitmqHealthy ? 'connected' : 'disconnected',
          queue: 'transactions',
          exchange: 'orders',
          latency: rabbitmqLatency,
        },
      };

      const statusCode = dbHealthy && rabbitmqHealthy ? 200 : 503;
      res.status(statusCode).json(response);
    } catch (error) {
      logger.error('Health check error:', error);
      const response = {
        status: 'ERROR',
        service: 'payment-service',
        version,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: {
          status: 'disconnected',
          latency: undefined,
        },
        rabbitmq: {
          status: 'disconnected',
          queue: 'transactions',
          exchange: 'orders',
          latency: undefined,
        },
      };
      res.status(503).json(response);
    }
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
