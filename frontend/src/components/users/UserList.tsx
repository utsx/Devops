import React, { useState, useEffect } from 'react';
import { User, CreateUserDto, UpdateUserDto, ApiError } from '../../types';
import { userApi } from '../../services/api';
import UserCard from './UserCard';
import UserForm from './UserForm';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const usersData = await userApi.getAllUsers();
        setUsers(usersData);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const handleCreateUser = async (userData: CreateUserDto) => {
    setFormLoading(true);
    setError(null);
    try {
      const userId = await userApi.createUser(userData);
      const newUser = await userApi.getUser(userId);
      setUsers(prev => [...prev, newUser]);
      setShowForm(false);
      setEditingUser(undefined);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      // Don't close form on error - keep it open so user can fix the issue
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateUser = async (userData: UpdateUserDto) => {
    if (!editingUser) return;
    
    setFormLoading(true);
    setError(null);
    try {
      await userApi.updateUser(editingUser.id, userData);
      const updatedUser = await userApi.getUser(editingUser.id);
      setUsers(prev => prev.map(user =>
        user.id === editingUser.id ? updatedUser : user
      ));
      setShowForm(false);
      setEditingUser(undefined);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
      // Don't close form on error - keep it open so user can fix the issue
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    setError(null);
    try {
      await userApi.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingUser(undefined);
  };

  const handleCreateNew = () => {
    setEditingUser(undefined);
    setShowForm(true);
  };

  const handleFormSubmit = async (userData: CreateUserDto | UpdateUserDto) => {
    if (editingUser) {
      await handleUpdateUser(userData as UpdateUserDto);
    } else {
      await handleCreateUser(userData as CreateUserDto);
    }
  };

  if (showForm) {
    return (
      <UserForm
        user={editingUser}
        onSubmit={handleFormSubmit}
        onCancel={handleCancelForm}
        isLoading={formLoading}
      />
    );
  }

  return (
    <div className="user-list" data-testid="user-list">
      <div className="user-list__header">
        <h1>Пользователи</h1>
        <button
          className="create-user-btn"
          onClick={handleCreateNew}
          data-testid="create-user-btn"
        >
          Создать пользователя
        </button>
      </div>

      {error && (
        <div className="error-message" data-testid="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading" data-testid="loading">
          Загрузка...
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          Пользователи не найдены
        </div>
      ) : (
        <div className="user-list__content">
          {users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserList;