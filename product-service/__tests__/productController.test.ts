import request from 'supertest';
import express from 'express';
import { ProductController } from '../src/controllers/productController';
import { ProductService } from '../src/services/productService';
import { IProduct } from '../src/types/product';
import { CustomError } from '../src/middleware/errorHandler';
import { validateParams } from '../src/middleware/validation';
import { getProductByIdParamSchema } from '../src/schemas/product';

// Mock the ProductService
jest.mock('../src/services/productService');
const MockedProductService = ProductService as jest.MockedClass<typeof ProductService>;

const app = express();
app.use(express.json());

const productController = new ProductController();
app.get('/health', productController.healthCheck);
app.get('/products/:id', validateParams(getProductByIdParamSchema), productController.getProductById);

// Add error handler middleware for testing
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

describe('Product Controller', () => {
  let mockProductService: jest.Mocked<ProductService>;

  beforeEach(() => {
    mockProductService = new MockedProductService() as jest.Mocked<ProductService>;
    (productController as any).productService = mockProductService;
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('product-service');
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /products/:id', () => {
    const validProductId = '507f1f77bcf86cd799439011';
    const mockProduct: IProduct = {
      _id: validProductId,
      name: 'Test Product',
      description: 'A test product description',
      price: 99.99,
      category: 'Electronics',
      stock: 10,
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    it('should return product data for valid ID', async () => {
      mockProductService.getProductById.mockResolvedValue(mockProduct);

      const response = await request(app)
        .get(`/products/${validProductId}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.productId).toBe(mockProduct._id);
      expect(response.body.data.name).toBe(mockProduct.name);
      expect(response.body.data.description).toBe(mockProduct.description);
      expect(response.body.data.price).toBe(mockProduct.price);
      expect(response.body.data.category).toBe(mockProduct.category);
      expect(response.body.data.stock).toBe(mockProduct.stock);
      expect(response.body.data.isActive).toBe(mockProduct.isActive);
      expect(response.body.data.createdAt).toBeDefined();
      expect(mockProductService.getProductById).toHaveBeenCalledWith(validProductId);
      expect(mockProductService.getProductById).toHaveBeenCalledTimes(1);
    });

    it('should return 404 for non-existent product', async () => {
      mockProductService.getProductById.mockRejectedValue(
        new CustomError('Product not found', 404)
      );

      const response = await request(app)
        .get(`/products/${validProductId}`)
        .expect(404);

      expect(response.body.error).toBe('Product not found');
    });

    it('should return 404 for inactive product', async () => {
      mockProductService.getProductById.mockRejectedValue(
        new CustomError('Product is not available', 404)
      );

      const response = await request(app)
        .get(`/products/${validProductId}`)
        .expect(404);

      expect(response.body.error).toBe('Product is not available');
    });

    it('should return 400 for invalid product ID format', async () => {
      const invalidId = 'invalid-id';

      const response = await request(app)
        .get(`/products/${invalidId}`)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.id).toBe('Invalid ObjectId format');
    });

    it('should return 400 for short product ID', async () => {
      const shortId = '123';

      const response = await request(app)
        .get(`/products/${shortId}`)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.id).toBe('Invalid ObjectId format');
    });

    it('should return 500 for unexpected service errors', async () => {
      mockProductService.getProductById.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get(`/products/${validProductId}`)
        .expect(500);

      expect(response.body.error).toBe('Database connection failed');
    });

    it('should handle service throwing CustomError with 500 status', async () => {
      mockProductService.getProductById.mockRejectedValue(
        new CustomError('Internal server error', 500)
      );

      const response = await request(app)
        .get(`/products/${validProductId}`)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle product with zero stock', async () => {
      const outOfStockProduct: IProduct = {
        ...mockProduct,
        stock: 0,
      };
      
      mockProductService.getProductById.mockResolvedValue(outOfStockProduct);

      const response = await request(app)
        .get(`/products/${validProductId}`)
        .expect(200);

      expect(response.body.data.stock).toBe(0);
    });
  });
});