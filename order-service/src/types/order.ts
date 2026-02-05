export interface IOrder {
  _id: string;
  customerId: string;
  orderNumber: string;
  items: IOrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IOrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface CreateOrderRequest {
  customerId: string;
  productId: string;
  quantity?: number;
}

export interface OrderResponse {
  status: string;
  data: {
    customerId: string;
    orderId: string;
    productId: string;
    orderStatus: string;
  };
}

export interface HealthResponse {
  status: 'OK' | 'DEGRADED' | 'ERROR';
  service: string;
  version: string;
  timestamp: string;
  uptime: number;
  database: {
    status: 'connected' | 'disconnected';
    latency?: number;
  };
}