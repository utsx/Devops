import { User, CreateUserDto, UpdateUserDto, Order, CreateOrderDto, UpdateOrderDto, OrderStatus } from '../../types';

// Mock axios
const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    response: {
      use: jest.fn(),
    },
  },
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
}));

describe('API Service', () => {
  let userApi: any;
  let orderApi: any;

  beforeAll(() => {
    // Import after mocking
    const apiModule = require('../api');
    userApi = apiModule.userApi;
    orderApi = apiModule.orderApi;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('axios configuration', () => {
    it('should be able to import api module', () => {
      expect(userApi).toBeDefined();
      expect(orderApi).toBeDefined();
    });
  });

  describe('userApi', () => {
    const mockUser: User = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    const mockUsers: User[] = [mockUser];

    describe('getAllUsers', () => {
      it('fetches all users successfully', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: mockUsers });

        const result = await userApi.getAllUsers();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users');
        expect(result).toEqual(mockUsers);
      });

      it('handles getAllUsers error', async () => {
        const error = new Error('Network error');
        mockAxiosInstance.get.mockRejectedValue(error);

        await expect(userApi.getAllUsers()).rejects.toThrow('Network error');
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users');
      });
    });

    describe('getUser', () => {
      it('fetches single user successfully', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: mockUser });

        const result = await userApi.getUser(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/1');
        expect(result).toEqual(mockUser);
      });

      it('handles getUser error', async () => {
        const error = new Error('User not found');
        mockAxiosInstance.get.mockRejectedValue(error);

        await expect(userApi.getUser(1)).rejects.toThrow('User not found');
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/1');
      });
    });

    describe('createUser', () => {
      it('creates user successfully', async () => {
        const createUserDto: CreateUserDto = {
          username: 'newuser',
          email: 'newuser@example.com',
        };
        const userId = 2;
        mockAxiosInstance.put.mockResolvedValue({ data: userId });

        const result = await userApi.createUser(createUserDto);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/create', createUserDto);
        expect(result).toBe(userId);
      });

      it('handles createUser error', async () => {
        const createUserDto: CreateUserDto = {
          username: 'newuser',
          email: 'newuser@example.com',
        };
        const error = new Error('Validation error');
        mockAxiosInstance.put.mockRejectedValue(error);

        await expect(userApi.createUser(createUserDto)).rejects.toThrow('Validation error');
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/create', createUserDto);
      });
    });

    describe('updateUser', () => {
      it('updates user successfully', async () => {
        const updateUserDto: UpdateUserDto = {
          username: 'updateduser',
          email: 'updated@example.com',
        };
        mockAxiosInstance.put.mockResolvedValue({});

        await userApi.updateUser(1, updateUserDto);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/update/1', updateUserDto);
      });

      it('handles updateUser error', async () => {
        const updateUserDto: UpdateUserDto = {
          username: 'updateduser',
        };
        const error = new Error('Update failed');
        mockAxiosInstance.put.mockRejectedValue(error);

        await expect(userApi.updateUser(1, updateUserDto)).rejects.toThrow('Update failed');
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/users/update/1', updateUserDto);
      });
    });

    describe('deleteUser', () => {
      it('deletes user successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({});

        await userApi.deleteUser(1);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/users/1');
      });

      it('handles deleteUser error', async () => {
        const error = new Error('Delete failed');
        mockAxiosInstance.delete.mockRejectedValue(error);

        await expect(userApi.deleteUser(1)).rejects.toThrow('Delete failed');
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/users/1');
      });
    });
  });

  describe('orderApi', () => {
    const mockOrder: Order = {
      id: 1,
      userId: 1,
      productName: 'Test Product',
      deliveryDate: '2024-12-15',
      status: OrderStatus.CREATED,
      total: 100.50,
    };

    const mockOrders: Order[] = [mockOrder];

    describe('getAllOrders', () => {
      it('fetches all orders successfully', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: mockOrders });

        const result = await orderApi.getAllOrders();

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/orders');
        expect(result).toEqual(mockOrders);
      });

      it('handles getAllOrders error', async () => {
        const error = new Error('Network error');
        mockAxiosInstance.get.mockRejectedValue(error);

        await expect(orderApi.getAllOrders()).rejects.toThrow('Network error');
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/orders');
      });
    });

    describe('getOrder', () => {
      it('fetches single order successfully', async () => {
        mockAxiosInstance.get.mockResolvedValue({ data: mockOrder });

        const result = await orderApi.getOrder(1);

        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/orders/1');
        expect(result).toEqual(mockOrder);
      });

      it('handles getOrder error', async () => {
        const error = new Error('Order not found');
        mockAxiosInstance.get.mockRejectedValue(error);

        await expect(orderApi.getOrder(1)).rejects.toThrow('Order not found');
        expect(mockAxiosInstance.get).toHaveBeenCalledWith('/orders/1');
      });
    });

    describe('createOrder', () => {
      it('creates order successfully', async () => {
        const createOrderDto: CreateOrderDto = {
          userId: 1,
          product_name: 'New Product',
          delivery_date: '2024-12-20',
          status: OrderStatus.CREATED,
          total: 150.00,
        };
        const orderId = 2;
        mockAxiosInstance.put.mockResolvedValue({ data: orderId });

        const result = await orderApi.createOrder(createOrderDto);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/orders/create', createOrderDto);
        expect(result).toBe(orderId);
      });

      it('handles createOrder error', async () => {
        const createOrderDto: CreateOrderDto = {
          userId: 1,
          product_name: 'New Product',
          delivery_date: '2024-12-20',
          status: OrderStatus.CREATED,
          total: 150.00,
        };
        const error = new Error('Validation error');
        mockAxiosInstance.put.mockRejectedValue(error);

        await expect(orderApi.createOrder(createOrderDto)).rejects.toThrow('Validation error');
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/orders/create', createOrderDto);
      });
    });

    describe('updateOrder', () => {
      it('updates order successfully', async () => {
        const updateOrderDto: UpdateOrderDto = {
          delivery_date: '2024-12-25',
          total: 200.00,
        };
        mockAxiosInstance.put.mockResolvedValue({});

        await orderApi.updateOrder(1, updateOrderDto);

        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/orders/update/1', updateOrderDto);
      });

      it('handles updateOrder error', async () => {
        const updateOrderDto: UpdateOrderDto = {
          total: 200.00,
        };
        const error = new Error('Update failed');
        mockAxiosInstance.put.mockRejectedValue(error);

        await expect(orderApi.updateOrder(1, updateOrderDto)).rejects.toThrow('Update failed');
        expect(mockAxiosInstance.put).toHaveBeenCalledWith('/orders/update/1', updateOrderDto);
      });
    });

    describe('deleteOrder', () => {
      it('deletes order successfully', async () => {
        mockAxiosInstance.delete.mockResolvedValue({});

        await orderApi.deleteOrder(1);

        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/orders/1');
      });

      it('handles deleteOrder error', async () => {
        const error = new Error('Delete failed');
        mockAxiosInstance.delete.mockRejectedValue(error);

        await expect(orderApi.deleteOrder(1)).rejects.toThrow('Delete failed');
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/orders/1');
      });
    });
  });

});