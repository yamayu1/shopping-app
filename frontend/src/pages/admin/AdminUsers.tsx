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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { Search, Visibility } from '@mui/icons-material';
import { adminUserService } from '../../services/adminUserService';
import { User } from '../../types';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [page, rowsPerPage, roleFilter, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters: any = {
        page: page + 1,
        per_page: rowsPerPage,
      };

      if (roleFilter !== 'all') {
        filters.role = roleFilter;
      }

      if (searchQuery) {
        filters.search = searchQuery;
      }

      const response = await adminUserService.getUsers(filters);
      setUsers(response.data || []);
      setTotalCount(response.pagination?.total || 0);
    } catch (err: any) {
      console.error('ユーザーの取得エラー:', err);
      setError('ユーザーデータの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: number, currentStatus: boolean) => {
    try {
      setUpdating(true);
      await adminUserService.updateUserStatus(userId, !currentStatus);
      await loadUsers();
    } catch (err: any) {
      console.error('ユーザーステータス変更エラー:', err);
      setError('ユーザーステータスの更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleAdmin = async (userId: number, currentRole: string) => {
    try {
      setUpdating(true);
      const newRole = currentRole === 'admin' ? 'user' : 'admin';
      await adminUserService.updateUserStatus(userId, newRole === 'admin');
      await loadUsers();
    } catch (err: any) {
      console.error('ユーザー権限変更エラー:', err);
      setError('ユーザー権限の更新に失敗しました');
    } finally {
      setUpdating(false);
    }
  };

  const openDetailDialog = async (user: User) => {
    try {
      setLoading(true);
      const userDetail = await adminUserService.getUserById(user.id);
      setSelectedUser(userDetail);
      setDetailDialogOpen(true);
    } catch (err: any) {
      console.error('ユーザー詳細の取得エラー:', err);
      setError('ユーザー詳細の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
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
          ユーザー管理
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
                placeholder="名前、メールアドレスで検索"
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
                <InputLabel>権限</InputLabel>
                <Select
                  value={roleFilter}
                  label="権限"
                  onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'user')}
                >
                  <MenuItem value="all">すべて</MenuItem>
                  <MenuItem value="admin">管理者</MenuItem>
                  <MenuItem value="user">一般ユーザー</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>

        {/* Users Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>名前</TableCell>
                  <TableCell>メールアドレス</TableCell>
                  <TableCell>権限</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>登録日</TableCell>
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
                ) : !users || users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.secondary">
                        ユーザーが見つかりません
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>
                        {user.last_name} {user.first_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.role === 'admin' ? '管理者' : '一般ユーザー'}
                          size="small"
                          color={user.role === 'admin' ? 'primary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? '有効' : '無効'}
                          size="small"
                          color={user.is_active ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        })}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => openDetailDialog(user)}
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

        {/* User Detail Dialog */}
        <Dialog
          open={detailDialogOpen}
          onClose={() => setDetailDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            ユーザー詳細 - {selectedUser ? `${selectedUser.last_name} ${selectedUser.first_name}` : ''}
          </DialogTitle>
          <DialogContent dividers>
            {selectedUser && (
              <Box>
                {/* Basic Info */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  基本情報
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      ID
                    </Typography>
                    <Typography variant="body1">{selectedUser.id}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      メールアドレス
                    </Typography>
                    <Typography variant="body1">{selectedUser.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      名前
                    </Typography>
                    <Typography variant="body1">
                      {selectedUser.last_name} {selectedUser.first_name}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      電話番号
                    </Typography>
                    <Typography variant="body1">{selectedUser.phone || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      登録日
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedUser.created_at).toLocaleString('ja-JP')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      最終更新
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedUser.updated_at).toLocaleString('ja-JP')}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Account Settings */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  アカウント設定
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        アカウント状態
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        アカウントの有効/無効を切り替えます
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedUser.is_active}
                          onChange={() => handleToggleActive(selectedUser.id, selectedUser.is_active)}
                          disabled={updating}
                        />
                      }
                      label={selectedUser.is_active ? '有効' : '無効'}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        管理者権限
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        管理者権限の付与/解除を行います
                      </Typography>
                    </Box>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={selectedUser.role === 'admin'}
                          onChange={() => handleToggleAdmin(selectedUser.id, selectedUser.role)}
                          disabled={updating}
                        />
                      }
                      label={selectedUser.role === 'admin' ? '管理者' : '一般ユーザー'}
                    />
                  </Box>
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Order Statistics */}
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                  注文統計
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
                      <Typography variant="body2" color="text.secondary">
                        総注文数
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        {selectedUser.order_count || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'success.50' }}>
                      <Typography variant="body2" color="text.secondary">
                        総購入金額
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 600 }}>
                        ¥{(selectedUser.total_spent || 0).toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailDialogOpen(false)}>閉じる</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AdminUsers;
