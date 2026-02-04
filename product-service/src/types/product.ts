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
  status: string;
  service: string;
  timestamp: string;
}