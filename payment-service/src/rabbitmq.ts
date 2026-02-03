import amqp from 'amqplib';
import { config } from './config';
import logger from './logger';

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

class RabbitMQConnection {
  private static instance: RabbitMQConnection;
  private connection: any = null;
  private channel: any = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 5000;

  private constructor() {}

  public static getInstance(): RabbitMQConnection {
    if (!RabbitMQConnection.instance) {
      RabbitMQConnection.instance = new RabbitMQConnection();
    }
    return RabbitMQConnection.instance;
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
    } catch (error) {
      this.isConnecting = false;
      logger.error('Failed to connect to RabbitMQ:', error);
      await this.handleReconnect();
    }
  }

  public async publishMessage(message: TransactionMessage): Promise<boolean> {
    try {
      if (!this.channel) {
        await this.connect();
      }

      if (!this.channel) {
        throw new Error('RabbitMQ channel not available');
      }

      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel.publish(
        config.RABBITMQ_EXCHANGE,
        'transaction',
        messageBuffer,
        { persistent: true }
      );

      if (published) {
        logger.info('Message published successfully', {
          orderId: message.orderId,
        });
        return true;
      } else {
        logger.warn('Failed to publish message - channel buffer full');
        return false;
      }
    } catch (error) {
      logger.error('Error publishing message:', error);
      return false;
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

export default RabbitMQConnection;
