import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { OrderService } from '../services/orderService';
import { CreateOrderRequest } from '../schemas/order';
import { HealthResponse, OrderResponse } from '../types/order';
import { CustomError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { version } from '../../package.json';

const startTime = Date.now();

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  healthCheck = async (_req: Request, res: Response): Promise<void> => {
    try {
      logger.info('Health check requested');
      const startLatency = Date.now();
      const dbHealthy = mongoose.connection.readyState === 1;
      const latency = Date.now() - startLatency;

      // Ping database for actual latency check
      if (dbHealthy) {
        await mongoose.connection.db?.admin().ping();
      }

      const response: HealthResponse = {
        status: dbHealthy ? 'OK' : 'ERROR',
        service: 'order-service',
        version,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: {
          status: dbHealthy ? 'connected' : 'disconnected',
          latency: latency,
        },
      };

      const statusCode = dbHealthy ? 200 : 503;
      res.status(statusCode).json(response);
    } catch (error) {
      const response: HealthResponse = {
        status: 'ERROR',
        service: 'order-service',
        version,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        database: {
          status: 'disconnected',
          latency: undefined,
        },
      };
      res.status(503).json(response);
    }
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