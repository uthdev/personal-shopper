import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true, default: 'US' }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
customerSchema.index({ email: 1 }, { unique: true });
customerSchema.index({ firstName: 1, lastName: 1 });
customerSchema.index({ 'address.city': 1, 'address.state': 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ createdAt: -1 });

// Virtual for full name
customerSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);