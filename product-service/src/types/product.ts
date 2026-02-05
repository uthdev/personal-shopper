export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductResponse {
  status: string;
  data: {
    productId: string;
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    isActive: boolean;
    createdAt: Date;
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