import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
  Divider,
  Card,
  CardMedia,
  Stack,
  Table,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { Order } from '../types';
import { orderService } from '../services/orderService';
import { formatCurrency, getImageUrl } from '../utils/helpers';
import { ROUTES, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from '../utils/constants';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadOrder(Number(id));
    }
  }, [id]);

  const loadOrder = async (orderId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderService.getOrderById(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error('注文詳細の取得エラー:', err);
      setError('注文詳細の読み込みに失敗しました');
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

  const getPaymentStatusLabel = (status: string) => {
    const option = PAYMENT_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
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

  if (error || !order) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 8 }}>
          <Alert severity="error">{error || '注文が見つかりません'}</Alert>
          <Button
            variant="contained"
            onClick={() => navigate(ROUTES.ORDERS)}
            sx={{ mt: 2 }}
          >
            注文履歴に戻る
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(ROUTES.ORDERS)}
          sx={{ mb: 3 }}
        >
          注文履歴に戻る
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 600 }}>
              注文詳細
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              注文番号: {order.order_number}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              注文日: {new Date(order.created_at).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(order.status)}
            sx={{
              bgcolor: getStatusColor(order.status),
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
              height: 40,
            }}
          />
        </Box>

        <Grid container spacing={3}>
          {/* Order Items */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                注文商品
              </Typography>
              <Stack spacing={2}>
                {order.items.map((item) => {
                  const primaryImage = item.product.images?.find(img => img.is_primary) || item.product.images?.[0];
                  return (
                    <Card key={item.id} variant="outlined">
                      <Grid container>
                        <Grid item xs={3}>
                          <CardMedia
                            component="img"
                            image={getImageUrl(primaryImage?.url || '')}
                            alt={item.product.name}
                            sx={{
                              height: '100%',
                              minHeight: 100,
                              objectFit: 'cover',
                            }}
                          />
                        </Grid>
                        <Grid item xs={9} sx={{ p: 2 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {item.product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            SKU: {item.product.sku}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              数量: {item.quantity} × {formatCurrency(item.price)}
                            </Typography>
                            <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                              {formatCurrency(item.total ?? 0)}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
              </Stack>
            </Paper>

            {/* Addresses */}
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                配送情報
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    配送先住所
                  </Typography>
                  <Typography variant="body2">
                    {order.shipping_address.first_name} {order.shipping_address.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    〒{order.shipping_address.postal_code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shipping_address.prefecture} {order.shipping_address.city}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.shipping_address.address_line1}
                  </Typography>
                  {order.shipping_address.address_line2 && (
                    <Typography variant="body2" color="text.secondary">
                      {order.shipping_address.address_line2}
                    </Typography>
                  )}
                  {order.shipping_address.phone && (
                    <Typography variant="body2" color="text.secondary">
                      電話: {order.shipping_address.phone}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    請求先住所
                  </Typography>
                  {order.billing_address ? (
                    <>
                      <Typography variant="body2">
                        {order.billing_address.first_name} {order.billing_address.last_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        〒{order.billing_address.postal_code}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.billing_address.prefecture} {order.billing_address.city}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {order.billing_address.address_line1}
                      </Typography>
                      {order.billing_address.address_line2 && (
                        <Typography variant="body2" color="text.secondary">
                          {order.billing_address.address_line2}
                        </Typography>
                      )}
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                注文サマリー
              </Typography>

              <Stack spacing={1.5} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">小計:</Typography>
                  <Typography variant="body2">{formatCurrency(order.subtotal ?? 0)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">配送料:</Typography>
                  <Typography variant="body2">{formatCurrency(order.shipping_cost ?? 0)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">税金:</Typography>
                  <Typography variant="body2">{formatCurrency(order.tax_amount ?? 0)}</Typography>
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  合計:
                </Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  {formatCurrency(order.total_amount)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                支払い情報
              </Typography>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ border: 'none', px: 0 }}>支払い方法:</TableCell>
                    <TableCell sx={{ border: 'none', px: 0, textAlign: 'right' }}>
                      {order.payment_method}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ border: 'none', px: 0 }}>支払い状況:</TableCell>
                    <TableCell sx={{ border: 'none', px: 0, textAlign: 'right' }}>
                      {getPaymentStatusLabel(order.payment_status)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {order.notes && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    備考
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {order.notes}
                  </Typography>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default OrderDetailPage;