import amqp from 'amqplib';
import { config } from './config';
import logger from './logger';
import { Transaction, TransactionStatus, TransactionType } from './models/Transaction';
import { transactionMessageSchema, TransactionMessage } from './schemas/transaction';
import { ZodError } from 'zod';

export interface DeadLetterMessage {
  originalMessage: any;
  error: string;
  errorDetails: any;
  failureCount: number;
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

      // Set prefetch to process one message at a time
      await this.channel.prefetch(1);

      // Setup dead letter exchange and queue
      await this.setupDeadLetterQueue();

      // Assert main exchange and queue with dead letter routing
      await this.channel.assertExchange(config.RABBITMQ_EXCHANGE, 'direct', {
        durable: true,
      });

      await this.channel.assertQueue(config.RABBITMQ_QUEUE, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': 'transactions_dlx',
          'x-dead-letter-routing-key': 'transaction_dlk',
          'x-message-ttl': 86400000, // 24 hours
        },
      });

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
      logger.info(`Listening on queue: ${config.RABBITMQ_QUEUE}`);

      // Start consuming messages
      await this.startConsuming();
    } catch (error) {
      this.isConnecting = false;
      logger.error('Failed to connect to RabbitMQ:', error);
      await this.handleReconnect();
    }
  }

  private async setupDeadLetterQueue(): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      // Create dead letter exchange
      await this.channel.assertExchange('transactions_dlx', 'direct', {
        durable: true,
      });

      // Create dead letter queue
      await this.channel.assertQueue('transactions_dlq', {
        durable: true,
        arguments: {
          'x-message-ttl': 86400000, // 24 hours
          'x-max-length': 100000, // Max 100k messages
        },
      });

      // Bind dead letter queue
      await this.channel.bindQueue(
        'transactions_dlq',
        'transactions_dlx',
        'transaction_dlk'
      );

      logger.info('Dead letter queue setup completed');
    } catch (error) {
      logger.error('Failed to setup dead letter queue:', error);
      throw error;
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
    let retryCount = 0;
    const retryHeader = message.properties.headers?.['x-death'];
    
    if (retryHeader && Array.isArray(retryHeader) && retryHeader.length > 0) {
      retryCount = retryHeader[0].count || 0;
    }

    try {
      const content = message.content.toString();
      const messageData = JSON.parse(content);

      // Validate message format
      const validatedData = await this.validateTransactionMessage(messageData);

      logger.info('Processing transaction message', {
        transactionId: validatedData.transactionId,
        orderId: validatedData.orderId,
        customerId: validatedData.customerId,
        amount: validatedData.amount,
      });

      // Save transaction to database
      const transaction = new Transaction({
        transactionId: validatedData.transactionId,
        customerId: validatedData.customerId,
        orderId: validatedData.orderId,
        productId: validatedData.productId,
        amount: validatedData.amount,
        currency: validatedData.currency || 'USD',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        paymentMethod: validatedData.paymentMethod || 'credit_card',
        paymentGateway: 'stripe',
        metadata: {
          processedBy: 'worker-service',
          originalTimestamp: validatedData.timestamp,
          retryCount,
        },
      });

      await transaction.save();

      logger.info('Transaction saved successfully', {
        transactionId: transaction.transactionId,
        orderId: validatedData.orderId,
        mongoId: transaction._id,
      });

      // Acknowledge message
      if (this.channel) {
        this.channel.ack(message);
      }
    } catch (error) {
      logger.error('Error processing message:', {
        error: error instanceof Error ? error.message : String(error),
        retryCount,
        maxRetries: 3,
      });

      // Determine if we should retry or send to dead letter queue
      if (retryCount < 3) {
        // Reject message and requeue for retry
        if (this.channel) {
          this.channel.nack(message, false, true);
          logger.warn(
            `Message requeued for retry (attempt ${retryCount + 1}/3)`
          );
        }
      } else {
        // Max retries exceeded, send to dead letter queue
        await this.sendToDeadLetterQueue(
          message,
          error instanceof Error ? error.message : String(error),
          error
        );

        // Acknowledge message to remove from main queue
        if (this.channel) {
          this.channel.ack(message);
        }
      }
    }
  }

  private async validateTransactionMessage(
    data: any
  ): Promise<TransactionMessage> {
    try {
      const validated = transactionMessageSchema.parse(data);
      return validated;
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        logger.error('Transaction message validation failed', { fieldErrors });
        throw new Error(
          `Validation failed: ${fieldErrors.map((e) => `${e.field}: ${e.message}`).join('; ')}`
        );
      }
      throw error;
    }
  }

  private async sendToDeadLetterQueue(
    message: any,
    errorMessage: string,
    error: any
  ): Promise<void> {
    try {
      if (!this.channel) {
        logger.error('Channel not available for dead letter queue');
        return;
      }

      const dlqMessage: DeadLetterMessage = {
        originalMessage: JSON.parse(message.content.toString()),
        error: errorMessage,
        errorDetails: error instanceof Error ? error.stack : String(error),
        failureCount: 3,
        timestamp: new Date(),
      };

      await this.channel.sendToQueue('transactions_dlq', Buffer.from(JSON.stringify(dlqMessage)), {
        persistent: true,
        headers: {
          'x-original-queue': config.RABBITMQ_QUEUE,
          'x-failure-reason': errorMessage,
        },
      });

      logger.warn('Message sent to dead letter queue', {
        error: errorMessage,
        originalTransactionId:
          dlqMessage.originalMessage.transactionId || 'unknown',
      });
    } catch (dlqError) {
      logger.error('Failed to send message to dead letter queue:', dlqError);
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
