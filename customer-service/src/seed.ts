import { Customer } from './models/Customer';
import Database from './database';
import logger from './utils/logger';

const customerData = [
  {
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-0101',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'US',
    },
    isActive: true,
  },
  {
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1-555-0102',
    address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90210',
      country: 'US',
    },
    isActive: true,
  },
  {
    email: 'bob.johnson@example.com',
    firstName: 'Bob',
    lastName: 'Johnson',
    phone: '+1-555-0103',
    address: {
      street: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'US',
    },
    isActive: true,
  },
];

async function seedCustomers(): Promise<void> {
  try {
    logger.info('Starting customer seeding...');
    const db = Database.getInstance();
    await db.connect();
    await Customer.deleteMany({});
    const customers = await Customer.insertMany(customerData);
    logger.info(`Seeded ${customers.length} customers successfully`);
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding customers:', error);
    process.exit(1);
  }
}

seedCustomers();