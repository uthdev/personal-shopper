import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { validateParams } from '../middleware/validation';
import { getCustomerByIdParamSchema } from '../schemas/customer';

const router: Router = Router();
const customerController = new CustomerController();

// Health check endpoint
router.get('/health', customerController.healthCheck);

// Get customer by ID
router.get('/customers/:id', validateParams(getCustomerByIdParamSchema), customerController.getCustomerById);

export default router;