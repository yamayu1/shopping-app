import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { authService } from '../services/authService';
import { User } from '../types';

// authServiceをモック
jest.mock('../services/authService');

const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  phone: '+1-555-1234',
  role: 'user',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockAuthUser = {
  ...mockUser,
  token: 'mock-token',
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('initializes with no user', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
    (authService.getStoredUser as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('initializes with stored user', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getStoredUser as jest.Mock).mockReturnValue(mockUser);
    (authService.getProfile as jest.Mock).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('handles login successfully', async () => {
    (authService.login as jest.Mock).mockResolvedValue(mockAuthUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.current.user).toEqual(mockAuthUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('handles login failure', async () => {
    const errorMessage = 'Invalid credentials';
    (authService.login as jest.Mock).mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        });
      } catch (error) {
        // 想定内のエラー
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('handles register successfully', async () => {
    (authService.register as jest.Mock).mockResolvedValue(mockAuthUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    const registerData = {
      first_name: 'Test',
      last_name: 'User',
      email: 'test@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      phone: '+1-555-1234',
    };

    await act(async () => {
      await result.current.register(registerData);
    });

    expect(authService.register).toHaveBeenCalledWith(registerData);
    expect(result.current.user).toEqual(mockAuthUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('handles logout', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getStoredUser as jest.Mock).mockReturnValue(mockUser);
    (authService.logout as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // 初期状態でログイン済みであること
    expect(result.current.user).toEqual(mockUser);

    await act(async () => {
      await result.current.logout();
    });

    expect(authService.logout).toHaveBeenCalled();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('updates user profile', async () => {
    (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
    (authService.getStoredUser as jest.Mock).mockReturnValue(mockUser);

    const updatedUser = { ...mockUser, first_name: 'Updated' };
    (authService.updateProfile as jest.Mock).mockResolvedValue(updatedUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateProfile({ first_name: 'Updated' });
    });

    expect(authService.updateProfile).toHaveBeenCalledWith({ first_name: 'Updated' });
    expect(result.current.user?.first_name).toBe('Updated');
  });

  it('clears error when requested', async () => {
    (authService.login as jest.Mock).mockRejectedValue(new Error('Test error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    // ログイン失敗によりエラーを発生させる
    await act(async () => {
      try {
        await result.current.login({
          email: 'test@example.com',
          password: 'wrong',
        });
      } catch (error) {
        // 想定内のエラー
      }
    });

    expect(result.current.error).toBeTruthy();

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('sets loading state during async operations', async () => {
    (authService.login as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockAuthUser), 100))
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const loginPromise = act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    // 操作中はローディング状態であること
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    await loginPromise;

    // 完了後はローディング状態が解除されること
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });
});
