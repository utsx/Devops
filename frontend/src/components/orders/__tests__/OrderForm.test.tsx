import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderForm from '../OrderForm';
import { userApi } from '../../../services/api';
import { OrderStatus, Order } from '../../../types';

// Mock the API
jest.mock('../../../services/api', () => ({
  userApi: {
    getAllUsers: jest.fn(),
  },
}));

const mockUserApi = userApi as jest.Mocked<typeof userApi>;

const mockUsers = [
  { id: 1, username: 'user1', email: 'user1@example.com', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: 2, username: 'user2', email: 'user2@example.com', createdAt: '2023-01-01', updatedAt: '2023-01-01' },
];

const mockOrder: Order = {
  id: 1,
  userId: 1,
  productName: 'Test Product',
  deliveryDate: '2024-12-15',
  status: OrderStatus.CREATED,
  total: 100.50,
};

describe('OrderForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
  });

  describe('Create Mode', () => {
    it('renders create order form correctly', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(screen.getByTestId('form-title')).toHaveTextContent('Создать заказ');
      
      // Ждем загрузки пользователей
      await waitFor(() => {
        expect(mockUserApi.getAllUsers).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId('userId-select')).toBeInTheDocument();
      });

      expect(screen.getByTestId('product-name-input')).toBeInTheDocument();
      expect(screen.getByTestId('delivery-date-input')).toBeInTheDocument();
      expect(screen.getByTestId('status-select')).toBeInTheDocument();
      expect(screen.getByTestId('total-input')).toBeInTheDocument();
      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Создать заказ');
      expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
    });

    it('validates delivery date is not in the past for new orders', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(mockUserApi.getAllUsers).toHaveBeenCalled();
      });

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];

      fireEvent.change(screen.getByTestId('delivery-date-input'), { target: { value: yesterdayString } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('delivery-date-error')).toHaveTextContent('Дата доставки не может быть в прошлом');
      });
    });

    it('submits valid create form data', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(mockUserApi.getAllUsers).toHaveBeenCalled();
      });

      // Ждем появления select элемента
      await waitFor(() => {
        expect(screen.getByTestId('userId-select')).toBeInTheDocument();
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];

      fireEvent.change(screen.getByTestId('userId-select'), { target: { value: '1' } });
      fireEvent.change(screen.getByTestId('product-name-input'), { target: { value: 'Test Product' } });
      fireEvent.change(screen.getByTestId('delivery-date-input'), { target: { value: tomorrowString } });
      fireEvent.change(screen.getByTestId('status-select'), { target: { value: OrderStatus.CREATED } });
      fireEvent.change(screen.getByTestId('total-input'), { target: { value: '100.50' } });

      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          userId: 1,
          product_name: 'Test Product',
          delivery_date: tomorrowString,
          status: OrderStatus.CREATED,
          total: 100.50,
        });
      });
    });
  });

  describe('Edit Mode', () => {
    it('renders edit order form correctly', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} editOrder={mockOrder} />);

      expect(screen.getByTestId('form-title')).toHaveTextContent('Редактировать заказ');
      expect(screen.queryByTestId('userId-select')).not.toBeInTheDocument();
      expect(screen.queryByTestId('product-name-input')).not.toBeInTheDocument();
      expect(screen.queryByTestId('status-select')).not.toBeInTheDocument();
      
      expect(screen.getByText('Test Product')).toBeInTheDocument();
      expect(screen.getByText('Создан')).toBeInTheDocument();
      expect(screen.getByTestId('delivery-date-input')).toHaveValue('2024-12-15');
      expect(screen.getByTestId('total-input')).toHaveValue(100.5);
      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Сохранить изменения');
    });

    it('validates delivery date cannot be earlier than current order date', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} editOrder={mockOrder} />);

      const earlierDate = '2024-12-10'; // Earlier than 2024-12-15

      fireEvent.change(screen.getByTestId('delivery-date-input'), { target: { value: earlierDate } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('delivery-date-error')).toHaveTextContent('Дата доставки не может быть перенесена на более раннюю дату');
      });
    });

    it('allows same delivery date', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} editOrder={mockOrder} />);

      fireEvent.change(screen.getByTestId('total-input'), { target: { value: '150.00' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          delivery_date: '2024-12-15',
          total: 150.00,
        });
      });
    });

    it('allows later delivery date', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} editOrder={mockOrder} />);

      const laterDate = '2024-12-20'; // Later than 2024-12-15

      fireEvent.change(screen.getByTestId('delivery-date-input'), { target: { value: laterDate } });
      fireEvent.change(screen.getByTestId('total-input'), { target: { value: '150.00' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          delivery_date: laterDate,
          total: 150.00,
        });
      });
    });

    it('submits only changed fields in edit mode', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} editOrder={mockOrder} />);

      fireEvent.change(screen.getByTestId('total-input'), { target: { value: '200.00' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          delivery_date: '2024-12-15',
          total: 200.00,
        });
      });
    });

    it('shows loading state in edit mode', () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} editOrder={mockOrder} isLoading={true} />);

      expect(screen.getByTestId('submit-btn')).toHaveTextContent('Сохранение...');
      expect(screen.getByTestId('submit-btn')).toBeDisabled();
      expect(screen.getByTestId('cancel-btn')).toBeDisabled();
    });
  });

  describe('Common functionality', () => {
    it('validates required fields', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      await waitFor(() => {
        expect(mockUserApi.getAllUsers).toHaveBeenCalled();
      });

      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('userId-error')).toHaveTextContent('Выберите пользователя');
        expect(screen.getByTestId('product-name-error')).toHaveTextContent('Название продукта обязательно');
        expect(screen.getByTestId('delivery-date-error')).toHaveTextContent('Дата доставки обязательна');
        expect(screen.getByTestId('total-error')).toHaveTextContent('Сумма заказа обязательна');
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates total is a positive number', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} editOrder={mockOrder} />);

      fireEvent.change(screen.getByTestId('total-input'), { target: { value: '-10' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('total-error')).toHaveTextContent('Сумма заказа должна быть положительным числом');
      });
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByTestId('cancel-btn'));

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('clears field errors when user types', async () => {
      render(<OrderForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} editOrder={mockOrder} />);

      // Trigger validation error
      fireEvent.change(screen.getByTestId('total-input'), { target: { value: '-10' } });
      fireEvent.click(screen.getByTestId('submit-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('total-error')).toBeInTheDocument();
      });

      // Type in the field to clear the error
      fireEvent.change(screen.getByTestId('total-input'), { target: { value: '150' } });

      expect(screen.queryByTestId('total-error')).not.toBeInTheDocument();
    });
  });
});