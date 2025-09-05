import { User, CreateUserDto, UpdateUserDto, Order, CreateOrderDto, UpdateOrderDto, OrderStatus, ApiError } from '../index';

describe('Types', () => {
  describe('User types', () => {
    it('should have correct User interface structure', () => {
      const user: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(typeof user.id).toBe('number');
      expect(typeof user.username).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(typeof user.createdAt).toBe('string');
      expect(typeof user.updatedAt).toBe('string');
    });

    it('should allow optional orders in User interface', () => {
      const userWithOrders: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        orders: [],
      };

      expect(Array.isArray(userWithOrders.orders)).toBe(true);

      const userWithoutOrders: User = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(userWithoutOrders.orders).toBeUndefined();
    });

    it('should have correct CreateUserDto interface structure', () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        email: 'newuser@example.com',
      };

      expect(typeof createUserDto.username).toBe('string');
      expect(typeof createUserDto.email).toBe('string');
    });

    it('should have correct UpdateUserDto interface structure with optional fields', () => {
      const updateUserDtoFull: UpdateUserDto = {
        username: 'updateduser',
        email: 'updated@example.com',
      };

      expect(typeof updateUserDtoFull.username).toBe('string');
      expect(typeof updateUserDtoFull.email).toBe('string');

      const updateUserDtoPartial: UpdateUserDto = {
        username: 'updateduser',
      };

      expect(typeof updateUserDtoPartial.username).toBe('string');
      expect(updateUserDtoPartial.email).toBeUndefined();

      const updateUserDtoEmail: UpdateUserDto = {
        email: 'updated@example.com',
      };

      expect(typeof updateUserDtoEmail.email).toBe('string');
      expect(updateUserDtoEmail.username).toBeUndefined();

      const updateUserDtoEmpty: UpdateUserDto = {};

      expect(updateUserDtoEmpty.username).toBeUndefined();
      expect(updateUserDtoEmpty.email).toBeUndefined();
    });
  });

  describe('Order types', () => {
    it('should have correct OrderStatus enum values', () => {
      expect(OrderStatus.CREATED).toBe('CREATED');
      expect(OrderStatus.CANCELLED).toBe('CANCELLED');
      expect(OrderStatus.DELIVERED).toBe('DELIVERED');

      // Test that enum has exactly 3 values
      const enumValues = Object.values(OrderStatus);
      expect(enumValues).toHaveLength(3);
      expect(enumValues).toContain('CREATED');
      expect(enumValues).toContain('CANCELLED');
      expect(enumValues).toContain('DELIVERED');
    });

    it('should have correct Order interface structure', () => {
      const order: Order = {
        id: 1,
        userId: 123,
        productName: 'Test Product',
        deliveryDate: '2024-12-15',
        status: OrderStatus.CREATED,
        total: 100.50,
      };

      expect(typeof order.id).toBe('number');
      expect(typeof order.userId).toBe('number');
      expect(typeof order.productName).toBe('string');
      expect(typeof order.deliveryDate).toBe('string');
      expect(typeof order.status).toBe('string');
      expect(Object.values(OrderStatus)).toContain(order.status);
      expect(typeof order.total).toBe('number');
    });

    it('should have correct CreateOrderDto interface structure', () => {
      const createOrderDto: CreateOrderDto = {
        userId: 123,
        product_name: 'New Product',
        delivery_date: '2024-12-20',
        status: OrderStatus.CREATED,
        total: 150.00,
      };

      expect(typeof createOrderDto.userId).toBe('number');
      expect(typeof createOrderDto.product_name).toBe('string');
      expect(typeof createOrderDto.delivery_date).toBe('string');
      expect(typeof createOrderDto.status).toBe('string');
      expect(Object.values(OrderStatus)).toContain(createOrderDto.status);
      expect(typeof createOrderDto.total).toBe('number');
    });

    it('should have correct UpdateOrderDto interface structure with optional fields', () => {
      const updateOrderDtoFull: UpdateOrderDto = {
        delivery_date: '2024-12-25',
        total: 200.00,
      };

      expect(typeof updateOrderDtoFull.delivery_date).toBe('string');
      expect(typeof updateOrderDtoFull.total).toBe('number');

      const updateOrderDtoPartial: UpdateOrderDto = {
        delivery_date: '2024-12-25',
      };

      expect(typeof updateOrderDtoPartial.delivery_date).toBe('string');
      expect(updateOrderDtoPartial.total).toBeUndefined();

      const updateOrderDtoTotal: UpdateOrderDto = {
        total: 200.00,
      };

      expect(typeof updateOrderDtoTotal.total).toBe('number');
      expect(updateOrderDtoTotal.delivery_date).toBeUndefined();

      const updateOrderDtoEmpty: UpdateOrderDto = {};

      expect(updateOrderDtoEmpty.delivery_date).toBeUndefined();
      expect(updateOrderDtoEmpty.total).toBeUndefined();
    });

    it('should allow all OrderStatus values in Order and CreateOrderDto', () => {
      const orderCreated: Order = {
        id: 1,
        userId: 123,
        productName: 'Test Product',
        deliveryDate: '2024-12-15',
        status: OrderStatus.CREATED,
        total: 100.50,
      };

      const orderCancelled: Order = {
        id: 2,
        userId: 123,
        productName: 'Test Product',
        deliveryDate: '2024-12-15',
        status: OrderStatus.CANCELLED,
        total: 100.50,
      };

      const orderDelivered: Order = {
        id: 3,
        userId: 123,
        productName: 'Test Product',
        deliveryDate: '2024-12-15',
        status: OrderStatus.DELIVERED,
        total: 100.50,
      };

      expect(orderCreated.status).toBe('CREATED');
      expect(orderCancelled.status).toBe('CANCELLED');
      expect(orderDelivered.status).toBe('DELIVERED');
    });
  });

  describe('ApiError type', () => {
    it('should have correct ApiError interface structure', () => {
      const apiError: ApiError = {
        message: 'Something went wrong',
        status: 500,
      };

      expect(typeof apiError.message).toBe('string');
      expect(typeof apiError.status).toBe('number');
    });

    it('should work with different status codes', () => {
      const badRequestError: ApiError = {
        message: 'Bad request',
        status: 400,
      };

      const notFoundError: ApiError = {
        message: 'Not found',
        status: 404,
      };

      const serverError: ApiError = {
        message: 'Internal server error',
        status: 500,
      };

      expect(badRequestError.status).toBe(400);
      expect(notFoundError.status).toBe(404);
      expect(serverError.status).toBe(500);
    });
  });

  describe('Type compatibility', () => {
    it('should allow CreateUserDto to be used for User creation', () => {
      const createDto: CreateUserDto = {
        username: 'testuser',
        email: 'test@example.com',
      };

      // Simulate what happens in API - we get back a full User object
      const createdUser: User = {
        id: 1,
        ...createDto,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      expect(createdUser.username).toBe(createDto.username);
      expect(createdUser.email).toBe(createDto.email);
    });

    it('should allow CreateOrderDto to be used for Order creation', () => {
      const createDto: CreateOrderDto = {
        userId: 123,
        product_name: 'Test Product',
        delivery_date: '2024-12-15',
        status: OrderStatus.CREATED,
        total: 100.50,
      };

      // Simulate what happens in API - we get back a full Order object
      const createdOrder: Order = {
        id: 1,
        userId: createDto.userId,
        productName: createDto.product_name, // Note: different field name
        deliveryDate: createDto.delivery_date, // Note: different field name
        status: createDto.status,
        total: createDto.total,
      };

      expect(createdOrder.userId).toBe(createDto.userId);
      expect(createdOrder.status).toBe(createDto.status);
      expect(createdOrder.total).toBe(createDto.total);
    });

    it('should handle field name differences between Order and CreateOrderDto', () => {
      // This test documents the intentional field name differences
      const createDto: CreateOrderDto = {
        userId: 123,
        product_name: 'Test Product', // snake_case
        delivery_date: '2024-12-15', // snake_case
        status: OrderStatus.CREATED,
        total: 100.50,
      };

      const order: Order = {
        id: 1,
        userId: 123,
        productName: 'Test Product', // camelCase
        deliveryDate: '2024-12-15', // camelCase
        status: OrderStatus.CREATED,
        total: 100.50,
      };

      // Field names are different but values should match
      expect(order.productName).toBe(createDto.product_name);
      expect(order.deliveryDate).toBe(createDto.delivery_date);
    });
  });
});