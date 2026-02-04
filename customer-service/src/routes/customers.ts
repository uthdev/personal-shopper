import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';

const router: Router = Router();
const customerController = new CustomerController();

// Health check endpoint
router.get('/health', customerController.healthCheck);

// Get customer by ID
router.get('/customers/:id', customerController.getCustomerById);

export default router;