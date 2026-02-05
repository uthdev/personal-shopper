import request from 'supertest';
import express from 'express';
import { PaymentController } from '../src/controllers/paymentController';
import { validateBody } from '../src/middleware/validation';
import { paymentRequestSchema } from '../src/schemas/payment';

// Mock RabbitMQ
jest.mock('../src/rabbitmq', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      publishMessage: jest.fn().mockResolvedValue(true),
      close: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

// Mock Database
jest.mock('../src/database', () => ({
  __esModule: true,
  default: {
    getInstance: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
    })),
  },
}));

// Mock logger
jest.mock('../src/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const app = express();
app.use(express.json());

const paymentController = new PaymentController();
app.get('/health', paymentController.healthCheck);
app.post('/payments', validateBody(paymentRequestSchema), paymentController.processPayment);

// Add error handler middleware for testing
app.use((err: any, _req: any, res: any, _next: any) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

describe('Payment Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body.service).toBe('payment-service');
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('POST /payments', () => {
    const validPaymentData = {
      customerId: '507f1f77bcf86cd799439011',
      orderId: '507f1f77bcf86cd799439012',
      productId: '507f1f77bcf86cd799439013',
      amount: 99.99,
      paymentMethod: 'credit_card',
    };

    it('should process payment successfully', async () => {
      const response = await request(app)
        .post('/payments')
        .send(validPaymentData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.paymentStatus).toBe('success');
      expect(response.body.data.customerId).toBe(validPaymentData.customerId);
      expect(response.body.data.orderId).toBe(validPaymentData.orderId);
      expect(response.body.data.productId).toBe(validPaymentData.productId);
      expect(response.body.data.amount).toBe(validPaymentData.amount);
      expect(response.body.data.paymentId).toBeDefined();
      expect(response.body.data.transactionId).toBeDefined();
      expect(response.body.data.timestamp).toBeDefined();
    });

    it('should process payment with default payment method', async () => {
      const paymentDataWithoutMethod = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
      };

      const response = await request(app)
        .post('/payments')
        .send(paymentDataWithoutMethod)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.paymentMethod).toBe('credit_card');
    });

    it('should return 400 when customerId is missing', async () => {
      const invalidData = {
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
      };

      const response = await request(app)
        .post('/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.customerId).toBeDefined();
    });

    it('should return 400 when orderId is missing', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
      };

      const response = await request(app)
        .post('/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.orderId).toBeDefined();
    });

    it('should return 400 when productId is missing', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        amount: 99.99,
      };

      const response = await request(app)
        .post('/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.productId).toBeDefined();
    });

    it('should return 400 when amount is missing', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
      };

      const response = await request(app)
        .post('/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.amount).toBeDefined();
    });

    it('should return 400 when customerId format is invalid', async () => {
      const invalidData = {
        customerId: 'invalid-id',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
      };

      const response = await request(app)
        .post('/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.customerId).toBe('Invalid ObjectId format');
    });

    it('should return 400 when orderId format is invalid', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: 'invalid-id',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
      };

      const response = await request(app)
        .post('/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.orderId).toBe('Invalid ObjectId format');
    });

    it('should return 400 when productId format is invalid', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: 'invalid-id',
        amount: 99.99,
      };

      const response = await request(app)
        .post('/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.productId).toBe('Invalid ObjectId format');
    });

    it('should return 400 when amount is zero', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 0,
      };

      const response = await request(app)
        .post('/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.amount).toBe('Amount must be greater than 0');
    });

    it('should return 400 when amount is negative', async () => {
      const invalidData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: -50,
      };

      const response = await request(app)
        .post('/payments')
        .send(invalidData)
        .expect(400);

      expect(response.body.message).toBe('Invalid input');
      expect(response.body.errors.amount).toBe('Amount must be greater than 0');
    });

    it('should handle payment with custom payment method', async () => {
      const paymentDataWithCustomMethod = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
        paymentMethod: 'paypal',
      };

      const response = await request(app)
        .post('/payments')
        .send(paymentDataWithCustomMethod)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.paymentMethod).toBe('paypal');
    });

    it('should handle large amounts', async () => {
      const largeAmountData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 99999.99,
      };

      const response = await request(app)
        .post('/payments')
        .send(largeAmountData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.amount).toBe(99999.99);
    });

    it('should handle decimal amounts', async () => {
      const decimalAmountData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 19.99,
      };

      const response = await request(app)
        .post('/payments')
        .send(decimalAmountData)
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data.amount).toBe(19.99);
    });
  });
});

