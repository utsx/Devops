import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderList from '../OrderList';
import { orderApi } from '../../../services/api';
import { Order, OrderStatus } from '../../../types';

// Define mock OrderStatus for use in mocks
const mockOrderStatus = {
  CREATED: 'CREATED',
  CANCELLED: 'CANCELLED',
  DELIVERED: 'DELIVERED'
};

// Mock the API
jest.mock('../../../services/api', () => ({
  orderApi: {
    getAllOrders: jest.fn(),
    createOrder: jest.fn(),
    getOrder: jest.fn(),
    updateOrder: jest.fn(),
    deleteOrder: jest.fn(),
  },
}));

// Mock OrderCard component
jest.mock('../OrderCard', () => {
  return function MockOrderCard({ order, onDelete, onEdit }: any) {
    return (
      <div data-testid={`order-card-${order.id}`}>
        <span data-testid="order-product">{order.productName}</span>
        <button 
          data-testid={`edit-order-${order.id}`}
          onClick={() => onEdit(order)}
        >
          Редактировать
        </button>
        <button 
          data-testid={`delete-order-${order.id}`}
          onClick={() => onDelete(order.id)}
        >
          Удалить
        </button>
      </div>
    );
  };
});

// Mock OrderForm component
jest.mock('../OrderForm', () => {
  return function MockOrderForm({ onSubmit, onCancel, editOrder }: any) {
    return (
      <div data-testid="order-form">
        <h2>{editOrder ? 'Редактировать заказ' : 'Создать заказ'}</h2>
        <button
          data-testid="form-submit"
          onClick={() => onSubmit(editOrder ?
            { delivery_date: '2024-12-20', total: 200 } :
            { userId: 1, product_name: 'Test Product', delivery_date: '2024-12-20', status: mockOrderStatus.CREATED, total: 100 }
          )}
        >
          Отправить
        </button>
        <button data-testid="form-cancel" onClick={onCancel}>
          Отмена
        </button>
      </div>
    );
  };
});

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  writable: true,
  value: jest.fn(),
});

const mockOrderApi = orderApi as jest.Mocked<typeof orderApi>;
const mockConfirm = window.confirm as jest.MockedFunction<typeof window.confirm>;

const mockOrders: Order[] = [
  {
    id: 1,
    userId: 1,
    productName: 'Product 1',
    deliveryDate: '2024-12-15',
    status: OrderStatus.CREATED,
    total: 100.50,
  },
  {
    id: 2,
    userId: 2,
    productName: 'Product 2',
    deliveryDate: '2024-12-20',
    status: OrderStatus.DELIVERED,
    total: 250.75,
  },
];

