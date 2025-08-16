import axios from 'axios';
import { User, CreateUserDto, UpdateUserDto, Order, CreateOrderDto, UpdateOrderDto } from '../types';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// User API
export const userApi = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (userData: CreateUserDto): Promise<number> => {
    const response = await api.put('/users/create', userData);
    return response.data;
  },

  updateUser: async (id: number, userData: UpdateUserDto): Promise<void> => {
    await api.put(`/users/update/${id}`, userData);
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },
};

// Order API
export const orderApi = {
  getAllOrders: async (): Promise<Order[]> => {
    const response = await api.get('/orders');
    return response.data;
  },

  getOrder: async (id: number): Promise<Order> => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  createOrder: async (orderData: CreateOrderDto): Promise<number> => {
    const response = await api.put('/orders/create', orderData);
    return response.data;
  },

  updateOrder: async (id: number, orderData: UpdateOrderDto): Promise<void> => {
    await api.put(`/orders/update/${id}`, orderData);
  },

  deleteOrder: async (id: number): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};

// Error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = {
      message: error.response?.data?.message || error.message || 'Произошла ошибка',
      status: error.response?.status || 500,
    };
    return Promise.reject(apiError);
  }
);

export default api;