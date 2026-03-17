import { authService } from '../authService';
import { apiClient } from '../api';

// APIクライアントをモック
jest.mock('../api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

// localStorageをモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  describe('login', () => {
    const mockLoginResponse = {
      success: true,
      data: {
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
        },
        token: 'mock-jwt-token',
      },
    };

    test('successful login stores token and user data', async () => {
      mockedApiClient.post.mockResolvedValue(mockLoginResponse);

      const result = await authService.login('test@example.com', 'password123');

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'shopping_auth_token',
        'mock-jwt-token'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'shopping_user_data',
        JSON.stringify(mockLoginResponse.data.user)
      );

      expect(result).toEqual(mockLoginResponse);
    });

    test('failed login does not store data', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Invalid credentials',
      };

      mockedApiClient.post.mockRejectedValue(mockErrorResponse);

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toEqual(mockErrorResponse);

      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'newuser@example.com',
      password: 'password123',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '090-1234-5678',
    };

    const mockRegisterResponse = {
      success: true,
      data: {
        user: {
          id: 2,
          email: 'newuser@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
        },
        token: 'mock-jwt-token-2',
      },
    };

    test('successful registration stores token and user data', async () => {
      mockedApiClient.post.mockResolvedValue(mockRegisterResponse);

      const result = await authService.register(mockRegisterData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/auth/register', mockRegisterData);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'shopping_auth_token',
        'mock-jwt-token-2'
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'shopping_user_data',
        JSON.stringify(mockRegisterResponse.data.user)
      );

      expect(result).toEqual(mockRegisterResponse);
    });
  });

  describe('logout', () => {
    test('calls API and clears local storage', async () => {
      mockedApiClient.post.mockResolvedValue({ success: true });

      await authService.logout();

      expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/auth/logout');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('shopping_auth_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('shopping_user_data');
    });
  });

  describe('getCurrentUser', () => {
    test('returns parsed user data from localStorage', () => {
      const mockUserData = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockUserData));

      const result = authService.getCurrentUser();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('shopping_user_data');
      expect(result).toEqual(mockUserData);
    });

    test('returns null when no user data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });

    test('returns null when user data is invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('getToken', () => {
    test('returns token from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');

      const result = authService.getToken();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('shopping_auth_token');
      expect(result).toBe('mock-token');
    });

    test('returns null when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.getToken();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    test('returns true when token exists', () => {
      mockLocalStorage.getItem.mockReturnValue('mock-token');

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    test('returns false when no token exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});