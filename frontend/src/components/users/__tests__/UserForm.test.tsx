import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserForm from '../UserForm';
import { User } from '../../../types';

const mockOnSubmit = jest.fn();
const mockOnCancel = jest.fn();

const mockUser: User = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

describe('UserForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form correctly', () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('user-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-title')).toHaveTextContent('Создать пользователя');
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Создать');
    expect(screen.getByTestId('cancel-btn')).toHaveTextContent('Отмена');
  });

  it('renders edit form correctly', () => {
    render(
      <UserForm
        user={mockUser}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByTestId('form-title')).toHaveTextContent('Редактировать пользователя');
    expect(screen.getByTestId('username-input')).toHaveValue('testuser');
    expect(screen.getByTestId('email-input')).toHaveValue('test@example.com');
    expect(screen.getByTestId('submit-btn')).toHaveTextContent('Обновить');
  });

  it('validates required fields', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByTestId('submit-btn');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toHaveTextContent('Имя пользователя обязательно');
      expect(screen.getByTestId('email-error')).toHaveTextContent('Email обязателен');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates username length', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const usernameInput = screen.getByTestId('username-input');
    fireEvent.change(usernameInput, { target: { value: 'ab' } });

    const submitButton = screen.getByTestId('submit-btn');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toHaveTextContent('Имя пользователя должно содержать минимум 3 символа');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const emailInput = screen.getByTestId('email-input');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const submitButton = screen.getByTestId('submit-btn');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent('Некорректный формат email');
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('submits valid form data', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const usernameInput = screen.getByTestId('username-input');
    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('submit-btn');

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'newuser@example.com',
      });
    });
  });

  it('calls onCancel when cancel button is clicked', () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByTestId('cancel-btn');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('clears errors when input changes', async () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
      />
    );

    const submitButton = screen.getByTestId('submit-btn');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toBeInTheDocument();
    });

    const usernameInput = screen.getByTestId('username-input');
    fireEvent.change(usernameInput, { target: { value: 'test' } });

    expect(screen.queryByTestId('username-error')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <UserForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isLoading={true}
      />
    );

    const submitButton = screen.getByTestId('submit-btn');
    const cancelButton = screen.getByTestId('cancel-btn');

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Сохранение...');
    expect(cancelButton).toBeDisabled();
  });
});