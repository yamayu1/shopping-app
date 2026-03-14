import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

// 子コンポーネントをモック
jest.mock('../pages/HomePage', () => ({
  __esModule: true,
  default: () => <div data-testid="home-page">Home Page</div>,
}));

jest.mock('../components/layout/Header', () => ({
  __esModule: true,
  default: () => <div data-testid="header">Header</div>,
}));

jest.mock('../components/layout/Footer', () => ({
  __esModule: true,
  default: () => <div data-testid="footer">Footer</div>,
}));

jest.mock('../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  }),
}));

// CartContextをモック
jest.mock('../contexts/CartContext', () => ({
  CartProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// ThemeContextをモック
jest.mock('../contexts/ThemeContext', () => ({
  CustomThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const renderApp = () => {
  return render(<App />);
};

describe('App Component', () => {
  beforeEach(() => {
    // 各テスト前にモックをクリア
    jest.clearAllMocks();
  });

  test('renders app without crashing', () => {
    renderApp();
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  test('renders home page by default', () => {
    renderApp();
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  test('has proper app structure', () => {
    const { container } = renderApp();
    
    // メインのアプリ構造が存在するか確認
    expect(container.querySelector('main')).toBeInTheDocument();
  });
});