import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

// Mock payment route
app.post('/api/payments', async (req, res) => {
  try {
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    res.status(201).json({
      success: true,
      transactionId,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Payment failed' });
  }
});

describe('Payment Service', () => {
  describe('POST /api/payments', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        customerId: '507f1f77bcf86cd799439011',
        orderId: '507f1f77bcf86cd799439012',
        productId: '507f1f77bcf86cd799439013',
        amount: 99.99,
      };

      const response = await request(app)
        .post('/api/payments')
        .send(paymentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.transactionId).toBeDefined();
    });
  });
});
