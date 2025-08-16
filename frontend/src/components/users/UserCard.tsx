import React, { useState } from 'react';
import { User } from '../../types';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: number) => void;
}

const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="user-card" data-testid="user-card">
      <div className="user-card__header">
        <h3 className="user-card__username" data-testid="user-username">
          {user.username}
        </h3>
        <div className="user-card__actions">
          <button
            className="user-card__expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="expand-user-btn"
            aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
          <button
            className="user-card__edit-btn"
            onClick={() => onEdit(user)}
            data-testid="edit-user-btn"
          >
            Редактировать
          </button>
          <button
            className="user-card__delete-btn"
            onClick={() => onDelete(user.id)}
            data-testid="delete-user-btn"
          >
            Удалить
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="user-card__content user-card__content--expanded">
          <p className="user-card__email" data-testid="user-email">
            <strong>Email:</strong> {user.email}
          </p>
          <p className="user-card__created" data-testid="user-created">
            <strong>Создан:</strong> {formatDate(user.createdAt)}
          </p>
          <p className="user-card__updated" data-testid="user-updated">
            <strong>Обновлен:</strong> {formatDate(user.updatedAt)}
          </p>
        </div>
      )}
    </div>
  );
};

export default UserCard;