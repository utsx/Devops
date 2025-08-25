import React, { useState, useEffect } from 'react';
import { CreateOrderDto, UpdateOrderDto, OrderStatus, User, ApiError, Order } from '../../types';
import { userApi } from '../../services/api';

interface OrderFormProps {
  onSubmit: (orderData: CreateOrderDto | UpdateOrderDto) => void;
  onCancel: () => void;
  isLoading?: boolean;
  editOrder?: Order;
}

const OrderForm: React.FC<OrderFormProps> = ({ onSubmit, onCancel, isLoading = false, editOrder }) => {
  const [formData, setFormData] = useState({
    userId: editOrder?.userId.toString() || '',
    product_name: editOrder?.productName || '',
    delivery_date: editOrder?.deliveryDate || '',
    status: editOrder?.status || OrderStatus.CREATED,
    total: editOrder?.total?.toString() || '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      setUsersLoading(true);
      setUsersError(null);
      try {
        const usersData = await userApi.getAllUsers();
        console.log('Loaded users:', usersData);
        setUsers(usersData);
      } catch (err) {
        const apiError = err as ApiError;
        setUsersError(apiError.message);
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.userId.trim()) {
      newErrors.userId = 'Выберите пользователя';
    }

    if (!formData.product_name.trim()) {
      newErrors.product_name = 'Название продукта обязательно';
    } else if (formData.product_name.length < 2) {
      newErrors.product_name = 'Название продукта должно содержать минимум 2 символа';
    }

    if (!formData.delivery_date) {
      newErrors.delivery_date = 'Дата доставки обязательна';
    } else {
      const deliveryDate = new Date(formData.delivery_date);
      if (editOrder) {
        // При редактировании проверяем, что новая дата не раньше текущей даты заказа
        const currentOrderDate = new Date(editOrder.deliveryDate);
        if (deliveryDate < currentOrderDate) {
          newErrors.delivery_date = 'Дата доставки не может быть перенесена на более раннюю дату';
        }
      } else {
        // При создании проверяем, что дата не в прошлом
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (deliveryDate < today) {
          newErrors.delivery_date = 'Дата доставки не может быть в прошлом';
        }
      }
    }

    if (!formData.total.trim()) {
      newErrors.total = 'Сумма заказа обязательна';
    } else if (isNaN(Number(formData.total)) || Number(formData.total) <= 0) {
      newErrors.total = 'Сумма заказа должна быть положительным числом';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      if (editOrder) {
        // При редактировании отправляем только изменяемые поля
        const updateData: UpdateOrderDto = {
          delivery_date: formData.delivery_date,
          total: Number(formData.total),
        };
        onSubmit(updateData);
      } else {
        // При создании отправляем все поля
        const orderData: CreateOrderDto = {
          userId: Number(formData.userId),
          product_name: formData.product_name,
          delivery_date: formData.delivery_date,
          status: formData.status,
          total: Number(formData.total),
        };
        onSubmit(orderData);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="order-form" data-testid="order-form">
      <h2 data-testid="form-title">{editOrder ? 'Редактировать заказ' : 'Создать заказ'}</h2>
      <form onSubmit={handleSubmit}>
        {!editOrder && (
          <>
            <div className="form-group">
              <label htmlFor="userId">Пользователь:</label>
              {usersLoading ? (
                <div className="loading-users">Загрузка пользователей...</div>
              ) : usersError ? (
                <div className="error-message">Ошибка загрузки пользователей: {usersError}</div>
              ) : (
                <select
                  id="userId"
                  name="userId"
                  value={formData.userId}
                  onChange={handleChange}
                  data-testid="userId-select"
                  className={errors.userId ? 'error' : ''}
                >
                  <option value="">Выберите пользователя</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id.toString()}>
                      {user.username} ({user.email})
                    </option>
                  ))}
                </select>
              )}
              {errors.userId && (
                <span className="error-message" data-testid="userId-error">
                  {errors.userId}
                </span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="product_name">Название продукта:</label>
              <input
                type="text"
                id="product_name"
                name="product_name"
                value={formData.product_name}
                onChange={handleChange}
                data-testid="product-name-input"
                className={errors.product_name ? 'error' : ''}
              />
              {errors.product_name && (
                <span className="error-message" data-testid="product-name-error">
                  {errors.product_name}
                </span>
              )}
            </div>
          </>
        )}

        {editOrder && (
          <div className="form-group">
            <label>Название продукта:</label>
            <div className="readonly-field">{editOrder.productName}</div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="delivery_date">Дата доставки:</label>
          <input
            type="date"
            id="delivery_date"
            name="delivery_date"
            value={formData.delivery_date}
            onChange={handleChange}
            data-testid="delivery-date-input"
            className={errors.delivery_date ? 'error' : ''}
          />
          {errors.delivery_date && (
            <span className="error-message" data-testid="delivery-date-error">
              {errors.delivery_date}
            </span>
          )}
        </div>

        {!editOrder && (
          <div className="form-group">
            <label htmlFor="status">Статус:</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              data-testid="status-select"
            >
              <option value={OrderStatus.CREATED}>Создан</option>
              <option value={OrderStatus.DELIVERED}>Доставлен</option>
              <option value={OrderStatus.CANCELLED}>Отменен</option>
            </select>
          </div>
        )}

        {editOrder && (
          <div className="form-group">
            <label>Статус:</label>
            <div className="readonly-field">
              {editOrder.status === OrderStatus.CREATED && 'Создан'}
              {editOrder.status === OrderStatus.DELIVERED && 'Доставлен'}
              {editOrder.status === OrderStatus.CANCELLED && 'Отменен'}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="total">Сумма заказа:</label>
          <input
            type="number"
            id="total"
            name="total"
            value={formData.total}
            onChange={handleChange}
            data-testid="total-input"
            className={errors.total ? 'error' : ''}
            min="0.01"
            step="0.01"
          />
          {errors.total && (
            <span className="error-message" data-testid="total-error">
              {errors.total}
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
            {isLoading ? (editOrder ? 'Сохранение...' : 'Создание...') : (editOrder ? 'Сохранить изменения' : 'Создать заказ')}
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

export default OrderForm;