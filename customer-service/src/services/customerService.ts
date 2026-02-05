import { Customer } from '../models/Customer';
import { CustomError } from '../middleware/errorHandler';
import { ICustomer } from '../types/customer';
import logger from '../utils/logger';

export class CustomerService {
  async getCustomerById(id: string): Promise<ICustomer> {

    const customer = await Customer.findById(id);

    if (!customer) {
      throw new CustomError('Customer not found', 404);
    }

    logger.info(`Customer retrieved: ${id}`);
    return customer.toObject();
  }
}