import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { CustomerService } from '../services/customerService';
import { CustomerResponse, HealthResponse } from '../types/customer';
import { version } from '../../package.json';

const startTime = Date.now();

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  healthCheck = async (_req: Request, res: Response): Promise<void> => {
    try {
      const startLatency = Date.now();
      const dbHealthy = mongoose.connection.readyState === 1;
      const latency = Date.now() - startLatency;

      // Ping database for actual latency check
      if (dbHealthy) {
        await mongoose.connection.db?.admin().ping();
      }

      const response: HealthResponse = {
        status: dbHealthy ? 'OK' : 'ERROR',
        service: 'customer-service',
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
        service: 'customer-service',
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

  getCustomerById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const customer = await this.customerService.getCustomerById(id);

      const response: CustomerResponse = {
        status: 'success',
        data: {
          customerId: customer._id,
          name: `${customer.firstName} ${customer.lastName}`,
          email: customer.email,
          phone: customer.phone,
          createdAt: customer.createdAt,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}