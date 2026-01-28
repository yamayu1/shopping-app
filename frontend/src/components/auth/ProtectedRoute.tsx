import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminAuthService } from '../../services/adminAuthService';
import { ROUTES } from '../../utils/constants';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 管理者ルートの場合は管理者認証をチェック
  if (adminOnly) {
    const isAdminAuthenticated = adminAuthService.isAuthenticated();
    
    if (!isAdminAuthenticated) {
      return <Navigate to={ROUTES.ADMIN_LOGIN} state={{ from: location }} replace />;
    }
    
    return <>{children}</>;
  }

  // 一般ユーザールートの処理
  // 認証確認中はローディングスピナーを表示
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 未認証の場合はログイン画面にリダイレクト
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;