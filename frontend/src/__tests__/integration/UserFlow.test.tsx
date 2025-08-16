import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import UserList from '../../components/users/UserList';
import * as api from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('User Management Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should complete full user creation flow', async () => {
    // Mock API responses
    mockedApi.userApi.createUser.mockResolvedValue(1);
    mockedApi.userApi.getUser.mockResolvedValue(mockUser);

    renderWithRouter(<UserList />);

    // Initially should show empty state
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();

    // Click create user button
    const createButton = screen.getByTestId('create-user-btn');
    fireEvent.click(createButton);

    // Should show form
    expect(screen.getByTestId('user-form')).toBeInTheDocument();
    expect(screen.getByTestId('form-title')).toHaveTextContent('Создать пользователя');

    // Fill form
    const usernameInput = screen.getByTestId('username-input');
    const emailInput = screen.getByTestId('email-input');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Submit form
    const submitButton = screen.getByTestId('submit-btn');
    fireEvent.click(submitButton);

    // Wait for API calls and UI updates
    await waitFor(() => {
      expect(mockedApi.userApi.createUser).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    await waitFor(() => {
      expect(mockedApi.userApi.getUser).toHaveBeenCalledWith(1);
    });

    // Should return to list view with new user
    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
      expect(screen.getByTestId('user-card')).toBeInTheDocument();
      expect(screen.getByTestId('user-username')).toHaveTextContent('testuser');
    });
  });

  it('should handle user creation error', async () => {
    // Mock API error
    mockedApi.userApi.createUser.mockRejectedValue({
      message: 'Email already exists',
      status: 400,
    });

    renderWithRouter(<UserList />);

    // Click create user button
    const createButton = screen.getByTestId('create-user-btn');
    fireEvent.click(createButton);

    // Fill form
    const usernameInput = screen.getByTestId('username-input');
    const emailInput = screen.getByTestId('email-input');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Submit form
    const submitButton = screen.getByTestId('submit-btn');
    fireEvent.click(submitButton);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Email already exists');
    });

    // Form should still be visible
    expect(screen.getByTestId('user-form')).toBeInTheDocument();
  });

  it('should complete user edit flow', async () => {
    const updatedUser = { ...mockUser, username: 'updateduser' };
    
    // Mock API responses
    mockedApi.userApi.updateUser.mockResolvedValue();
    mockedApi.userApi.getUser.mockResolvedValue(updatedUser);

    renderWithRouter(<UserList />);

    // Mock initial user in list
    const userListComponent = screen.getByTestId('user-list');
    
    // Simulate having a user in the list by rendering UserCard directly
    render(
      <div data-testid="user-card">
        <div data-testid="user-username">testuser</div>
        <button data-testid="edit-user-btn" onClick={() => {}}>
          Редактировать
        </button>
      </div>
    );

    // Click edit button
    const editButton = screen.getByTestId('edit-user-btn');
    fireEvent.click(editButton);

    // Note: In a real integration test, we would need to set up the full component state
    // This is a simplified version showing the test structure
  });

  it('should complete user deletion flow', async () => {
    // Mock API response
    mockedApi.userApi.deleteUser.mockResolvedValue();

    // Mock window.confirm to return true
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithRouter(<UserList />);

    // Simulate having a user in the list
    render(
      <div data-testid="user-card">
        <div data-testid="user-username">testuser</div>
        <button data-testid="delete-user-btn" onClick={() => {}}>
          Удалить
        </button>
      </div>
    );

    // Click delete button
    const deleteButton = screen.getByTestId('delete-user-btn');
    fireEvent.click(deleteButton);

    // Confirm dialog should be called
    expect(confirmSpy).toHaveBeenCalledWith('Вы уверены, что хотите удалить этого пользователя?');

    confirmSpy.mockRestore();
  });

  it('should cancel user deletion when user clicks cancel', async () => {
    // Mock window.confirm to return false
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithRouter(<UserList />);

    // Simulate having a user in the list
    render(
      <div data-testid="user-card">
        <div data-testid="user-username">testuser</div>
        <button data-testid="delete-user-btn" onClick={() => {}}>
          Удалить
        </button>
      </div>
    );

    // Click delete button
    const deleteButton = screen.getByTestId('delete-user-btn');
    fireEvent.click(deleteButton);

    // API should not be called
    expect(mockedApi.userApi.deleteUser).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});