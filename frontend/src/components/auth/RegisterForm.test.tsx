import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RegisterForm from './RegisterForm';
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

const renderRegisterForm = () => {
  return render(
    <BrowserRouter>
      <RegisterForm />
    </BrowserRouter>
  );
};

describe('RegisterForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue(defaultAuthState);
  });

  it('renders all form fields', () => {
    renderRegisterForm();

    expect(screen.getByRole('heading', { name: 'アカウント作成' })).toBeInTheDocument();
    expect(screen.getByLabelText(/名前/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/苗字/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/電話番号/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^パスワード$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/パスワード確認/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /アカウント作成/i })
    ).toBeInTheDocument();
  });

  it('displays error message from auth context', () => {
    mockedUseAuth.mockReturnValue({
      ...defaultAuthState,
      error: '登録に失敗しました',
    });

    renderRegisterForm();

    expect(screen.getByText('登録に失敗しました')).toBeInTheDocument();
  });

  it('shows password mismatch error', async () => {
    renderRegisterForm();

    const firstNameInput = screen.getByLabelText(/名前/i);
    await userEvent.type(firstNameInput, 'Taro');

    const lastNameInput = screen.getByLabelText(/苗字/i);
    await userEvent.type(lastNameInput, 'Yamada');

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    await userEvent.type(emailInput, 'test@example.com');

    const phoneInput = screen.getByLabelText(/電話番号/i);
    await userEvent.type(phoneInput, '090-1234-5678');

    const passwordInput = screen.getByLabelText(/^パスワード$/i);
    await userEvent.type(passwordInput, 'password123');

    const confirmInput = screen.getByLabelText(/パスワード確認/i);
    await userEvent.type(confirmInput, 'different123');

    const submitButton = screen.getByRole('button', { name: /アカウント作成/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('パスワードが一致しません')).toBeInTheDocument();
    });
  });

  it('calls register on valid form submission', async () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      ...defaultAuthState,
      register: mockRegister,
    });

    renderRegisterForm();

    await userEvent.type(screen.getByLabelText(/名前/i), 'Taro');
    await userEvent.type(screen.getByLabelText(/苗字/i), 'Yamada');
    await userEvent.type(
      screen.getByLabelText(/メールアドレス/i),
      'test@example.com'
    );
    await userEvent.type(screen.getByLabelText(/電話番号/i), '090-1234-5678');
    await userEvent.type(screen.getByLabelText(/^パスワード$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/パスワード確認/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /アカウント作成/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Taro',
          last_name: 'Yamada',
          email: 'test@example.com',
          password: 'password123',
          password_confirmation: 'password123',
          phone: '090-1234-5678',
        })
      );
    });
  });

  it('navigates to home on successful registration', async () => {
    const mockRegister = jest.fn().mockResolvedValue(undefined);
    mockedUseAuth.mockReturnValue({
      ...defaultAuthState,
      register: mockRegister,
    });

    renderRegisterForm();

    await userEvent.type(screen.getByLabelText(/名前/i), 'Taro');
    await userEvent.type(screen.getByLabelText(/苗字/i), 'Yamada');
    await userEvent.type(
      screen.getByLabelText(/メールアドレス/i),
      'test@example.com'
    );
    await userEvent.type(screen.getByLabelText(/電話番号/i), '090-1234-5678');
    await userEvent.type(screen.getByLabelText(/^パスワード$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/パスワード確認/i), 'password123');

    fireEvent.click(screen.getByRole('button', { name: /アカウント作成/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
