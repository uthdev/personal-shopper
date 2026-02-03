import { Router, Request, Response } from 'express';
import RabbitMQConnection from '../rabbitmq';
import logger from '../logger';
import { validateBody } from '../middleware/validation';
import { paymentRequestSchema, PaymentRequest } from '../schemas/payment';
import { generateTransactionId } from '../utils/transactionId';

const router: Router = Router();

router.post('/payments', validateBody(paymentRequestSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, orderId, productId, amount, paymentMethod }: PaymentRequest = req.body;

    // Generate transaction ID in payment service
    const transactionId = generateTransactionId();

    logger.info('Processing payment request', { customerId, orderId, amount, transactionId });

    // Mock payment processing (always successful for demo)
    const paymentResult = {
      paymentId: `pay_${Date.now()}`,
      transactionId, // Include transaction ID in response
      status: 'success',
      amount,
      currency: 'USD',
      paymentMethod
    };

    // Publish transaction details to RabbitMQ with transaction ID
    const transactionMessage = {
      transactionId, // Include in message
      customerId,
      orderId,
      productId,
      amount,
      currency: 'USD',
      paymentMethod,
      timestamp: new Date()
    };

    const published = await RabbitMQConnection.getInstance().publishMessage(transactionMessage);

    if (!published) {
      logger.warn('Failed to publish transaction message', { orderId, transactionId });
      // Continue with response even if message publishing fails
    }

    logger.info('Payment processed successfully', { 
      paymentId: paymentResult.paymentId, 
      transactionId,
      orderId 
    });

    res.status(200).json({
      status: 'success',
      data: paymentResult,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    logger.error('Payment processing error:', error);
    throw error;
  }
});

export default router;