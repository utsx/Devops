import React, { useState } from 'react';
import { Order, OrderStatus } from '../../types';

interface OrderCardProps {
  order: Order;
  onDelete: (id: number) => void;
  onEdit: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, onDelete, onEdit }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(price);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CREATED:
        return 'status-created';
      case OrderStatus.DELIVERED:
        return 'status-delivered';
      case OrderStatus.CANCELLED:
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.CREATED:
        return 'Создан';
      case OrderStatus.DELIVERED:
        return 'Доставлен';
      case OrderStatus.CANCELLED:
        return 'Отменен';
      default:
        return status;
    }
  };

  return (
    <div className="order-card" data-testid="order-card">
      <div className="order-card__header">
        <h3 className="order-card__product" data-testid="order-product">
          {order.productName}
        </h3>
        <div className="order-card__actions">
          <button
            className="order-card__expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="expand-order-btn"
            aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button
            className="order-card__edit-btn"
            onClick={() => onEdit(order)}
            data-testid="edit-order-btn"
          >
            Редактировать
          </button>
          <button
            className="order-card__delete-btn"
            onClick={() => onDelete(order.id)}
            data-testid="delete-order-btn"
          >
            Удалить
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="order-card__content order-card__content--expanded">
          <div className="order-card__info">
            <p className="order-card__price" data-testid="order-price">
              <strong>Сумма:</strong> {formatPrice(order.total)}
            </p>
            <p className="order-card__delivery" data-testid="order-delivery">
              <strong>Дата доставки:</strong> {formatDate(order.deliveryDate)}
            </p>
            <p className="order-card__user" data-testid="order-user">
              <strong>ID пользователя:</strong> {order.userId}
            </p>
          </div>
          <div className="order-card__status">
            <span
              className={`status-badge ${getStatusColor(order.status)}`}
              data-testid="order-status"
            >
              {getStatusText(order.status)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderCard;