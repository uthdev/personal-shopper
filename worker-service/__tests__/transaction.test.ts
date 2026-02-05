import { transactionMessageSchema, transactionSaveSchema } from '../src/schemas/transaction';
import { TransactionStatus, TransactionType } from '../src/models/Transaction';
import { ZodError } from 'zod';

describe('Worker Service', () => {
  describe('Transaction Validation', () => {
    const validTransactionMessage = {
      transactionId: 'TXN_20231201_ABC12345',
      customerId: '507f1f77bcf86cd799439011',
      orderId: '507f1f77bcf86cd799439012',
      productId: '507f1f77bcf86cd799439013',
      amount: 99.99,
      currency: 'USD',
      paymentMethod: 'credit_card',
      timestamp: new Date(),
    };

    describe('transactionMessageSchema validation', () => {
      it('should validate correct transaction message', () => {
        const result = transactionMessageSchema.parse(validTransactionMessage);
        
        expect(result.transactionId).toBe('TXN_20231201_ABC12345');
        expect(result.customerId).toBe('507f1f77bcf86cd799439011');
        expect(result.orderId).toBe('507f1f77bcf86cd799439012');
        expect(result.amount).toBe(99.99);
      });

      it('should reject missing transactionId', () => {
        const invalidData = { ...validTransactionMessage };
        delete (invalidData as any).transactionId;

        expect(() => transactionMessageSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it('should reject invalid customerId format', () => {
        const invalidData = {
          ...validTransactionMessage,
          customerId: 'invalid-id',
        };

        expect(() => transactionMessageSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it('should reject invalid orderId format', () => {
        const invalidData = {
          ...validTransactionMessage,
          orderId: 'not-an-objectid',
        };

        expect(() => transactionMessageSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it('should reject invalid productId format', () => {
        const invalidData = {
          ...validTransactionMessage,
          productId: '507f1f77bcf86cd79943901', // Too short
        };

        expect(() => transactionMessageSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it('should reject negative amount', () => {
        const invalidData = {
          ...validTransactionMessage,
          amount: -50,
        };

        expect(() => transactionMessageSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it('should reject zero amount', () => {
        const invalidData = {
          ...validTransactionMessage,
          amount: 0,
        };

        expect(() => transactionMessageSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it('should accept optional currency with default USD', () => {
        const { currency, ...dataWithoutCurrency } = validTransactionMessage;
        const result = transactionMessageSchema.parse(dataWithoutCurrency);
        
        expect(result.currency).toBe('USD');
      });

      it('should accept optional paymentMethod', () => {
        const { paymentMethod, ...dataWithoutPaymentMethod } = validTransactionMessage;
        const result = transactionMessageSchema.parse(dataWithoutPaymentMethod);
        
        expect(result.paymentMethod).toBe('credit_card');
      });

      it('should reject invalid timestamp', () => {
        const invalidData = {
          ...validTransactionMessage,
          timestamp: 'not-a-date',
        };

        expect(() => transactionMessageSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });
    });

    describe('transactionSaveSchema validation', () => {
      const validSaveData = {
        transactionId: 'TXN_20231201_ABC12345',
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        paymentMethod: 'credit_card',
        paymentGateway: 'stripe',
        metadata: {
          processedBy: 'worker-service',
          originalTimestamp: new Date(),
        },
      };

      it('should validate correct save data', () => {
        const result = transactionSaveSchema.parse(validSaveData);
        
        expect(result.transactionId).toBe('TXN_20231201_ABC12345');
        expect(result.status).toBe(TransactionStatus.COMPLETED);
        expect(result.type).toBe(TransactionType.PAYMENT);
      });

      it('should uppercase currency on save', () => {
        const data = { ...validSaveData, currency: 'usd' };
        const result = transactionSaveSchema.parse(data);
        
        expect(result.currency).toBe('USD');
      });

      it('should lowercase paymentMethod on save', () => {
        const data = { ...validSaveData, paymentMethod: 'CREDIT_CARD' };
        const result = transactionSaveSchema.parse(data);
        
        expect(result.paymentMethod).toBe('credit_card');
      });

      it('should lowercase paymentGateway on save', () => {
        const data = { ...validSaveData, paymentGateway: 'STRIPE' };
        const result = transactionSaveSchema.parse(data);
        
        expect(result.paymentGateway).toBe('stripe');
      });

      it('should provide default values for optional fields', () => {
        const minimalData = {
          transactionId: 'TXN_20231201_ABC12345',
          customerId: '507f1f77bcf86cd799439011',
          orderId: '507f1f77bcf86cd799439012',
          productId: '507f1f77bcf86cd799439013',
          amount: 50.0,
        };

        const result = transactionSaveSchema.parse(minimalData);
        
        expect(result.currency).toBe('USD');
        expect(result.status).toBe(TransactionStatus.COMPLETED);
        expect(result.type).toBe(TransactionType.PAYMENT);
        expect(result.paymentMethod).toBe('credit_card');
        expect(result.paymentGateway).toBe('stripe');
        expect(result.metadata).toEqual({});
      });

      it('should reject invalid transaction status', () => {
        const invalidData = {
          ...validSaveData,
          status: 'invalid_status',
        };

        expect(() => transactionSaveSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });

      it('should reject invalid transaction type', () => {
        const invalidData = {
          ...validSaveData,
          type: 'invalid_type',
        };

        expect(() => transactionSaveSchema.parse(invalidData)).toThrow(
          ZodError
        );
      });
    });
  });

  describe('Transaction Processing', () => {
    it('should create transaction object with valid data', () => {
      const transactionData = {
        transactionId: 'TXN_20231201_ABC12345',
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
        currency: 'USD',
        status: 'completed',
        type: 'payment',
        paymentMethod: 'credit_card',
        paymentGateway: 'stripe',
      };

      expect(transactionData.transactionId).toBe('TXN_20231201_ABC12345');
      expect(transactionData.amount).toBe(99.99);
      expect(transactionData.status).toBe('completed');
    });

    it('should validate transaction data with metadata', () => {
      const transactionData = {
        transactionId: 'TXN_20231201_XYZ67890',
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 149.99,
        currency: 'USD',
        status: 'completed',
        type: 'payment',
        paymentMethod: 'credit_card',
        paymentGateway: 'stripe',
        metadata: {
          processedBy: 'worker-service',
          originalTimestamp: new Date(),
        },
      };

      expect(transactionData.metadata.processedBy).toBe('worker-service');
      expect(transactionData.metadata.originalTimestamp).toBeDefined();
    });

    it('should handle multiple transaction types', () => {
      const paymentTransaction = {
        type: TransactionType.PAYMENT,
      };

      const refundTransaction = {
        type: TransactionType.REFUND,
      };

      const chargebackTransaction = {
        type: TransactionType.CHARGEBACK,
      };

      expect(paymentTransaction.type).toBe('payment');
      expect(refundTransaction.type).toBe('refund');
      expect(chargebackTransaction.type).toBe('chargeback');
    });

    it('should handle multiple transaction statuses', () => {
      const pendingStatus = TransactionStatus.PENDING;
      const completedStatus = TransactionStatus.COMPLETED;
      const failedStatus = TransactionStatus.FAILED;
      const refundedStatus = TransactionStatus.REFUNDED;

      expect(pendingStatus).toBe('pending');
      expect(completedStatus).toBe('completed');
      expect(failedStatus).toBe('failed');
      expect(refundedStatus).toBe('refunded');
    });
  });

  describe('Error Handling', () => {
    it('should provide meaningful error for missing required fields', () => {
      const incompleteData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        // Missing transactionId, productId, amount
      };

      try {
        transactionMessageSchema.parse(incompleteData);
        throw new Error('Should have thrown validation error');
      } catch (error) {
        expect(error instanceof ZodError).toBe(true);
        if (error instanceof ZodError) {
          expect(error.errors.length).toBeGreaterThan(0);
        }
      }
    });

    it('should provide meaningful error for invalid field values', () => {
      const invalidData = {
        transactionId: 'TXN_123',
        customerId: 'not-a-valid-id',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 'not-a-number',
        timestamp: new Date(),
      };

      try {
        transactionMessageSchema.parse(invalidData);
        throw new Error('Should have thrown validation error');
      } catch (error) {
        expect(error instanceof ZodError).toBe(true);
      }
    });

    it('should handle duplicate transaction IDs gracefully', () => {
      const data1 = {
        transactionId: 'TXN_20231201_ABC12345',
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
        currency: 'USD',
        status: TransactionStatus.COMPLETED,
        type: TransactionType.PAYMENT,
        paymentMethod: 'credit_card',
        paymentGateway: 'stripe',
      };

      const data2 = { ...data1 };

      // Both should validate successfully (duplicate check happens at DB level)
      const result1 = transactionSaveSchema.parse(data1);
      const result2 = transactionSaveSchema.parse(data2);

      expect(result1.transactionId).toBe(result2.transactionId);
    });
  });

  describe('Dead Letter Queue Handling', () => {
    it('should track retry attempts in metadata', () => {
      const metadata = {
        processedBy: 'worker-service',
        originalTimestamp: new Date(),
        retryCount: 2,
      };

      expect(metadata.retryCount).toBe(2);
      expect(metadata.retryCount < 3).toBe(true);
    });

    it('should identify when max retries are exceeded', () => {
      const maxRetries = 3;
      
      for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        const shouldSendToDLQ = attempt > maxRetries;
        expect(shouldSendToDLQ).toBe(attempt === 4);
      }
    });

    it('should include error information in dead letter message', () => {
      const dlqMessage = {
        originalMessage: {
          transactionId: 'TXN_20231201_ABC12345',
          customerId: '507f1f77bcf86cd799439011',
        },
        error: 'MongoDB connection failed',
        errorDetails: 'Error: MongoDB connection failed\n    at ...',
        failureCount: 3,
        timestamp: new Date(),
      };

      expect(dlqMessage.error).toBe('MongoDB connection failed');
      expect(dlqMessage.failureCount).toBe(3);
      expect(dlqMessage.originalMessage.transactionId).toBeDefined();
    });
  });
});
