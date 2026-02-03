import amqp from 'amqplib';
import { config } from './config';
import logger from './logger';
import { Transaction } from './models/Transaction';

export interface TransactionMessage {
  transactionId: string; // Added transaction ID
  customerId: string;
  orderId: string;
  productId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  timestamp: Date;
}

class RabbitMQConsumer {
  private static instance: RabbitMQConsumer;
  private connection: any = null;
  private channel: any = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  private constructor() {}

  public static getInstance(): RabbitMQConsumer {
    if (!RabbitMQConsumer.instance) {
      RabbitMQConsumer.instance = new RabbitMQConsumer();
    }
    return RabbitMQConsumer.instance;
  }

  public async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;

    try {
      logger.info('Connecting to RabbitMQ...');

      this.connection = await amqp.connect(config.RABBITMQ_URL);
      if (!this.connection) {
        throw new Error('Failed to establish connection');
      }

      this.channel = await this.connection.createChannel();
      if (!this.channel) {
        throw new Error('Failed to create channel');
      }

      // Assert exchange and queue
      await this.channel.assertExchange(config.RABBITMQ_EXCHANGE, 'direct', {
        durable: true,
      });
      await this.channel.assertQueue(config.RABBITMQ_QUEUE, { durable: true });
      await this.channel.bindQueue(
        config.RABBITMQ_QUEUE,
        config.RABBITMQ_EXCHANGE,
        'transaction'
      );

      // Set prefetch to process one message at a time
      await this.channel.prefetch(1);

      // Connection event handlers
      this.connection.on('error', (error: Error) => {
        logger.error('RabbitMQ connection error:', error);
        this.handleConnectionError();
      });

      this.connection.on('close', () => {
        logger.warn('RabbitMQ connection closed');
        this.handleConnectionClose();
      });

      this.reconnectAttempts = 0;
      this.isConnecting = false;
      logger.info('Connected to RabbitMQ successfully');

      // Start consuming messages
      await this.startConsuming();
    } catch (error) {
      this.isConnecting = false;
      logger.error('Failed to connect to RabbitMQ:', error);
      await this.handleReconnect();
    }
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    logger.info(
      `Starting to consume messages from queue: ${config.RABBITMQ_QUEUE}`
    );

    await this.channel.consume(config.RABBITMQ_QUEUE, async (message: any) => {
      if (message) {
        await this.processMessage(message);
      }
    });
  }

  private async processMessage(message: any): Promise<void> {
    try {
      const content = message.content.toString();
      const transactionData: TransactionMessage = JSON.parse(content);

      logger.info('Processing transaction message', {
        orderId: transactionData.orderId,
        customerId: transactionData.customerId,
      });

      // Save transaction to database
      const transaction = new Transaction({
        transactionId: transactionData.transactionId, // Use provided transaction ID
        customerId: transactionData.customerId,
        orderId: transactionData.orderId,
        productId: transactionData.productId,
        amount: transactionData.amount,
        currency: transactionData.currency || 'USD',
        status: 'completed',
        type: 'payment',
        paymentMethod: transactionData.paymentMethod || 'credit_card',
        paymentGateway: 'stripe',
        metadata: {
          processedBy: 'worker-service',
          originalTimestamp: transactionData.timestamp,
        },
      });

      await transaction.save();

      logger.info('Transaction saved successfully', {
        transactionId: transaction.transactionId,
        orderId: transactionData.orderId,
      });

      // Acknowledge message
      if (this.channel) {
        this.channel.ack(message);
      }
    } catch (error) {
      logger.error('Error processing message:', error);

      // Reject message and requeue for retry
      if (this.channel) {
        this.channel.nack(message, false, true);
      }
    }
  }

  private async handleConnectionError(): Promise<void> {
    this.connection = null;
    this.channel = null;
    await this.handleReconnect();
  }

  private async handleConnectionClose(): Promise<void> {
    this.connection = null;
    this.channel = null;
    await this.handleReconnect();
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached. Giving up.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;

    logger.info(
      `Attempting to reconnect to RabbitMQ (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`
    );

    setTimeout(async () => {
      await this.connect();
    }, delay);
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      logger.info('Disconnected from RabbitMQ');
    } catch (error) {
      logger.error('Error disconnecting from RabbitMQ:', error);
    }
  }
}

export default RabbitMQConsumer;
