import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import UserList from './components/users/UserList';
import OrderList from './components/orders/OrderList';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app" data-testid="app">
        <header className="app-header">
          <nav className="app-nav" data-testid="app-nav">
            <div className="nav-brand">
              <h1>Отслеживание покупок</h1>
            </div>
            <ul className="nav-links">
              <li>
                <Link to="/users" className="nav-link" data-testid="users-link">
                  Пользователи
                </Link>
              </li>
              <li>
                <Link to="/orders" className="nav-link" data-testid="orders-link">
                  Заказы
                </Link>
              </li>
            </ul>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/orders" element={<OrderList />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; 2024 Система отслеживания покупок</p>
        </footer>
      </div>
    </Router>
  );
};

const HomePage: React.FC = () => {
  return (
    <div className="home-page" data-testid="home-page">
      <div className="hero-section">
        <h1>Добро пожаловать в систему отслеживания покупок</h1>
        <p>
          Управляйте пользователями и отслеживайте заказы в вашем интернет-магазине
        </p>
        <div className="hero-actions">
          <Link to="/users" className="hero-btn" data-testid="hero-users-btn">
            Управление пользователями
          </Link>
          <Link to="/orders" className="hero-btn" data-testid="hero-orders-btn">
            Управление заказами
          </Link>
        </div>
      </div>
      
      <div className="features-section">
        <h2>Возможности системы</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Управление пользователями</h3>
            <p>Создавайте, редактируйте и удаляйте пользователей системы</p>
          </div>
          <div className="feature-card">
            <h3>Отслеживание заказов</h3>
            <p>Создавайте заказы и отслеживайте их статус доставки</p>
          </div>
          <div className="feature-card">
            <h3>Простой интерфейс</h3>
            <p>Интуитивно понятный интерфейс для эффективной работы</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;