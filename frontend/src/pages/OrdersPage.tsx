import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Tabs,
  Tab,
  Stack,
  Divider,
} from '@mui/material';
import { ChevronRight, Receipt } from '@mui/icons-material';
import { Order, OrderStatus } from '../types';
import { orderService } from '../services/orderService';
import { formatCurrency } from '../utils/helpers';
import { ROUTES, ORDER_STATUS_OPTIONS } from '../utils/constants';

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');

  useEffect(() => {
    loadOrders();
  }, [filterStatus]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = filterStatus !== 'all' ? { status: filterStatus } : undefined;
      const response = await orderService.getOrders(filters);
      setOrders(response.data);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setError('注文履歴の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    const option = ORDER_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || '#6b7280';
  };

  const getStatusLabel = (status: OrderStatus) => {
    const option = ORDER_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  const handleOrderClick = (orderId: number) => {
    navigate(ROUTES.ORDER_DETAIL.replace(':id', orderId.toString()));
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          注文履歴
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Status Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={filterStatus} onChange={(_, val) => setFilterStatus(val)} variant="scrollable" scrollButtons="auto">
            <Tab label="すべて" value="all" />
            <Tab label="保留中" value="pending" />
            <Tab label="確認済み" value="confirmed" />
            <Tab label="処理中" value="processing" />
            <Tab label="発送済み" value="shipped" />
            <Tab label="配達完了" value="delivered" />
            <Tab label="キャンセル" value="cancelled" />
          </Tabs>
        </Box>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Receipt sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="text.secondary">
              注文履歴がありません
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              商品を購入すると、注文履歴がここに表示されます
            </Typography>
            <Button variant="contained" onClick={() => navigate(ROUTES.PRODUCTS)}>
              商品を見る
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {orders.map((order) => (
              <Card
                key={order.id}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: (theme) => theme.shadows[4],
                    transform: 'translateY(-2px)',
                  },
                }}
                onClick={() => handleOrderClick(order.id)}
              >
                <CardContent>
                  <Grid container spacing={2}>
                    {/* Order Header */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            注文番号: {order.order_number}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(order.created_at).toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Chip
                            label={getStatusLabel(order.status as OrderStatus)}
                            sx={{
                              bgcolor: getStatusColor(order.status as OrderStatus),
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                          <ChevronRight />
                        </Box>
                      </Box>
                    </Grid>

                    <Grid item xs={12}>
                      <Divider />
                    </Grid>

                    {/* Order Items Summary */}
                    <Grid item xs={12} sm={8}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        注文内容
                      </Typography>
                      <Stack spacing={0.5}>
                        {order.items.slice(0, 3).map((item) => (
                          <Typography key={item.id} variant="body2" color="text.secondary">
                            {item.product.name} × {item.quantity}
                          </Typography>
                        ))}
                        {order.items.length > 3 && (
                          <Typography variant="body2" color="text.secondary">
                            他 {order.items.length - 3} 点
                          </Typography>
                        )}
                      </Stack>
                    </Grid>

                    {/* Order Total */}
                    <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                        合計金額
                      </Typography>
                      <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>
                        {formatCurrency(order.total_amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        商品点数: {order.items.reduce((sum, item) => sum + item.quantity, 0)}点
                      </Typography>
                    </Grid>

                    {/* Shipping Address */}
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        配送先: {order.shipping_address.state} {order.shipping_address.city}{' '}
                        {order.shipping_address.address_line_1}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>
    </Container>
  );
};

export default OrdersPage;