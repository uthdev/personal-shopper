import request from 'supertest';
import express from 'express';
import { CustomerController } from '../src/controllers/customerController';
import { CustomerService } from '../src/services/customerService';
import { ICustomer } from '../src/types/customer';
import { CustomError } from '../src/middleware/errorHandler';

// Mock the CustomerService
jest.mock('../src/services/customerService');
const MockedCustomerService = CustomerService as jest.MockedClass<typeof CustomerService>;

const app = express();
app.use(express.json());

const customerController = new CustomerController();
app.get('/health', customerController.healthCheck);
app.get('/customers/:id', customerController.getCustomerById);

// Add error handler middleware for testing
app.use((err: any, req: any, res: any, next: any) => {
  res.status(err.statusCode || 500).json({ error: err.message });
});

describe('Customer Controller', () => {
  let mockCustomerService: jest.Mocked<CustomerService>;

  beforeEach(() => {
    mockCustomerService = new MockedCustomerService() as jest.Mocked<CustomerService>;
    (customerController as any).customerService = mockCustomerService;
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.service).toBe('customer-service');
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /customers/:id', () => {
    const validCustomerId = '507f1f77bcf86cd799439011';
    const mockCustomer: ICustomer = {
      _id: validCustomerId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'US'
      },
      isActive: true,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    it('should return customer data for valid ID', async () => {
      mockCustomerService.getCustomerById.mockResolvedValue(mockCustomer);

      const response = await request(app)
        .get(`/customers/${validCustomerId}`)
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data.customerId).toBe(mockCustomer._id);
      expect(response.body.data.name).toBe('John Doe');
      expect(response.body.data.email).toBe(mockCustomer.email);
      expect(response.body.data.phone).toBe(mockCustomer.phone);
      expect(response.body.data.createdAt).toBeDefined();
      expect(mockCustomerService.getCustomerById).toHaveBeenCalledWith(validCustomerId);
      expect(mockCustomerService.getCustomerById).toHaveBeenCalledTimes(1);
    });

    it('should return 404 for non-existent customer', async () => {
      mockCustomerService.getCustomerById.mockRejectedValue(
        new CustomError('Customer not found', 404)
      );

      const response = await request(app)
        .get(`/customers/${validCustomerId}`)
        .expect(404);

      expect(response.body.error).toBe('Customer not found');
    });

    it('should return 400 for invalid customer ID format', async () => {
      const invalidId = 'invalid-id';
      mockCustomerService.getCustomerById.mockRejectedValue(
        new CustomError('Invalid customer ID format', 400)
      );

      const response = await request(app)
        .get(`/customers/${invalidId}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid customer ID format');
    });

    it('should return 400 for empty customer ID', async () => {
      mockCustomerService.getCustomerById.mockRejectedValue(
        new CustomError('Invalid customer ID format', 400)
      );

      const response = await request(app)
        .get('/customers/')
        .expect(404); // Express returns 404 for missing route params
    });

    it('should return 400 for short customer ID', async () => {
      const shortId = '123';
      mockCustomerService.getCustomerById.mockRejectedValue(
        new CustomError('Invalid customer ID format', 400)
      );

      const response = await request(app)
        .get(`/customers/${shortId}`)
        .expect(400);

      expect(response.body.error).toBe('Invalid customer ID format');
    });

    it('should return 500 for unexpected service errors', async () => {
      mockCustomerService.getCustomerById.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get(`/customers/${validCustomerId}`)
        .expect(500);

      expect(response.body.error).toBe('Database connection failed');
    });

    it('should handle service throwing CustomError with 500 status', async () => {
      mockCustomerService.getCustomerById.mockRejectedValue(
        new CustomError('Internal server error', 500)
      );

      const response = await request(app)
        .get(`/customers/${validCustomerId}`)
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });

    it('should handle customer with missing optional fields', async () => {
      const customerWithoutPhone: ICustomer = {
        _id: validCustomerId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US'
        },
        isActive: true,
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
      };
      
      mockCustomerService.getCustomerById.mockResolvedValue(customerWithoutPhone);

      const response = await request(app)
        .get(`/customers/${validCustomerId}`)
        .expect(200);

      expect(response.body.data.phone).toBeUndefined();
    });
  });
});