import { Order, OrderStatus } from '../models/Order';
import { CreateOrderRequest } from '../types/order';
import { config } from '../config';
import logger from '../utils/logger';
import { HttpClient } from '../utils/httpClient';

export class OrderService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient({
      timeout: config.HTTP_TIMEOUT,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
      },
    });
  }

  private async validateCustomer(customerId: string): Promise<boolean> {
    try {
      await this.httpClient.get(
        `${config.CUSTOMER_SERVICE_URL}/customers/${customerId}`
      );
      return true;
    } catch (error) {
      logger.error('Customer validation failed:', error);
      return false;
    }
  }

  private async validateProduct(productId: string): Promise<any> {
    try {
      const response = await this.httpClient.get<any>(
        `${config.PRODUCT_SERVICE_URL}/products/${productId}`
      );
      return response.data || null;
    } catch (error) {
      logger.error('Product validation failed:', error);
      return null;
    }
  }

  private async processPayment(
    customerId: string,
    orderId: string,
    productId: string,
    amount: number
  ): Promise<boolean> {
    try {
      logger.info('Processing payment for order', {
        orderId,
        customerId,
        amount,
      });

      const paymentResponse = await this.httpClient.post<any>(
        `${config.PAYMENT_SERVICE_URL}/payments`,
        {
          customerId,
          orderId,
          productId,
          amount,
          paymentMethod: 'credit_card',
        }
      );

      const isSuccess = paymentResponse.paymentStatus === 'success';
      if (isSuccess) {
        logger.info('Payment processed successfully', { orderId });
      } else {
        logger.warn('Payment processing failed', {
          orderId,
          status: paymentResponse.paymentStatus,
        });
      }

      return isSuccess;
    } catch (error) {
      logger.error('Payment processing error:', {
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new Error('Payment processing failed');
    }
  }

  async createOrder(orderData: CreateOrderRequest) {
    const { customerId, productId, quantity = 1 } = orderData;

    // Validate customer exists
    const customerExists = await this.validateCustomer(customerId);
    if (!customerExists) {
      throw new Error('Customer not found');
    }

    // Validate product exists and get details
    const product = await this.validateProduct(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Create order
    const subtotal = product.price * quantity;
    const order = new Order({
      customerId,
      items: [{
        productId,
        productName: product.name,
        price: product.price,
        quantity,
        subtotal
      }],
      totalAmount: subtotal,
      status: OrderStatus.PENDING,
      shippingAddress: {
        street: 'Default Street',
        city: 'Default City',
        state: 'Default State',
        zipCode: '00000',
        country: 'US'
      }
    });

    const savedOrder = await order.save();
    const orderId = savedOrder._id.toString();

    // Process payment
    try {
      const paymentSuccess = await this.processPayment(
        customerId,
        orderId,
        productId,
        subtotal
      );

      if (paymentSuccess) {
        // Update order status to confirmed
        savedOrder.status = OrderStatus.CONFIRMED;
        await savedOrder.save();
        logger.info(`Order confirmed: ${savedOrder.orderNumber}`);
      } else {
        // Payment failed, keep order as pending
        logger.warn(`Payment failed for order: ${orderId}`);
      }
    } catch (error) {
      // Payment error occurred, log but keep order created
      logger.error(`Payment error for order ${orderId}:`, error);
      // Order remains in PENDING status
    }

    logger.info(`Order created: ${savedOrder.orderNumber}`);

    return {
      customerId: savedOrder.customerId.toString(),
      orderId: orderId,
      productId: savedOrder.items[0].productId.toString(),
      orderStatus: savedOrder.status as OrderStatus
    };
  }
}