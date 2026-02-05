import axios from 'axios';
import { Order, OrderStatus } from '../models/Order';
import { CreateOrderRequest } from '../types/order';
import { config } from '../config';
import logger from '../utils/logger';

export class OrderService {
  private async validateCustomer(customerId: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${config.CUSTOMER_SERVICE_URL}/customers/${customerId}`,
        { timeout: config.HTTP_TIMEOUT }
      );
      return response.status === 200;
    } catch (error) {
      logger.error('Customer validation failed:', error);
      return false;
    }
  }

  private async validateProduct(productId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${config.PRODUCT_SERVICE_URL}/products/${productId}`,
        { timeout: config.HTTP_TIMEOUT }
      );
      return response.status === 200 ? response.data.data : null;
    } catch (error) {
      logger.error('Product validation failed:', error);
      return null;
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
    logger.info(`Order created: ${savedOrder.orderNumber}`);

    return {
      customerId: savedOrder.customerId.toString(),
      orderId: savedOrder._id.toString(),
      productId: savedOrder.items[0].productId.toString(),
      orderStatus: savedOrder.status as OrderStatus
    };
  }
}