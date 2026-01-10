import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  ShoppingCart,
  AccountCircle,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { adminAuthService } from '../../services/adminAuthService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // ページ遷移時に管理者ログイン状態をチェック
  useEffect(() => {
    setIsAdminLoggedIn(adminAuthService.isAuthenticated());
  }, [location.pathname]);

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    navigate('/');
  };

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        {/* ロゴ */}
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            fontWeight: 700,
          }}
        >
          ShopApp
        </Typography>

        {/* ナビゲーション */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Button color="inherit" component={Link} to="/products">
            商品一覧
          </Button>

          {isAuthenticated && (
            <Button color="inherit" component={Link} to="/orders">
              注文履歴
            </Button>
          )}

          {isAdminLoggedIn && (
            <Button
              color="inherit"
              component={Link}
              to="/admin/login"
              startIcon={<AdminPanelSettings />}
            >
              管理画面
            </Button>
          )}

          {/* カートアイコン */}
          <IconButton color="inherit" component={Link} to="/cart">
            <Badge badgeContent={0} color="secondary">
              <ShoppingCart />
            </Badge>
          </IconButton>

          {/* ユーザーメニュー */}
          {isAuthenticated ? (
            <>
              <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
                <AccountCircle />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <Box sx={{ px: 2, py: 1 }}>
                  <Typography variant="body2">
                    {user?.first_name} {user?.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user?.email}
                  </Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/profile'); }}>
                  プロフィール
                </MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); navigate('/orders'); }}>
                  注文履歴
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>ログアウト</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                ログイン
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                component={Link}
                to="/register"
                sx={{ borderColor: 'rgba(255,255,255,0.5)' }}
              >
                会員登録
              </Button>
              {!isAdminLoggedIn && (
                <Button
                  color="inherit"
                  component={Link}
                  to="/admin/login"
                  sx={{ fontSize: '0.8rem', opacity: 0.8 }}
                >
                  管理者
                </Button>
              )}
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
