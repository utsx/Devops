import React, { useState, useEffect } from 'react';
import { Order, CreateOrderDto, UpdateOrderDto, ApiError } from '../../types';
import { orderApi } from '../../services/api';
import OrderCard from './OrderCard';
import OrderForm from './OrderForm';

const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const ordersData = await orderApi.getAllOrders();
        setOrders(ordersData);
      } catch (err) {
        const apiError = err as ApiError;
        setError(apiError.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleCreateOrder = async (orderData: CreateOrderDto) => {
    setFormLoading(true);
    setError(null);
    try {
      const orderId = await orderApi.createOrder(orderData);
      const newOrder = await orderApi.getOrder(orderId);
      setOrders(prev => [...prev, newOrder]);
      setShowForm(false);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateOrder = async (updateData: UpdateOrderDto) => {
    if (!editingOrder) return;
    
    setFormLoading(true);
    setError(null);
    try {
      await orderApi.updateOrder(editingOrder.id, updateData);
      const updatedOrder = await orderApi.getOrder(editingOrder.id);
      setOrders(prev => prev.map(order =>
        order.id === editingOrder.id ? updatedOrder : order
      ));
      setEditingOrder(null);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitForm = async (data: CreateOrderDto | UpdateOrderDto) => {
    if (editingOrder) {
      await handleUpdateOrder(data as UpdateOrderDto);
    } else {
      await handleCreateOrder(data as CreateOrderDto);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот заказ?')) {
      return;
    }

    setError(null);
    try {
      await orderApi.deleteOrder(id);
      setOrders(prev => prev.filter(order => order.id !== id));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingOrder(null);
  };

  const handleCreateNew = () => {
    setEditingOrder(null);
    setShowForm(true);
  };

  if (showForm || editingOrder) {
    return (
      <OrderForm
        onSubmit={handleSubmitForm}
        onCancel={handleCancelForm}
        isLoading={formLoading}
        editOrder={editingOrder || undefined}
      />
    );
  }

  return (
    <div className="order-list" data-testid="order-list">
      <div className="order-list__header">
        <h1>Заказы</h1>
        <button
          className="create-order-btn"
          onClick={handleCreateNew}
          data-testid="create-order-btn"
        >
          Создать заказ
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
      ) : orders.length === 0 ? (
        <div className="empty-state" data-testid="empty-state">
          Заказы не найдены
        </div>
      ) : (
        <div className="order-list__content">
          {orders.map(order => (
            <OrderCard
              key={order.id}
              order={order}
              onDelete={handleDeleteOrder}
              onEdit={handleEditOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderList;