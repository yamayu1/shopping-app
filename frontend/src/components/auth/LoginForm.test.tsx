import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginForm from './LoginForm';
import { useAuth } from '../../contexts/AuthContext';

jest.mock('../../contexts/AuthContext');

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const defaultAuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  login: jest.fn(),
  register: jest.fn(),
  logout: jest.fn(),
  updateProfile: jest.fn(),
  clearError: jest.fn(),
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue(defaultAuthState);
  });

  it('renders login form with all fields', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    expect(screen.getByRole('heading', { name: 'ログイン' })).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ログイン/i })).toBeInTheDocument();
  });

  it('displays error message from auth context', () => {
    mockedUseAuth.mockReturnValue({
      ...defaultAuthState,
      error: 'ログインに失敗しました',
    });

    render(<BrowserRouter><LoginForm /></BrowserRouter>);

    expect(screen.getByText('ログインに失敗しました')).toBeInTheDocument();
  });

  it('shows validation errors for empty fields on submit', async () => {
    render(<BrowserRouter><LoginForm /></BrowserRouter>);

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('メールアドレスは必須項目です')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('パスワードは必須項目です')).toBeInTheDocument();
    });
  });

  it('calls login on valid form submission', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      ...defaultAuthState,
      login: mockLogin,
    });

    render(<BrowserRouter><LoginForm /></BrowserRouter>);

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    await userEvent.type(emailInput, 'test@example.com');

    const passwordInput = screen.getByLabelText(/パスワード/i);
    await userEvent.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password: 'password123',
        })
      );
    });
  });

  it('navigates to home on successful login', async () => {
    const mockLogin = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      ...defaultAuthState,
      login: mockLogin,
    });

    render(<BrowserRouter><LoginForm /></BrowserRouter>);

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    await userEvent.type(emailInput, 'test@example.com');

    const passwordInput = screen.getByLabelText(/パスワード/i);
    await userEvent.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
