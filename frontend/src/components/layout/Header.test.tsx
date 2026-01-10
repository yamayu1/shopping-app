import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { useAuth } from '../../contexts/AuthContext';
import { adminAuthService } from '../../services/adminAuthService';

jest.mock('../../contexts/AuthContext');
jest.mock('../../services/adminAuthService', () => ({
  adminAuthService: {
    isAuthenticated: jest.fn().mockReturnValue(false),
    logout: jest.fn(),
    getStoredAdmin: jest.fn(),
  },
  adminApiClient: {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/' }),
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

const renderHeader = () => {
  return render(
    <BrowserRouter>
      <Header />
    </BrowserRouter>
  );
};

describe('Header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (adminAuthService.isAuthenticated as jest.Mock).mockReturnValue(false);
  });

  it('renders the app logo', () => {
    mockedUseAuth.mockReturnValue(defaultAuthState);
    renderHeader();

    expect(screen.getByText('ShopApp')).toBeInTheDocument();
  });

  it('renders product list link', () => {
    mockedUseAuth.mockReturnValue(defaultAuthState);
    renderHeader();

    expect(screen.getByText('商品一覧')).toBeInTheDocument();
  });

  describe('unauthenticated user', () => {
    beforeEach(() => {
      mockedUseAuth.mockReturnValue(defaultAuthState);
    });

    it('shows login and register buttons', () => {
      renderHeader();

      expect(screen.getByText('ログイン')).toBeInTheDocument();
      expect(screen.getByText('会員登録')).toBeInTheDocument();
    });
  });

  describe('authenticated user', () => {
    const authenticatedState = {
      ...defaultAuthState,
      user: {
        id: 1,
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        role: 'user',
        is_active: true,
        created_at: '',
        updated_at: '',
      },
      isAuthenticated: true,
    };

    beforeEach(() => {
      mockedUseAuth.mockReturnValue(authenticatedState);
    });

    it('shows user menu on account icon click', () => {
      renderHeader();

      const accountIcon = screen.getByTestId('AccountCircleIcon');
      fireEvent.click(accountIcon.closest('button')!);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@test.com')).toBeInTheDocument();
      expect(screen.getByText('プロフィール')).toBeInTheDocument();
      expect(screen.getByText('ログアウト')).toBeInTheDocument();
    });

    it('calls logout when logout menu item is clicked', async () => {
      const mockLogout = jest.fn().mockResolvedValue(undefined);
      mockedUseAuth.mockReturnValue({
        ...authenticatedState,
        logout: mockLogout,
      });

      renderHeader();

      const accountIcon = screen.getByTestId('AccountCircleIcon');
      fireEvent.click(accountIcon.closest('button')!);

      fireEvent.click(screen.getByText('ログアウト'));

      expect(mockLogout).toHaveBeenCalled();
    });

    it('does not show login/register buttons', () => {
      renderHeader();

      expect(screen.queryByText('ログイン')).not.toBeInTheDocument();
      expect(screen.queryByText('会員登録')).not.toBeInTheDocument();
    });
  });
});
