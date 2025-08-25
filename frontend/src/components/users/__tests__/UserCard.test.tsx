import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserCard from '../UserCard';
import { User } from '../../../types';

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();

describe('UserCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user information correctly', () => {
    act(() => {
      render(
        <UserCard
          user={mockUser}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
    });

    expect(screen.getByTestId('user-card')).toBeInTheDocument();
    expect(screen.getByTestId('user-username')).toHaveTextContent('testuser');
    
    // Разворачиваем карточку для доступа к деталям
    act(() => {
      const expandButton = screen.getByTestId('expand-user-btn');
      fireEvent.click(expandButton);
    });
    
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    expect(screen.getByTestId('user-created')).toHaveTextContent('01.01.2024');
    expect(screen.getByTestId('user-updated')).toHaveTextContent('02.01.2024');
  });

  it('calls onEdit when edit button is clicked', () => {
    act(() => {
      render(
        <UserCard
          user={mockUser}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
    });

    act(() => {
      const editButton = screen.getByTestId('edit-user-btn');
      fireEvent.click(editButton);
    });

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith(mockUser);
  });

  it('calls onDelete when delete button is clicked', () => {
    act(() => {
      render(
        <UserCard
          user={mockUser}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
    });

    act(() => {
      const deleteButton = screen.getByTestId('delete-user-btn');
      fireEvent.click(deleteButton);
    });

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith(mockUser.id);
  });

  it('formats dates correctly', () => {
    const userWithDifferentDates: User = {
      ...mockUser,
      createdAt: '2023-12-25T15:30:00Z',
      updatedAt: '2024-03-15T09:45:00Z',
    };

    act(() => {
      render(
        <UserCard
          user={userWithDifferentDates}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
    });

    // Разворачиваем карточку для доступа к датам
    act(() => {
      const expandButton = screen.getByTestId('expand-user-btn');
      fireEvent.click(expandButton);
    });

    expect(screen.getByTestId('user-created')).toHaveTextContent('25.12.2023');
    expect(screen.getByTestId('user-updated')).toHaveTextContent('15.03.2024');
  });

  it('displays correct button text', () => {
    act(() => {
      render(
        <UserCard
          user={mockUser}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
    });

    expect(screen.getByTestId('edit-user-btn')).toHaveTextContent('Редактировать');
    expect(screen.getByTestId('delete-user-btn')).toHaveTextContent('Удалить');
  });

  it('toggles expanded state when expand button is clicked', () => {
    act(() => {
      render(
        <UserCard
          user={mockUser}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      );
    });

    // Изначально детали скрыты
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-created')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-updated')).not.toBeInTheDocument();

    // Разворачиваем карточку
    act(() => {
      const expandButton = screen.getByTestId('expand-user-btn');
      fireEvent.click(expandButton);
    });

    // Теперь детали видны
    expect(screen.getByTestId('user-email')).toBeInTheDocument();
    expect(screen.getByTestId('user-created')).toBeInTheDocument();
    expect(screen.getByTestId('user-updated')).toBeInTheDocument();

    // Сворачиваем карточку обратно
    act(() => {
      const expandButton = screen.getByTestId('expand-user-btn');
      fireEvent.click(expandButton);
    });

    // Детали снова скрыты
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-created')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-updated')).not.toBeInTheDocument();
  });
});