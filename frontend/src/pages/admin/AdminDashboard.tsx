import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  People,
  Inventory,
  AttachMoney,
} from '@mui/icons-material';
import { adminOrderService } from '../../services/adminOrderService';
import { adminUserService } from '../../services/adminUserService';
import { adminInventoryService } from '../../services/adminInventoryService';
import { formatCurrency } from '../../utils/helpers';
import { ROUTES, ORDER_STATUS_OPTIONS } from '../../utils/constants';
import { Order } from '../../types';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  lowStockProducts: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    lowStockProducts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // デバッグ用に個別のエラーハンドリングでデータを読み込む
      let orderStats = { total_orders: 0, total_revenue: 0, pending_orders: 0, completed_orders: 0 };
      let userStats = { total_users: 0, verified_users: 0, unverified_users: 0, new_users_this_month: 0 };
      let inventoryStats = { total_products: 0, low_stock_products: 0, out_of_stock_products: 0, total_inventory_value: 0 };
      let ordersResponse: { data: Order[]; pagination: { current_page: number; per_page: number; total: number; total_pages: number } } = {
        data: [],
        pagination: { current_page: 1, per_page: 5, total: 0, total_pages: 0 }
      };

      try {
        orderStats = await adminOrderService.getStatistics();
        console.log('Order statistics loaded:', orderStats);
      } catch (err: any) {
        console.error('Failed to load order statistics:', err.response?.data || err.message);
      }

      try {
        userStats = await adminUserService.getStatistics();
        console.log('User statistics loaded:', userStats);
      } catch (err: any) {
        console.error('Failed to load user statistics:', err.response?.data || err.message);
      }

      try {
        inventoryStats = await adminInventoryService.getStatistics();
        console.log('Inventory statistics loaded:', inventoryStats);
      } catch (err: any) {
        console.error('Failed to load inventory statistics:', err.response?.data || err.message);
      }

      try {
        ordersResponse = await adminOrderService.getOrders({ page: 1, per_page: 5 });
        console.log('Recent orders loaded:', ordersResponse);
      } catch (err: any) {
        console.error('Failed to load recent orders:', err.response?.data || err.message);
      }

      setStats({
        totalOrders: orderStats?.total_orders ?? 0,
        totalRevenue: orderStats?.total_revenue ?? 0,
        totalUsers: userStats?.total_users ?? 0,
        lowStockProducts: inventoryStats?.low_stock_products ?? 0,
      });

      setRecentOrders(ordersResponse?.data ?? []);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError('ダッシュボードデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const option = ORDER_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    const option = ORDER_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              bgcolor: `${color}15`,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 40, color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          ダッシュボード
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 統計カード */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="総売上"
              value={formatCurrency(stats.totalRevenue)}
              icon={AttachMoney}
              color="#10b981"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="総注文数"
              value={(stats.totalOrders ?? 0).toLocaleString()}
              icon={ShoppingCart}
              color="#3b82f6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="ユーザー数"
              value={(stats.totalUsers ?? 0).toLocaleString()}
              icon={People}
              color="#8b5cf6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="在庫アラート"
              value={(stats.lowStockProducts ?? 0).toLocaleString()}
              icon={Inventory}
              color="#ef4444"
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* Recent Orders */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  最近の注文
                </Typography>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(ROUTES.ADMIN_ORDERS)}
                >
                  すべて見る
                </Typography>
              </Box>

              {!recentOrders || recentOrders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    注文はまだありません
                  </Typography>
                </Box>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>注文番号</TableCell>
                      <TableCell>顧客名</TableCell>
                      <TableCell>金額</TableCell>
                      <TableCell>ステータス</TableCell>
                      <TableCell>日時</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`${ROUTES.ADMIN_ORDERS}/${order.id}`)}
                      >
                        <TableCell>{order.order_number}</TableCell>
                        <TableCell>
                          {order.user ? `${order.user.first_name} ${order.user.last_name}` : '-'}
                        </TableCell>
                        <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(order.status)}
                            size="small"
                            sx={{
                              bgcolor: getStatusColor(order.status),
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString('ja-JP', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Paper>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                クイックリンク
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.50',
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => navigate(ROUTES.ADMIN_PRODUCTS)}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      商品管理
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.50',
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => navigate(ROUTES.ADMIN_CATEGORIES)}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      カテゴリ管理
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.50',
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => navigate(ROUTES.ADMIN_ORDERS)}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      注文管理
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'primary.50',
                      transform: 'translateX(4px)',
                    },
                  }}
                  onClick={() => navigate(ROUTES.ADMIN_USERS)}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      ユーザー管理
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'warning.50',
                      transform: 'translateX(4px)',
                    },
                  }}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        在庫管理
                      </Typography>
                      {stats.lowStockProducts > 0 && (
                        <Chip
                          label={stats.lowStockProducts}
                          size="small"
                          color="error"
                        />
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Paper>

            {/* Stats Summary */}
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                今月のサマリー
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    新規注文
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stats.totalOrders}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    新規ユーザー
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {stats.totalUsers}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    売上成長率
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUp sx={{ fontSize: 18, color: 'success.main' }} />
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'success.main' }}>
                      +12.5%
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AdminDashboard;