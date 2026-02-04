import { Request, Response, NextFunction } from 'express';
import { CustomerService } from '../services/customerService';
import { CustomerResponse, HealthResponse } from '../types/customer';

export class CustomerController {
  private customerService: CustomerService;

  constructor() {
    this.customerService = new CustomerService();
  }

  healthCheck = (_req: Request, res: Response): void => {
    const response: HealthResponse = {
      status: 'healthy',
      service: 'customer-service',
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(response);
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