import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/orderService';
import { CreateOrderRequest } from '../schemas/order';
import { HealthResponse, OrderResponse } from '../types/order';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  healthCheck = (_req: Request, res: Response): void => {
    logger.info('Health check requested');
    const response: HealthResponse = {
      status: 'OK',
      service: 'order-service',
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
  };

  createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { customerId, productId, quantity }: CreateOrderRequest = req.body;

      const orderResult = await this.orderService.createOrder({
        customerId,
        productId,
        quantity
      });

      const response: OrderResponse = {
        status: 'success',
        data: orderResult
      };

      logger.info(`Order created successfully: ${orderResult.orderId}`);
      res.status(201).json(response);
    } catch (error) {
      logger.error('Error creating order:', error);
      
      if (error instanceof CustomError) {
        next(error);
        return;
      }

      if (error instanceof Error) {
        if (error.message === 'Customer not found') {
          next(new CustomError('Customer not found', 404));
          return;
        }
        if (error.message === 'Product not found') {
          next(new CustomError('Product not found', 404));
          return;
        }
      }

      next(new CustomError('Internal server error', 500));
    }
  };
}