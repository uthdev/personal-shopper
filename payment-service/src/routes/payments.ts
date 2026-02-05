import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { validateBody } from '../middleware/validation';
import { paymentRequestSchema } from '../schemas/payment';

const router: Router = Router();
const paymentController = new PaymentController();

router.get('/health', paymentController.healthCheck);
router.post(
  '/payments',
  validateBody(paymentRequestSchema),
  paymentController.processPayment
);

export default router;
