import React, { useState, useEffect } from 'react';
import { User, CreateUserDto, UpdateUserDto } from '../../types';

interface UserFormProps {
  user?: User;
  onSubmit: (userData: CreateUserDto | UpdateUserDto) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel, isLoading = false }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Имя пользователя обязательно';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Имя пользователя должно содержать минимум 3 символа';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="user-form" data-testid="user-form">
      <h2 data-testid="form-title">
        {user ? 'Редактировать пользователя' : 'Создать пользователя'}
      </h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Имя пользователя:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            data-testid="username-input"
            className={errors.username ? 'error' : ''}
          />
          {errors.username && (
            <span className="error-message" data-testid="username-error">
              {errors.username}
            </span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            data-testid="email-input"
            className={errors.email ? 'error' : ''}
          />
          {errors.email && (
            <span className="error-message" data-testid="email-error">
              {errors.email}
            </span>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            disabled={isLoading}
            data-testid="submit-btn"
            className="submit-btn"
          >
            {isLoading ? 'Сохранение...' : (user ? 'Обновить' : 'Создать')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            data-testid="cancel-btn"
            className="cancel-btn"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;