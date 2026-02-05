import request from 'supertest';
import express from 'express';
import { OrderController } from '../src/controllers/orderController';
import { OrderService } from '../src/services/orderService';
import { CustomError } from '../src/middleware/errorHandler';
import { validateBody } from '../src/middleware/validation';
import { createOrderRequestSchema } from '../src/schemas/order';
import { OrderStatus } from '../src/models/Order';

// Mock the OrderService
jest.mock('../src/services/orderService');
const MockedOrderService = OrderService as jest.MockedClass<typeof OrderService>;

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const app = express();
app.use(express.json());

const orderController = new OrderController();
app.get('/health', orderController.healthCheck);
app.post('/orders', validateBody(createOrderRequestSchema), orderController.createOrder);

// Add error handler middleware for testing
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

describe('OrderController', () => {
  let mockOrderService: jest.Mocked<OrderService>;

  beforeEach(() => {
    mockOrderService = new MockedOrderService() as jest.Mocked<OrderService>;
    (orderController as any).orderService = mockOrderService;
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('order-service');
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('POST /orders', () => {
    const validOrderData = {
      customerId: '507f1f77bcf86cd799439011',
      productId: '507f1f77bcf86cd799439012',
      quantity: 2,
    };

    const mockOrderResult = {
      customerId: '507f1f77bcf86cd799439011',
      orderId: '507f1f77bcf86cd799439013',
      productId: '507f1f77bcf86cd799439012',
      orderStatus: OrderStatus.PENDING,
    };

    it('should create order successfully', async () => {
      mockOrderService.createOrder.mockResolvedValue(mockOrderResult);

      const response = await request(app)
        .post('/orders')
        .send(validOrderData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.customerId).toBe(mockOrderResult.customerId);
      expect(response.body.data.orderId).toBe(mockOrderResult.orderId);
      expect(response.body.data.productId).toBe(mockOrderResult.productId);
      expect(response.body.data.orderStatus).toBe(OrderStatus.PENDING);
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(validOrderData);
      expect(mockOrderService.createOrder).toHaveBeenCalledTimes(1);
    });

    it('should create order with default quantity when not provided', async () => {
      const orderDataWithoutQuantity = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
      };

      mockOrderService.createOrder.mockResolvedValue(mockOrderResult);

      const response = await request(app)
        .post('/orders')
        .send(orderDataWithoutQuantity)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(mockOrderService.createOrder).toHaveBeenCalledWith({
        customerId: orderDataWithoutQuantity.customerId,
        productId: orderDataWithoutQuantity.productId,
        quantity: undefined,
      });
    });

    it('should return 400 when customerId is missing', async () => {
      const invalidData = {
        productId: '507f1f77bcf86cd799439012',
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.customerId).toBeDefined();
    });

    it('should return 400 when productId is missing', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.productId).toBeDefined();
    });

    it('should return 400 when customerId format is invalid', async () => {
      const invalidData = {
        customerId: 'invalid-id',
        productId: '507f1f77bcf86cd799439012',
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.customerId).toBe('Invalid ObjectId format');
    });

    it('should return 400 when productId format is invalid', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: 'invalid-id',
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.productId).toBe('Invalid ObjectId format');
    });

    it('should return 400 when quantity is zero', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        quantity: 0,
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.quantity).toBe('Quantity must be a positive integer');
    });

    it('should return 400 when quantity is negative', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        quantity: -5,
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.quantity).toBe('Quantity must be a positive integer');
    });

    it('should return 400 when quantity is not an integer', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        quantity: 2.5,
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.quantity).toBe('Quantity must be an integer');
    });

    it('should return 404 when customer not found', async () => {
      mockOrderService.createOrder.mockRejectedValue(
        new CustomError('Customer not found', 404)
      );

      const response = await request(app)
        .post('/orders')
        .send(validOrderData)
        .expect(404);

      expect(response.body.error).toBe('Customer not found');
    });

    it('should return 404 when product not found', async () => {
      mockOrderService.createOrder.mockRejectedValue(
        new CustomError('Product not found', 404)
      );

      const response = await request(app)
        .post('/orders')
        .send(validOrderData)
        .expect(404);

      expect(response.body.error).toBe('Product not found');
    });

    it('should return 500 for unexpected service errors', async () => {
      mockOrderService.createOrder.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/orders')
        .send(validOrderData)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle service throwing CustomError with 500 status', async () => {
      mockOrderService.createOrder.mockRejectedValue(
        new CustomError('Internal server error', 500)
      );

      const response = await request(app)
        .post('/orders')
        .send(validOrderData)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle order with minimum valid quantity', async () => {
      const minQuantityOrder = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        quantity: 1,
      };

      mockOrderService.createOrder.mockResolvedValue(mockOrderResult);

      const response = await request(app)
        .post('/orders')
        .send(minQuantityOrder)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(minQuantityOrder);
    });

    it('should handle order with large quantity', async () => {
      const largeQuantityOrder = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
        quantity: 999,
      };

      mockOrderService.createOrder.mockResolvedValue(mockOrderResult);

      const response = await request(app)
        .post('/orders')
        .send(largeQuantityOrder)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(largeQuantityOrder);
    });

    it('should return 400 when customerId format is too short', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd79943901',
        productId: '507f1f77bcf86cd799439012',
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.customerId).toBe('Invalid ObjectId format');
    });

    it('should return 400 when productId format is too short', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd79943901',
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.productId).toBe('Invalid ObjectId format');
    });

    it('should return 400 when customerId contains non-hex characters', async () => {
      const invalidData = {
        customerId: 'ZZZZZZZZZZZZZZZZZZZZZZZZ',
        productId: '507f1f77bcf86cd799439012',
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.customerId).toBe('Invalid ObjectId format');
    });

    it('should return 400 when productId contains non-hex characters', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: 'ZZZZZZZZZZZZZZZZZZZZZZZZ',
      };

      const response = await request(app)
        .post('/orders')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.productId).toBe('Invalid ObjectId format');
    });
  });

  describe('Payment Service Integration', () => {
    it('should create order and update status to CONFIRMED when payment succeeds', async () => {
      const validData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
      };

      mockOrderService.createOrder.mockResolvedValueOnce({
        _id: '507f1f77bcf86cd799439014',
        customerId: validData.customerId,
        productId: validData.productId,
        orderId: 'ORD-123',
        totalAmount: 100,
        status: OrderStatus.CONFIRMED,
        items: [
          {
            productId: validData.productId,
            productName: 'Test Product',
            price: 100,
            quantity: 1,
            subtotal: 100,
          },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/orders')
        .send(validData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.status).toBe(OrderStatus.CONFIRMED);
      expect(response.body.data.totalAmount).toBe(100);
      expect(mockOrderService.createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: validData.customerId,
          productId: validData.productId,
        })
      );
    });

    it('should create order with PENDING status when payment fails', async () => {
      const validData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
      };

      mockOrderService.createOrder.mockResolvedValueOnce({
        _id: '507f1f77bcf86cd799439014',
        customerId: validData.customerId,
        productId: validData.productId,
        orderId: 'ORD-124',
        totalAmount: 100,
        status: OrderStatus.PENDING,
        items: [
          {
            productId: validData.productId,
            productName: 'Test Product',
            price: 100,
            quantity: 1,
            subtotal: 100,
          },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/orders')
        .send(validData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.status).toBe(OrderStatus.PENDING);
      expect(response.body.data.totalAmount).toBe(100);
    });

    it('should return 400 when payment service call fails due to customer validation error', async () => {
      const validData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
      };

      mockOrderService.createOrder.mockRejectedValueOnce(
        new CustomError('Customer not found', 404)
      );

      const response = await request(app)
        .post('/orders')
        .send(validData)
        .expect(404);

      expect(response.body.error).toBe('Customer not found');
    });

    it('should return 400 when payment service call fails due to product validation error', async () => {
      const validData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
      };

      mockOrderService.createOrder.mockRejectedValueOnce(
        new CustomError('Product not found', 404)
      );

      const response = await request(app)
        .post('/orders')
        .send(validData)
        .expect(404);

      expect(response.body.error).toBe('Product not found');
    });

    it('should handle payment service timeout gracefully by creating order with PENDING status', async () => {
      const validData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439012',
      };

      // Even with timeout, order should be created with PENDING status
      mockOrderService.createOrder.mockResolvedValueOnce({
        _id: '507f1f77bcf86cd799439014',
        customerId: validData.customerId,
        productId: validData.productId,
        orderId: 'ORD-125',
        totalAmount: 100,
        status: OrderStatus.PENDING,
        items: [
          {
            productId: validData.productId,
            productName: 'Test Product',
            price: 100,
            quantity: 1,
            subtotal: 100,
          },
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const response = await request(app)
        .post('/orders')
        .send(validData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.status).toBe(OrderStatus.PENDING);
    });
  });
});