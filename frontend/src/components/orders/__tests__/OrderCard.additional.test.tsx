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
const mockOnEdit = jest.fn();

describe('OrderCard - Additional Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Expand/Collapse functionality', () => {
    it('starts in collapsed state', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      // Details should not be visible initially
      expect(screen.queryByTestId('order-price')).not.toBeInTheDocument();
      expect(screen.queryByTestId('order-delivery')).not.toBeInTheDocument();
      expect(screen.queryByTestId('order-user')).not.toBeInTheDocument();
      expect(screen.queryByTestId('order-status')).not.toBeInTheDocument();
    });

    it('expands when expand button is clicked', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);

      // Details should be visible after expanding
      expect(screen.getByTestId('order-price')).toBeInTheDocument();
      expect(screen.getByTestId('order-delivery')).toBeInTheDocument();
      expect(screen.getByTestId('order-user')).toBeInTheDocument();
      expect(screen.getByTestId('order-status')).toBeInTheDocument();
    });

    it('collapses when expand button is clicked again', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      
      // Expand first
      fireEvent.click(expandButton);
      expect(screen.getByTestId('order-price')).toBeInTheDocument();

      // Collapse
      fireEvent.click(expandButton);
      expect(screen.queryByTestId('order-price')).not.toBeInTheDocument();
    });

    it('shows correct expand button text when collapsed', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      expect(expandButton).toHaveTextContent('▼');
    });

    it('shows correct expand button text when expanded', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);
      
      expect(expandButton).toHaveTextContent('▲');
    });
  });

  describe('Edit functionality', () => {
    it('calls onEdit when edit button is clicked', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const editButton = screen.getByTestId('edit-order-btn');
      fireEvent.click(editButton);

      expect(mockOnEdit).toHaveBeenCalledTimes(1);
      expect(mockOnEdit).toHaveBeenCalledWith(mockOrder);
    });

    it('displays edit button with correct text', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByTestId('edit-order-btn')).toHaveTextContent('Редактировать');
    });
  });

  describe('Edge cases and error handling', () => {
    it('handles zero price correctly', () => {
      const orderWithZeroPrice = { ...mockOrder, total: 0 };
      
      render(
        <OrderCard
          order={orderWithZeroPrice}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);

      expect(screen.getByTestId('order-price')).toHaveTextContent('0,00 ₽');
    });

    it('handles very small price correctly', () => {
      const orderWithSmallPrice = { ...mockOrder, total: 0.01 };
      
      render(
        <OrderCard
          order={orderWithSmallPrice}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);

      expect(screen.getByTestId('order-price')).toHaveTextContent('0,01 ₽');
    });

    it('handles very large price correctly', () => {
      const orderWithLargePrice = { ...mockOrder, total: 9999999.99 };
      
      render(
        <OrderCard
          order={orderWithLargePrice}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);

      expect(screen.getByTestId('order-price')).toHaveTextContent('9 999 999,99 ₽');
    });

    it('handles long product names correctly', () => {
      const orderWithLongName = { 
        ...mockOrder, 
        productName: 'Very Long Product Name That Should Be Displayed Correctly Without Breaking The Layout' 
      };
      
      render(
        <OrderCard
          order={orderWithLongName}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByTestId('order-product')).toHaveTextContent(orderWithLongName.productName);
    });

    it('handles edge case dates correctly', () => {
      const orderWithEdgeDate = { ...mockOrder, deliveryDate: '2024-02-29' }; // Leap year
      
      render(
        <OrderCard
          order={orderWithEdgeDate}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);

      expect(screen.getByTestId('order-delivery')).toHaveTextContent('29.02.2024');
    });

    it('handles year 2000 date correctly', () => {
      const orderWithY2KDate = { ...mockOrder, deliveryDate: '2000-01-01' };
      
      render(
        <OrderCard
          order={orderWithY2KDate}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);

      expect(screen.getByTestId('order-delivery')).toHaveTextContent('01.01.2000');
    });

    it('handles future year date correctly', () => {
      const orderWithFutureDate = { ...mockOrder, deliveryDate: '2030-12-31' };
      
      render(
        <OrderCard
          order={orderWithFutureDate}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);

      expect(screen.getByTestId('order-delivery')).toHaveTextContent('31.12.2030');
    });
  });

  describe('User ID display', () => {
    it('displays single digit user ID correctly', () => {
      const orderWithSingleDigitUserId = { ...mockOrder, userId: 5 };
      
      render(
        <OrderCard
          order={orderWithSingleDigitUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);

      expect(screen.getByTestId('order-user')).toHaveTextContent('5');
    });

    it('displays large user ID correctly', () => {
      const orderWithLargeUserId = { ...mockOrder, userId: 999999 };
      
      render(
        <OrderCard
          order={orderWithLargeUserId}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      fireEvent.click(expandButton);

      expect(screen.getByTestId('order-user')).toHaveTextContent('999999');
    });
  });

  describe('Component structure and accessibility', () => {
    it('has correct CSS classes', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const card = screen.getByTestId('order-card');
      expect(card).toHaveClass('order-card');
    });

    it('maintains proper button accessibility', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      const expandButton = screen.getByTestId('expand-order-btn');
      const editButton = screen.getByTestId('edit-order-btn');
      const deleteButton = screen.getByTestId('delete-order-btn');

      expect(expandButton).toBeEnabled();
      expect(editButton).toBeEnabled();
      expect(deleteButton).toBeEnabled();
    });

    it('renders all required elements', () => {
      render(
        <OrderCard
          order={mockOrder}
          onDelete={mockOnDelete}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByTestId('order-card')).toBeInTheDocument();
      expect(screen.getByTestId('order-product')).toBeInTheDocument();
      expect(screen.getByTestId('expand-order-btn')).toBeInTheDocument();
      expect(screen.getByTestId('edit-order-btn')).toBeInTheDocument();
      expect(screen.getByTestId('delete-order-btn')).toBeInTheDocument();
    });
  });
});