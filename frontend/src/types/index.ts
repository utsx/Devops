export interface User {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  orders?: Order[];
}

export interface CreateUserDto {
  username: string;
  email: string;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
}

export enum OrderStatus {
  CREATED = 'CREATED',
  CANCELLED = 'CANCELLED',
  DELIVERED = 'DELIVERED'
}

export interface Order {
  id: number;
  userId: number;
  productName: string;
  deliveryDate: string;
  status: OrderStatus;
  total: number;
}

export interface CreateOrderDto {
  userId: number;
  product_name: string;
  delivery_date: string;
  status: OrderStatus;
  total: number;
}

export interface UpdateOrderDto {
  delivery_date?: string;
  total?: number;
}

export interface ApiError {
  message: string;
  status: number;
}