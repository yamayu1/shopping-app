import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider,
} from '@mui/material';
import { Search, Visibility } from '@mui/icons-material';
import { adminOrderService } from '../../services/adminOrderService';
import { Order, OrderStatus } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { ROUTES, ORDER_STATUS_OPTIONS } from '../../utils/constants';

const AdminOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusUpdateDialogOpen, setStatusUpdateDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus>('pending');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [page, rowsPerPage, statusFilter, searchQuery]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: page + 1,
        per_page: rowsPerPage,
      };

      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await adminOrderService.getOrders(filters);
      setOrders(response.data);
      setTotalCount(response.pagination.total);
    } catch (err: any) {
      console.error('Failed to load orders:', err);
      setError('注文データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;

    try {
      setUpdating(true);
      await adminOrderService.updateStatus(selectedOrder.id, newStatus);
      setStatusUpdateDialogOpen(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError('ステータスの更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  const openStatusUpdateDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status as OrderStatus);
    setStatusUpdateDialogOpen(true);
  };

  const openDetailDialog = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const getStatusColor = (status: OrderStatus) => {
    const option = ORDER_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.color || '#6b7280';
  };

  const getStatusLabel = (status: OrderStatus) => {
    const option = ORDER_STATUS_OPTIONS.find(opt => opt.value === status);
    return option?.label || status;
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          注文管理
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* フィルター */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="注文番号、顧客名で検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>ステータス</InputLabel>
                <Select
                  value={statusFilter}
                  label="ステータス"
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  {ORDER_STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Orders Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>注文番号</TableCell>
                  <TableCell>顧客名</TableCell>
                  <TableCell>金額</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>支払い状況</TableCell>
                  <TableCell>注文日時</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.secondary">
                        注文が見つかりません
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id} hover>
                      <TableCell>{order.order_number}</TableCell>
                      <TableCell>
                        {order.user ? `${order.user.last_name} ${order.user.first_name}` : '-'}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(order.status as OrderStatus)}
                          size="small"
                          sx={{
                            bgcolor: getStatusColor(order.status as OrderStatus),
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                          onClick={() => openStatusUpdateDialog(order)}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.payment_status === 'paid' ? '支払い済み' : '未払い'}
                          size="small"
                          color={order.payment_status === 'paid' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => openDetailDialog(order)}
                        >
                          詳細
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </Paper>

        {/* Order Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            注文詳細 - {selectedOrder?.order_number}
          </DialogTitle>
          <DialogContent dividers>
            {selectedOrder && (
              <Box>
                {/* Order Info */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  注文情報
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      注文日時
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedOrder.created_at).toLocaleString('ja-JP')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      顧客
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrder.user
                        ? `${selectedOrder.user.last_name} ${selectedOrder.user.first_name}`
                        : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      ステータス
                    </Typography>
                    <Chip
                      label={getStatusLabel(selectedOrder.status as OrderStatus)}
                      size="small"
                      sx={{
                        bgcolor: getStatusColor(selectedOrder.status as OrderStatus),
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      支払い方法
                    </Typography>
                    <Typography variant="body1">{selectedOrder.payment_method}</Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Order Items */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  注文商品
                </Typography>
                <Stack spacing={1} sx={{ mb: 3 }}>
                  {selectedOrder.items.map((item) => (
                    <Box
                      key={item.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        p: 1,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="body2">{item.product.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatCurrency(item.price)} × {item.quantity}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatCurrency(item.total ?? 0)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Addresses */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  配送先住所
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {selectedOrder.shipping_address.last_name} {selectedOrder.shipping_address.first_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  〒{selectedOrder.shipping_address.postal_code}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.city}{' '}
                  {selectedOrder.shipping_address.address_line_1}
                </Typography>
                {selectedOrder.shipping_address.phone && (
                  <Typography variant="body2" color="text.secondary">
                    電話: {selectedOrder.shipping_address.phone}
                  </Typography>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Totals */}
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">小計:</Typography>
                    <Typography variant="body2">{formatCurrency(selectedOrder.subtotal ?? 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">配送料:</Typography>
                    <Typography variant="body2">{formatCurrency(selectedOrder.shipping_cost ?? 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">税金:</Typography>
                    <Typography variant="body2">{formatCurrency(selectedOrder.tax_amount ?? 0)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      合計:
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                      {formatCurrency(selectedOrder.total_amount)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>閉じる</Button>
            {selectedOrder && (
              <Button
                variant="contained"
                onClick={() => {
                  setDetailDialogOpen(false);
                  openStatusUpdateDialog(selectedOrder);
                }}
              >
                ステータス変更
              </Button>
            )}
          </DialogActions>
        </Dialog>

        {/* Status Update Dialog */}
        <Dialog
          open={statusUpdateDialogOpen}
          onClose={() => setStatusUpdateDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>ステータス変更</DialogTitle>
          <DialogContent>
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>新しいステータス</InputLabel>
              <Select
                value={newStatus}
                label="新しいステータス"
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
              >
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusUpdateDialogOpen(false)}>キャンセル</Button>
            <Button
              variant="contained"
              onClick={handleStatusUpdate}
              disabled={updating}
            >
              {updating ? '更新中...' : '更新'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AdminOrders;
