import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { ProductService } from '../services/productService';
import { ProductResponse, HealthResponse } from '../types/product';
import { version } from '../../package.json';

const startTime = Date.now();

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
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
        service: 'product-service',
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
        service: 'product-service',
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

  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(id);

      const response: ProductResponse = {
        status: 'success',
        data: {
          productId: product._id,
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          stock: product.stock,
          isActive: product.isActive,
          createdAt: product.createdAt,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}