import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div data-testid="router">{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div data-testid="routes">{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div data-testid="route">{element}</div>,
  Link: ({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: any }) => (
    <a href={to} {...props}>{children}</a>
  ),
}));

// Mock components
jest.mock('../components/users/UserList', () => {
  return function MockUserList() {
    return <div data-testid="user-list-mock">UserList Component</div>;
  };
});

jest.mock('../components/orders/OrderList', () => {
  return function MockOrderList() {
    return <div data-testid="order-list-mock">OrderList Component</div>;
  };
});

describe('App', () => {
  it('renders app structure correctly', () => {
    render(<App />);

    expect(screen.getByTestId('app')).toBeInTheDocument();
    expect(screen.getByTestId('app-nav')).toBeInTheDocument();
    expect(screen.getByText('Отслеживание покупок')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<App />);

    expect(screen.getByTestId('users-link')).toBeInTheDocument();
    expect(screen.getByTestId('users-link')).toHaveTextContent('Пользователи');
    expect(screen.getByTestId('users-link')).toHaveAttribute('href', '/users');

    expect(screen.getByTestId('orders-link')).toBeInTheDocument();
    expect(screen.getByTestId('orders-link')).toHaveTextContent('Заказы');
    expect(screen.getByTestId('orders-link')).toHaveAttribute('href', '/orders');
  });

  it('renders footer', () => {
    render(<App />);

    expect(screen.getByText('© 2024 Система отслеживания покупок')).toBeInTheDocument();
  });

  it('renders home page content', () => {
    render(<App />);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByText('Добро пожаловать в систему отслеживания покупок')).toBeInTheDocument();
    expect(screen.getByText('Управляйте пользователями и отслеживайте заказы в вашем интернет-магазине')).toBeInTheDocument();
  });

  it('renders hero action buttons', () => {
    render(<App />);

    expect(screen.getByTestId('hero-users-btn')).toBeInTheDocument();
    expect(screen.getByTestId('hero-users-btn')).toHaveTextContent('Управление пользователями');
    expect(screen.getByTestId('hero-users-btn')).toHaveAttribute('href', '/users');

    expect(screen.getByTestId('hero-orders-btn')).toBeInTheDocument();
    expect(screen.getByTestId('hero-orders-btn')).toHaveTextContent('Управление заказами');
    expect(screen.getByTestId('hero-orders-btn')).toHaveAttribute('href', '/orders');
  });

  it('renders features section', () => {
    render(<App />);

    expect(screen.getByText('Возможности системы')).toBeInTheDocument();
    expect(screen.getAllByText('Управление пользователями')).toHaveLength(2); // Один в кнопке, один в заголовке
    expect(screen.getByText('Создавайте, редактируйте и удаляйте пользователей системы')).toBeInTheDocument();
    expect(screen.getByText('Отслеживание заказов')).toBeInTheDocument();
    expect(screen.getByText('Создавайте заказы и отслеживайте их статус доставки')).toBeInTheDocument();
    expect(screen.getByText('Простой интерфейс')).toBeInTheDocument();
    expect(screen.getByText('Интуитивно понятный интерфейс для эффективной работы')).toBeInTheDocument();
  });

  it('has correct app structure', () => {
    render(<App />);

    const app = screen.getByTestId('app');
    expect(app).toHaveClass('app');

    // Check if main sections are present
    expect(screen.getByRole('banner')).toBeInTheDocument(); // header
    expect(screen.getByRole('main')).toBeInTheDocument(); // main
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer
  });
});