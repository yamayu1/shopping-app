import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginForm, RegisterForm } from '../types';
import { authService } from '../services/authService';
import { getErrorMessage } from '../utils/helpers';

// コンテキストの型定義
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アプリ起動時に認証状態を確認
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const storedUser = authService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          }
        }
      } catch (err) {
        console.log('認証チェックでエラー:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // ログイン
  const login = async (credentials: LoginForm) => {
    try {
      setIsLoading(true);
      setError(null);
      const authUser = await authService.login(credentials);
      setUser(authUser);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // 会員登録
  const register = async (userData: RegisterForm) => {
    try {
      setIsLoading(true);
      setError(null);
      const authUser = await authService.register(userData);
      setUser(authUser);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.log('ログアウトAPIエラー:', err);
    }
    setUser(null);
  };

  // プロフィール更新
  const updateProfile = async (userData: Partial<User>) => {
    try {
      const updatedUser = await authService.updateProfile(userData);
      setUser(updatedUser);
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(msg);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        updateProfile,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// カスタムフック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
