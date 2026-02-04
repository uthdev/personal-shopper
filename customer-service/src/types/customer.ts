export interface ICustomer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
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

export interface CustomerResponse {
  status: string;
  data: {
    customerId: string;
    name: string;
    email: string;
    phone?: string;
    createdAt: Date;
  };
}

export interface HealthResponse {
  status: string;
  service: string;
  timestamp: string;
}