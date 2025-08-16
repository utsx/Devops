import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderCard from '../OrderCard';
import { Order, OrderStatus } from '../../../types';

const mockOrder: Order = {
  id: 1,
  userId: 123,
  productName: 'Test Product',
  deliveryDate: '2024-12-25',
  status: OrderStatus.CREATED,
  total: 1500.50,
};

const mockOnDelete = jest.fn();

describe('OrderCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders order information correctly', () => {
    render(
      <OrderCard
        order={mockOrder}
        onDelete={mockOnDelete}
        onEdit={() => {}}
      />
    );

    expect(screen.getByTestId('order-card')).toBeInTheDocument();
    expect(screen.getByTestId('order-product')).toHaveTextContent('Test Product');
    
    // Разворачиваем карточку для доступа к деталям
    const expandButton = screen.getByTestId('expand-order-btn');
    fireEvent.click(expandButton);
    
    expect(screen.getByTestId('order-price')).toHaveTextContent('1 500,50 ₽');
    expect(screen.getByTestId('order-delivery')).toHaveTextContent('25.12.2024');
    expect(screen.getByTestId('order-user')).toHaveTextContent('123');
    expect(screen.getByTestId('order-status')).toHaveTextContent('Создан');
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <OrderCard
        order={mockOrder}
        onDelete={mockOnDelete}
        onEdit={() => {}}
      />
    );

    const deleteButton = screen.getByTestId('delete-order-btn');
    fireEvent.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockOrder.id);
  });

  it('displays correct status for CREATED order', () => {
    const createdOrder = { ...mockOrder, status: OrderStatus.CREATED };
    
    render(
      <OrderCard
        order={createdOrder}
        onDelete={mockOnDelete}
        onEdit={() => {}}
      />
    );

    // Разворачиваем карточку для доступа к статусу
    const expandButton = screen.getByTestId('expand-order-btn');
    fireEvent.click(expandButton);

    const statusElement = screen.getByTestId('order-status');
    expect(statusElement).toHaveTextContent('Создан');
    expect(statusElement).toHaveClass('status-badge', 'status-created');
  });

  it('displays correct status for DELIVERED order', () => {
    const deliveredOrder = { ...mockOrder, status: OrderStatus.DELIVERED };
    
    render(
      <OrderCard
        order={deliveredOrder}
        onDelete={mockOnDelete}
        onEdit={() => {}}
      />
    );

    // Разворачиваем карточку для доступа к статусу
    const expandButton = screen.getByTestId('expand-order-btn');
    fireEvent.click(expandButton);

    const statusElement = screen.getByTestId('order-status');
    expect(statusElement).toHaveTextContent('Доставлен');
    expect(statusElement).toHaveClass('status-badge', 'status-delivered');
  });

  it('displays correct status for CANCELLED order', () => {
    const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };
    
    render(
      <OrderCard
        order={cancelledOrder}
        onDelete={mockOnDelete}
        onEdit={() => {}}
      />
    );

    // Разворачиваем карточку для доступа к статусу
    const expandButton = screen.getByTestId('expand-order-btn');
    fireEvent.click(expandButton);

    const statusElement = screen.getByTestId('order-status');
    expect(statusElement).toHaveTextContent('Отменен');
    expect(statusElement).toHaveClass('status-badge', 'status-cancelled');
  });

  it('formats price correctly', () => {
    const orderWithDifferentPrice = { ...mockOrder, total: 999.99 };
    
    render(
      <OrderCard
        order={orderWithDifferentPrice}
        onDelete={mockOnDelete}
        onEdit={() => {}}
      />
    );

    // Разворачиваем карточку для доступа к цене
    const expandButton = screen.getByTestId('expand-order-btn');
    fireEvent.click(expandButton);

    expect(screen.getByTestId('order-price')).toHaveTextContent('999,99 ₽');
  });

  it('formats date correctly', () => {
    const orderWithDifferentDate = { ...mockOrder, deliveryDate: '2024-01-15' };
    
    render(
      <OrderCard
        order={orderWithDifferentDate}
        onDelete={mockOnDelete}
        onEdit={() => {}}
      />
    );

    // Разворачиваем карточку для доступа к дате
    const expandButton = screen.getByTestId('expand-order-btn');
    fireEvent.click(expandButton);

    expect(screen.getByTestId('order-delivery')).toHaveTextContent('15.01.2024');
  });

  it('displays delete button with correct text', () => {
    render(
      <OrderCard
        order={mockOrder}
        onDelete={mockOnDelete}
        onEdit={() => {}}
      />
    );

    expect(screen.getByTestId('delete-order-btn')).toHaveTextContent('Удалить');
  });

  it('handles large price values correctly', () => {
    const orderWithLargePrice = { ...mockOrder, total: 1234567.89 };
    
    render(
      <OrderCard
        order={orderWithLargePrice}
        onDelete={mockOnDelete}
        onEdit={() => {}}
      />
    );

    // Разворачиваем карточку для доступа к цене
    const expandButton = screen.getByTestId('expand-order-btn');
    fireEvent.click(expandButton);

    expect(screen.getByTestId('order-price')).toHaveTextContent('1 234 567,89 ₽');
  });
});