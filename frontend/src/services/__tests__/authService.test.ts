import { authService } from '../authService';
import { apiClient } from '../api';

jest.mock('../api');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (localStorage.getItem as jest.Mock).mockReset();
    (localStorage.setItem as jest.Mock).mockReset();
    (localStorage.removeItem as jest.Mock).mockReset();
  });

  describe('login', () => {
    const mockApiResponse = {
      data: {
        user: {
          id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          role: 'user',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        token: 'mock-jwt-token',
      },
    };

    test('successful login stores token and user data', async () => {
      mockedApiClient.post.mockResolvedValue(mockApiResponse);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        JSON.stringify('mock-jwt-token')
      );
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'user_data',
        expect.any(String)
      );

      expect(result.token).toBe('mock-jwt-token');
      expect(result.email).toBe('test@example.com');
    });

    test('failed login does not store data', async () => {
      mockedApiClient.post.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow();

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    const mockRegisterData = {
      email: 'newuser@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '090-1234-5678',
    };

    const mockApiResponse = {
      data: {
        user: {
          id: 2,
          email: 'newuser@example.com',
          first_name: 'Jane',
          last_name: 'Smith',
          role: 'user',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        token: 'mock-jwt-token-2',
      },
    };

    test('successful registration stores token and user data', async () => {
      mockedApiClient.post.mockResolvedValue(mockApiResponse);

      const result = await authService.register(mockRegisterData);

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/register', mockRegisterData);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'auth_token',
        JSON.stringify('mock-jwt-token-2')
      );

      expect(result.email).toBe('newuser@example.com');
      expect(result.token).toBe('mock-jwt-token-2');
    });
  });

  describe('logout', () => {
    test('calls API and clears local storage', async () => {
      mockedApiClient.post.mockResolvedValue({ success: true });

      await authService.logout();

      expect(mockedApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_data');
    });
  });

  describe('getStoredUser', () => {
    test('returns parsed user data from localStorage', () => {
      const mockUserData = {
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
      };

      (localStorage.getItem as jest.Mock).mockReturnValue(JSON.stringify(mockUserData));

      const result = authService.getStoredUser();

      expect(localStorage.getItem).toHaveBeenCalledWith('user_data');
      expect(result).toEqual(mockUserData);
    });

    test('returns null when no user data exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = authService.getStoredUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    test('returns true when token exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('mock-token');

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    test('returns false when no token exists', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue(null);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});
