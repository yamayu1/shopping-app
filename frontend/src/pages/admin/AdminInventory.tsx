import React, { useEffect, useState } from 'react';
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
  TextField,
  Button,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Download as DownloadIcon,
  Inventory2,
  Warning,
  TrendingDown,
  AttachMoney,
} from '@mui/icons-material';
import {
  adminInventoryService,
  InventoryItem,
  StockUpdateData,
  InventoryStatistics,
} from '../../services/adminInventoryService';
import { getErrorMessage, formatCurrency } from '../../utils/helpers';

const AdminInventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [statistics, setStatistics] = useState<InventoryStatistics>({
    total_products: 0,
    low_stock_products: 0,
    out_of_stock_products: 0,
    total_inventory_value: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // フィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');

  // 在庫更新ダイアログ
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [updateType, setUpdateType] = useState<'add' | 'set' | 'subtract'>('add');
  const [updateQuantity, setUpdateQuantity] = useState<number>(0);
  const [updateNotes, setUpdateNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadInventory();
    loadStatistics();
  }, [page, rowsPerPage, searchQuery, stockFilter]);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: page + 1,
        per_page: rowsPerPage,
      };

      if (searchQuery) {
        filters.search = searchQuery;
      }

      if (stockFilter === 'low_stock') {
        filters.low_stock_only = true;
      } else if (stockFilter === 'out_of_stock') {
        filters.out_of_stock_only = true;
      }

      const response = await adminInventoryService.getInventory(filters);
      setInventory(response.data || []);
      setTotalCount(response.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to load inventory:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await adminInventoryService.getStatistics();
      setStatistics(stats);
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleStockFilterChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string | null
  ) => {
    if (newFilter !== null) {
      setStockFilter(newFilter);
      setPage(0);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenUpdateDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setUpdateType('add');
    setUpdateQuantity(0);
    setUpdateNotes('');
    setUpdateDialogOpen(true);
  };

  const handleCloseUpdateDialog = () => {
    setUpdateDialogOpen(false);
    setSelectedItem(null);
    setUpdateQuantity(0);
    setUpdateNotes('');
  };

  const handleUpdateStock = async () => {
    if (!selectedItem) return;

    try {
      setUpdating(true);
      setError(null);

      const updateData: StockUpdateData = {
        quantity: updateQuantity,
        type: updateType,
        notes: updateNotes,
      };

      await adminInventoryService.updateStock(selectedItem.product_id, updateData);

      setSuccess('在庫を更新しました');
      handleCloseUpdateDialog();
      await loadInventory();
      await loadStatistics();
    } catch (err: any) {
      console.error('Failed to update stock:', err);
      setError(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setError(null);
      const blob = await adminInventoryService.exportToCSV();

      // ダウンロードリンクを作成
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccess('CSVファイルをダウンロードしました');
    } catch (err: any) {
      console.error('Failed to export CSV:', err);
      setError(getErrorMessage(err));
    }
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.available_quantity === 0) return 'error';
    if (item.is_low_stock) return 'warning';
    return 'success';
  };

  const getStockStatusLabel = (item: InventoryItem) => {
    if (item.available_quantity === 0) return '在庫切れ';
    if (item.is_low_stock) return '在庫僅少';
    return '在庫あり';
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

  if (loading && page === 0) {
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
          在庫管理
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* 統計カード */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="総商品数"
              value={(statistics.total_products ?? 0).toLocaleString()}
              icon={Inventory2}
              color="#3b82f6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="在庫僅少商品"
              value={(statistics.low_stock_products ?? 0).toLocaleString()}
              icon={Warning}
              color="#f59e0b"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="在庫切れ商品"
              value={(statistics.out_of_stock_products ?? 0).toLocaleString()}
              icon={TrendingDown}
              color="#ef4444"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="総在庫価値"
              value={formatCurrency(statistics.total_inventory_value ?? 0)}
              icon={AttachMoney}
              color="#10b981"
            />
          </Grid>
        </Grid>

        {/* フィルターとアクション */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="商品名・SKUで検索"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearch}
              sx={{ minWidth: 300 }}
            />

            <ToggleButtonGroup
              value={stockFilter}
              exclusive
              onChange={handleStockFilterChange}
              size="small"
            >
              <ToggleButton value="all">すべて</ToggleButton>
              <ToggleButton value="low_stock">在庫僅少</ToggleButton>
              <ToggleButton value="out_of_stock">在庫切れ</ToggleButton>
            </ToggleButtonGroup>

            <Box sx={{ flexGrow: 1 }} />

            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={handleExportCSV}
            >
              CSVエクスポート
            </Button>
          </Box>
        </Paper>

        {/* 在庫テーブル */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>商品名</TableCell>
                <TableCell>SKU</TableCell>
                <TableCell align="right">在庫数</TableCell>
                <TableCell align="right">予約数</TableCell>
                <TableCell align="right">利用可能数</TableCell>
                <TableCell align="right">閾値</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell>最終入荷日</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!inventory || inventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      在庫データがありません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                inventory.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>{item.product?.name || '-'}</TableCell>
                    <TableCell>{item.product?.sku || '-'}</TableCell>
                    <TableCell align="right">{item.stock_quantity}</TableCell>
                    <TableCell align="right">{item.reserved_quantity}</TableCell>
                    <TableCell align="right">
                      <Typography
                        component="span"
                        sx={{
                          fontWeight: item.available_quantity <= item.low_stock_threshold ? 700 : 400,
                          color: item.available_quantity === 0 ? 'error.main' :
                                 item.available_quantity <= item.low_stock_threshold ? 'warning.main' : 'inherit',
                        }}
                      >
                        {item.available_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{item.low_stock_threshold}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStockStatusLabel(item)}
                        size="small"
                        color={getStockStatusColor(item)}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      {item.last_restocked_at
                        ? new Date(item.last_restocked_at).toLocaleDateString('ja-JP')
                        : '-'}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenUpdateDialog(item)}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="表示件数:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
          />
        </TableContainer>
      </Box>

      {/* 在庫更新ダイアログ */}
      <Dialog open={updateDialogOpen} onClose={handleCloseUpdateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>在庫数更新</DialogTitle>
        <DialogContent>
          {selectedItem && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                商品名: {selectedItem.product?.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                現在の在庫数: {selectedItem.stock_quantity} / 利用可能数: {selectedItem.available_quantity}
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>更新タイプ</InputLabel>
                <Select
                  value={updateType}
                  label="更新タイプ"
                  onChange={(e) => setUpdateType(e.target.value as 'add' | 'set' | 'subtract')}
                >
                  <MenuItem value="add">追加</MenuItem>
                  <MenuItem value="set">設定</MenuItem>
                  <MenuItem value="subtract">減算</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="数量"
                type="number"
                value={updateQuantity}
                onChange={(e) => setUpdateQuantity(parseInt(e.target.value) || 0)}
                sx={{ mb: 2 }}
                inputProps={{ min: 0 }}
              />

              <TextField
                fullWidth
                label="備考"
                multiline
                rows={3}
                value={updateNotes}
                onChange={(e) => setUpdateNotes(e.target.value)}
                placeholder="在庫更新の理由や詳細を記入してください"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUpdateDialog} disabled={updating}>
            キャンセル
          </Button>
          <Button
            onClick={handleUpdateStock}
            variant="contained"
            disabled={updating || updateQuantity === 0}
          >
            {updating ? '更新中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminInventory;
