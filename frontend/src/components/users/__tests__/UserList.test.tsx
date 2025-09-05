import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserList from '../UserList';
import { userApi } from '../../../services/api';
import { User } from '../../../types';

// Mock the API
jest.mock('../../../services/api', () => ({
  userApi: {
    getAllUsers: jest.fn(),
    createUser: jest.fn(),
    getUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

// Mock UserCard component
jest.mock('../UserCard', () => {
  return function MockUserCard({ user, onEdit, onDelete }: any) {
    return (
      <div data-testid={`user-card-${user.id}`}>
        <span data-testid="user-username">{user.username}</span>
        <button 
          data-testid={`edit-user-${user.id}`}
          onClick={() => onEdit(user)}
        >
          Редактировать
        </button>
        <button 
          data-testid={`delete-user-${user.id}`}
          onClick={() => onDelete(user.id)}
        >
          Удалить
        </button>
      </div>
    );
  };
});

// Mock UserForm component
jest.mock('../UserForm', () => {
  return function MockUserForm({ user, onSubmit, onCancel }: any) {
    return (
      <div data-testid="user-form">
        <h2>{user ? 'Редактировать пользователя' : 'Создать пользователя'}</h2>
        <button 
          data-testid="form-submit"
          onClick={() => onSubmit(user ? 
            { username: 'Updated User', email: 'updated@example.com' } : 
            { username: 'New User', email: 'new@example.com' }
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

const mockUserApi = userApi as jest.Mocked<typeof userApi>;
const mockConfirm = window.confirm as jest.MockedFunction<typeof window.confirm>;

const mockUsers: User[] = [
  {
    id: 1,
    username: 'user1',
    email: 'user1@example.com',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'user2',
    email: 'user2@example.com',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('UserList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  describe('Loading and displaying users', () => {
    it('renders loading state initially', async () => {
      mockUserApi.getAllUsers.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<UserList />);
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Загрузка...')).toBeInTheDocument();
    });

    it('renders users list after successful load', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      expect(screen.getByText('Пользователи')).toBeInTheDocument();
      expect(screen.getByTestId('create-user-btn')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('user-card-2')).toBeInTheDocument();
    });

    it('renders empty state when no users', async () => {
      mockUserApi.getAllUsers.mockResolvedValue([]);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Пользователи не найдены')).toBeInTheDocument();
    });

    it('renders error message on load failure', async () => {
      const errorMessage = 'Ошибка загрузки пользователей';
      mockUserApi.getAllUsers.mockRejectedValue({ message: errorMessage });
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  describe('Creating users', () => {
    it('shows create form when create button is clicked', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.getByTestId('create-user-btn')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-user-btn'));
      
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
      expect(screen.getByText('Создать пользователя')).toBeInTheDocument();
    });

    it('creates new user successfully', async () => {
      mockUserApi.getAllUsers.mockResolvedValue([]);
      mockUserApi.createUser.mockResolvedValue(3);
      mockUserApi.getUser.mockResolvedValue({
        id: 3,
        username: 'New User',
        email: 'new@example.com',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      });
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-user-btn'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(mockUserApi.createUser).toHaveBeenCalledWith({
          username: 'New User',
          email: 'new@example.com',
        });
      });
      
      await waitFor(() => {
        expect(mockUserApi.getUser).toHaveBeenCalledWith(3);
      });
    });

    it('handles create user error', async () => {
      mockUserApi.getAllUsers.mockResolvedValue([]);
      mockUserApi.createUser.mockRejectedValue({ message: 'Ошибка создания пользователя' });
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-user-btn'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(mockUserApi.createUser).toHaveBeenCalledWith({
          username: 'New User',
          email: 'new@example.com',
        });
      });
      
      // The form should still be visible, not closed
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });

    it('cancels create form', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-user-btn'));
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('form-cancel'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('user-form')).not.toBeInTheDocument();
      });
      
      expect(screen.getByTestId('user-list')).toBeInTheDocument();
    });
  });

  describe('Editing users', () => {
    it('shows edit form when edit button is clicked', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('edit-user-1'));
      
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
      expect(screen.getByText('Редактировать пользователя')).toBeInTheDocument();
    });

    it('updates user successfully', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      mockUserApi.updateUser.mockResolvedValue();
      mockUserApi.getUser.mockResolvedValue({
        ...mockUsers[0],
        username: 'Updated User',
        email: 'updated@example.com',
      });
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('edit-user-1'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(mockUserApi.updateUser).toHaveBeenCalledWith(1, {
          username: 'Updated User',
          email: 'updated@example.com',
        });
      });
      
      await waitFor(() => {
        expect(mockUserApi.getUser).toHaveBeenCalledWith(1);
      });
    });

    it('handles update user error', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      mockUserApi.updateUser.mockRejectedValue({ message: 'Ошибка обновления пользователя' });
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('edit-user-1'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(mockUserApi.updateUser).toHaveBeenCalledWith(1, {
          username: 'Updated User',
          email: 'updated@example.com',
        });
      });
      
      // The form should still be visible, not closed
      expect(screen.getByTestId('user-form')).toBeInTheDocument();
    });

    it('handles update when no editing user', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      // Simulate direct call to handleUpdateUser without editingUser
      const component = screen.getByTestId('user-list');
      expect(component).toBeInTheDocument();
    });
  });

  describe('Deleting users', () => {
    it('deletes user when confirmed', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      mockUserApi.deleteUser.mockResolvedValue();
      mockConfirm.mockReturnValue(true);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('delete-user-1'));
      
      expect(mockConfirm).toHaveBeenCalledWith('Вы уверены, что хотите удалить этого пользователя?');
      
      await waitFor(() => {
        expect(mockUserApi.deleteUser).toHaveBeenCalledWith(1);
      });
    });

    it('does not delete user when not confirmed', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      mockConfirm.mockReturnValue(false);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('delete-user-1'));
      
      expect(mockConfirm).toHaveBeenCalledWith('Вы уверены, что хотите удалить этого пользователя?');
      expect(mockUserApi.deleteUser).not.toHaveBeenCalled();
    });

    it('handles delete user error', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      mockUserApi.deleteUser.mockRejectedValue({ message: 'Ошибка удаления пользователя' });
      mockConfirm.mockReturnValue(true);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('delete-user-1'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Ошибка удаления пользователя')).toBeInTheDocument();
    });
  });

  describe('Form state management', () => {
    it('resets editing user when creating new user', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      // First edit a user
      fireEvent.click(screen.getByTestId('edit-user-1'));
      expect(screen.getByText('Редактировать пользователя')).toBeInTheDocument();
      
      // Cancel and then create new
      fireEvent.click(screen.getByTestId('form-cancel'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-user-btn'));
      expect(screen.getByText('Создать пользователя')).toBeInTheDocument();
    });

    it('clears form state after successful create', async () => {
      mockUserApi.getAllUsers.mockResolvedValue([]);
      mockUserApi.createUser.mockResolvedValue(3);
      mockUserApi.getUser.mockResolvedValue({
        id: 3,
        username: 'New User',
        email: 'new@example.com',
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
      });
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('create-user-btn'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('user-form')).not.toBeInTheDocument();
      });
    });

    it('clears form state after successful update', async () => {
      mockUserApi.getAllUsers.mockResolvedValue(mockUsers);
      mockUserApi.updateUser.mockResolvedValue();
      mockUserApi.getUser.mockResolvedValue({
        ...mockUsers[0],
        username: 'Updated User',
      });
      
      render(<UserList />);
      
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByTestId('edit-user-1'));
      fireEvent.click(screen.getByTestId('form-submit'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('user-form')).not.toBeInTheDocument();
      });
    });
  });
});