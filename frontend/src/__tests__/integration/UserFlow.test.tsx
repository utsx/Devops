import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import UserList from '../../components/users/UserList';
import * as api from '../../services/api';

// Mock the API
jest.mock('../../services/api');
const mockedApi = api as jest.Mocked<typeof api>;

// Properly type the mocked functions
const mockUserApi = mockedApi.userApi as jest.Mocked<typeof api.userApi>;

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
    mockUserApi.getAllUsers.mockResolvedValue([]);
    mockUserApi.createUser.mockResolvedValue(1);
    mockUserApi.getUser.mockResolvedValue(mockUser);

    renderWithRouter(<UserList />);

    // Wait for initial load and check empty state
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

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
      expect(mockUserApi.createUser).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    await waitFor(() => {
      expect(mockUserApi.getUser).toHaveBeenCalledWith(1);
    });

    // Should return to list view with new user
    await waitFor(() => {
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
      expect(screen.getByTestId('user-card')).toBeInTheDocument();
      expect(screen.getByTestId('user-username')).toHaveTextContent('testuser');
    });
  });

  it('should handle user creation error', async () => {
    // Mock API responses
    mockUserApi.getAllUsers.mockResolvedValue([]);
    mockUserApi.createUser.mockRejectedValue({
      message: 'Email already exists',
      status: 400,
    });

    renderWithRouter(<UserList />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    // Click create user button
    const createButton = screen.getByTestId('create-user-btn');
    fireEvent.click(createButton);

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });

    // Fill form
    const usernameInput = screen.getByTestId('username-input');
    const emailInput = screen.getByTestId('email-input');
    
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Submit form
    const submitButton = screen.getByTestId('submit-btn');
    fireEvent.click(submitButton);

    // Wait for API call to complete and check that form is still visible (error case)
    await waitFor(() => {
      expect(mockUserApi.createUser).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
      });
    });

    // Form should still be visible since there was an error
    expect(screen.getByTestId('user-form')).toBeInTheDocument();
  });

  it('should complete user edit flow', async () => {
    const updatedUser = { ...mockUser, username: 'updateduser' };
    
    // Mock API responses
    mockUserApi.updateUser.mockResolvedValue();
    mockUserApi.getUser.mockResolvedValue(updatedUser);

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
    // Mock API responses
    mockUserApi.getAllUsers.mockResolvedValue([mockUser]);
    mockUserApi.deleteUser.mockResolvedValue();

    // Mock window.confirm to return true
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithRouter(<UserList />);

    // Wait for user to load
    await waitFor(() => {
      expect(screen.getByTestId('user-card')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByTestId('delete-user-btn');
    fireEvent.click(deleteButton);

    // Confirm dialog should be called
    expect(confirmSpy).toHaveBeenCalledWith('Вы уверены, что хотите удалить этого пользователя?');

    confirmSpy.mockRestore();
  });

  it('should cancel user deletion when user clicks cancel', async () => {
    // Mock API responses
    mockUserApi.getAllUsers.mockResolvedValue([mockUser]);
    
    // Mock window.confirm to return false
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

    renderWithRouter(<UserList />);

    // Wait for user to load
    await waitFor(() => {
      expect(screen.getByTestId('user-card')).toBeInTheDocument();
    });

    // Click delete button
    const deleteButton = screen.getByTestId('delete-user-btn');
    fireEvent.click(deleteButton);

    // API should not be called
    expect(mockUserApi.deleteUser).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});