import mongoose, { Document, Schema } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  CHARGEBACK = 'chargeback'
}

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  transactionId: string;
  customerId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: TransactionStatus;
  type: TransactionType;
  paymentMethod: string;
  paymentGateway: string;
  gatewayTransactionId?: string;
  metadata: Record<string, any>;
  processedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Customer'
  },
  orderId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Order'
  },
  productId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Product'
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: function(value: number) {
        return Number.isFinite(value) && value >= 0;
      },
      message: 'Amount must be a positive number'
    }
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    default: 'USD',
    enum: ['USD', 'EUR', 'GBP', 'CAD']
  },
  status: {
    type: String,
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING
  },
  type: {
    type: String,
    enum: Object.values(TransactionType),
    default: TransactionType.PAYMENT
  },
  paymentMethod: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  paymentGateway: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    default: 'stripe'
  },
  gatewayTransactionId: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  processedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
transactionSchema.index({ transactionId: 1 }, { unique: true });
transactionSchema.index({ customerId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ productId: 1 });
transactionSchema.index({ status: 1, type: 1 });
transactionSchema.index({ paymentGateway: 1, gatewayTransactionId: 1 });
transactionSchema.index({ processedAt: -1 });
transactionSchema.index({ createdAt: -1 });

// Pre-save middleware to generate transaction ID
transactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.transactionId) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.transactionId = `TXN-${timestamp}-${random}`;
  }
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);