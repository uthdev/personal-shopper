import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { validateBody } from '../middleware/validation';
import { createOrderRequestSchema } from '../schemas/order';

const router: Router = Router();
const orderController = new OrderController();

router.get('/health', orderController.healthCheck);
router.post('/orders', validateBody(createOrderRequestSchema), orderController.createOrder);

export default router;