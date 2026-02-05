import RabbitMQConnection, { TransactionMessage } from '../rabbitmq';
import logger from '../logger';
import { PaymentRequest } from '../schemas/payment';
import { generateTransactionId } from '../utils/transactionId';

export interface PaymentResult {
  paymentId: string;
  transactionId: string;
  customerId: string;
  orderId: string;
  productId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  timestamp: Date;
}

export class PaymentService {
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResult> {
    const { customerId, orderId, productId, amount, paymentMethod } = paymentData;

    // Generate transaction ID
    const transactionId = generateTransactionId();
    const paymentId = `pay_${Date.now()}`;

    // Mock payment processing (always successful for demo)
    const paymentResult: PaymentResult = {
      paymentId,
      transactionId,
      customerId,
      orderId,
      productId,
      amount,
      currency: 'USD',
      paymentMethod: paymentMethod || 'credit_card',
      paymentStatus: 'success',
      timestamp: new Date(),
    };

    // Publish transaction details to RabbitMQ
    const transactionMessage: TransactionMessage = {
      transactionId,
      customerId,
      orderId,
      productId,
      amount,
      currency: 'USD',
      paymentMethod: paymentMethod || 'credit_card',
      timestamp: new Date(),
    };

    try {
      const published = await RabbitMQConnection.getInstance().publishMessage(
        transactionMessage
      );

      if (!published) {
        logger.warn('Failed to publish transaction message to RabbitMQ', {
          orderId,
          transactionId,
        });
        // Continue with response even if message publishing fails
      } else {
        logger.info('Transaction message published to RabbitMQ', {
          transactionId,
          orderId,
        });
      }
    } catch (error) {
      logger.error('Error publishing to RabbitMQ:', error);
      // Continue with response even if message publishing fails
    }

    return paymentResult;
  }
}