describe('OrderList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('Loading and displaying orders', () => {
    it('renders loading state initially', async () => {
      mockOrderApi.getAllOrders.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<OrderList />);
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('renders orders list after successful load', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue(mockOrders);
      
      render(<OrderList />);
      
      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Заказы')).toBeInTheDocument();
      expect(screen.getByTestId('create-order-btn')).toBeInTheDocument();
      expect(screen.getByTestId('order-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('order-card-2')).toBeInTheDocument();
    });

    it('renders empty state when no orders', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue([]);
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Заказы не найдены')).toBeInTheDocument();
    });

    it('renders error message on load failure', async () => {
      const errorMessage = 'Ошибка загрузки заказов';
      mockOrderApi.getAllOrders.mockRejectedValue({ message: errorMessage });
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Creating orders', () => {
    it('shows create form when create button is clicked', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue(mockOrders);
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('create-order-btn')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-order-btn'));
      
      expect(screen.getByTestId('order-form')).toBeInTheDocument();
      expect(screen.getByText('Создать заказ')).toBeInTheDocument();
    });

    it('creates new order successfully', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue([]);
      mockOrderApi.createOrder.mockResolvedValue(3);
      mockOrderApi.getOrder.mockResolvedValue({
        id: 3,
        userId: 1,
        productName: 'Test Product',
        deliveryDate: '2024-12-20',
        status: OrderStatus.CREATED,
        total: 100,
      });
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('create-order-btn')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-order-btn'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(mockOrderApi.createOrder).toHaveBeenCalledWith({
          userId: 1,
          product_name: 'Test Product',
          delivery_date: '2024-12-20',
          status: mockOrderStatus.CREATED,
          total: 100,
        });
      });
      
      await waitFor(() => {
        expect(mockOrderApi.getOrder).toHaveBeenCalledWith(3);
      });
    });

    it('handles create order error', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue([]);
      mockOrderApi.createOrder.mockRejectedValue({ message: 'Ошибка создания заказа' });
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('create-order-btn')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-order-btn'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(mockOrderApi.createOrder).toHaveBeenCalled();
      });
      
      // The form should still be visible with error, not closed
      expect(screen.getByTestId('order-form')).toBeInTheDocument();
    });

    it('cancels create form', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue(mockOrders);
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('create-order-btn')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-order-btn'));
      expect(screen.getByTestId('order-form')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('form-cancel'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('order-form')).not.toBeInTheDocument();
      });
      
      expect(screen.getByTestId('order-list')).toBeInTheDocument();
    });
  });

  describe('Editing orders', () => {
    it('shows edit form when edit button is clicked', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue(mockOrders);
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('edit-order-1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('edit-order-1'));
      
      expect(screen.getByTestId('order-form')).toBeInTheDocument();
      expect(screen.getByText('Редактировать заказ')).toBeInTheDocument();
    });

    it('updates order successfully', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue(mockOrders);
      mockOrderApi.updateOrder.mockResolvedValue();
      mockOrderApi.getOrder.mockResolvedValue({
        ...mockOrders[0],
        total: 200,
        deliveryDate: '2024-12-20',
      });
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('edit-order-1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('edit-order-1'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(mockOrderApi.updateOrder).toHaveBeenCalledWith(1, {
          delivery_date: '2024-12-20',
          total: 200,
        });
      });
      
      await waitFor(() => {
        expect(mockOrderApi.getOrder).toHaveBeenCalledWith(1);
      });
    });

    it('handles update order error', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue(mockOrders);
      mockOrderApi.updateOrder.mockRejectedValue({ message: 'Ошибка обновления заказа' });
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('edit-order-1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('edit-order-1'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(mockOrderApi.updateOrder).toHaveBeenCalled();
      });
      
      // The form should still be visible with error, not closed
      expect(screen.getByTestId('order-form')).toBeInTheDocument();
    });
  });

  describe('Deleting orders', () => {
    it('deletes order when confirmed', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue(mockOrders);
      mockOrderApi.deleteOrder.mockResolvedValue();
      mockConfirm.mockReturnValue(true);
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-order-1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('delete-order-1'));
      
      expect(mockConfirm).toHaveBeenCalledWith('Вы уверены, что хотите удалить этот заказ?');
      
      await waitFor(() => {
        expect(mockOrderApi.deleteOrder).toHaveBeenCalledWith(1);
      });
    });

    it('does not delete order when not confirmed', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue(mockOrders);
      mockConfirm.mockReturnValue(false);
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-order-1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('delete-order-1'));
      
      expect(mockConfirm).toHaveBeenCalledWith('Вы уверены, что хотите удалить этот заказ?');
      expect(mockOrderApi.deleteOrder).not.toHaveBeenCalled();
    });

    it('handles delete order error', async () => {
      mockOrderApi.getAllOrders.mockResolvedValue(mockOrders);
      mockOrderApi.deleteOrder.mockRejectedValue({ message: 'Ошибка удаления заказа' });
      mockConfirm.mockReturnValue(true);
      
      render(<OrderList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('delete-order-1')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('delete-order-1'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Ошибка удаления заказа')).toBeInTheDocument();
    });
  });
});