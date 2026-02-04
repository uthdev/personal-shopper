import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/productService';
import { ProductResponse, HealthResponse } from '../types/product';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  healthCheck = (_req: Request, res: Response): void => {
    const response: HealthResponse = {
      status: 'healthy',
      service: 'product-service',
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
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