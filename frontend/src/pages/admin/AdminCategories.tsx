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
  Switch,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { adminCategoryService, CategoryForm } from '../../services/adminCategoryService';
import { Category } from '../../types';
import { getErrorMessage } from '../../utils/helpers';

const AdminCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // フィルター
  const [searchQuery, setSearchQuery] = useState('');
  const [parentFilter, setParentFilter] = useState<number | 'all' | 'root'>('all');

  // フォームダイアログ
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    description: '',
    parent_id: null,
    image: '',
    is_active: true,
    sort_order: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  // 削除確認ダイアログ
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 画像アップロード
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, [page, rowsPerPage, searchQuery, parentFilter]);

  const loadCategories = async () => {
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

      if (parentFilter === 'root') {
        filters.parent_id = null;
      } else if (parentFilter !== 'all') {
        filters.parent_id = parentFilter;
      }

      const response = await adminCategoryService.getCategories(filters);
      setCategories(response?.data || []);
      setTotalCount(response?.pagination?.total || 0);
    } catch (err: any) {
      console.error('カテゴリの取得エラー:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenFormDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        parent_id: category.parent_id || null,
        image: category.image || '',
        is_active: category.is_active,
        sort_order: category.sort_order,
      });
      setImagePreview(category.image || null);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        parent_id: null,
        image: '',
        is_active: true,
        sort_order: 0,
      });
      setImagePreview(null);
    }
    setImageFile(null);
    setFormDialogOpen(true);
  };

  const handleCloseFormDialog = () => {
    setFormDialogOpen(false);
    setEditingCategory(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleFormChange = (field: keyof CategoryForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitForm = async () => {
    try {
      setSubmitting(true);
      setError(null);

      let savedCategory: Category;

      if (editingCategory) {
        // 既存カテゴリを更新
        savedCategory = await adminCategoryService.updateCategory(editingCategory.id, formData);
        setSuccess('カテゴリーを更新しました');
      } else {
        // 新規カテゴリを作成
        savedCategory = await adminCategoryService.createCategory(formData);
        setSuccess('カテゴリーを作成しました');
      }

      // 画像が選択されていればアップロード
      if (imageFile && savedCategory) {
        await adminCategoryService.uploadCategoryImage(savedCategory.id, imageFile);
      }

      handleCloseFormDialog();
      await loadCategories();
    } catch (err: any) {
      console.error('カテゴリの保存エラー:', err);
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setDeletingCategory(null);
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;

    try {
      setDeleting(true);
      setError(null);

      await adminCategoryService.deleteCategory(deletingCategory.id);

      setSuccess('カテゴリーを削除しました');
      handleCloseDeleteDialog();
      await loadCategories();
    } catch (err: any) {
      console.error('カテゴリの削除エラー:', err);
      setError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (category: Category) => {
    try {
      setError(null);
      await adminCategoryService.toggleActive(category.id);
      setSuccess(`カテゴリーを${category.is_active ? '非公開' : '公開'}にしました`);
      await loadCategories();
    } catch (err: any) {
      console.error('カテゴリステータス変更エラー:', err);
      setError(getErrorMessage(err));
    }
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 600 }}>
            カテゴリー管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenFormDialog()}
          >
            新規カテゴリー
          </Button>
        </Box>

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

        {/* フィルター */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              label="カテゴリー名で検索"
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearch}
              sx={{ minWidth: 300 }}
            />

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>親カテゴリー</InputLabel>
              <Select
                value={parentFilter}
                label="親カテゴリー"
                onChange={(e) => setParentFilter(e.target.value as any)}
              >
                <MenuItem value="all">すべて</MenuItem>
                <MenuItem value="root">ルートカテゴリーのみ</MenuItem>
                {categories
                  .filter((c) => !c.parent_id)
                  .map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* カテゴリーテーブル */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>画像</TableCell>
                <TableCell>カテゴリー名</TableCell>
                <TableCell>親カテゴリー</TableCell>
                <TableCell>商品数</TableCell>
                <TableCell>表示順</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!categories || categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Typography variant="body1" color="text.secondary">
                      カテゴリーがありません
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category) => (
                  <TableRow key={category.id} hover>
                    <TableCell>
                      <Avatar
                        src={category.image}
                        variant="rounded"
                        sx={{ width: 50, height: 50 }}
                      >
                        <ImageIcon />
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {category.name}
                      </Typography>
                      {category.description && (
                        <Typography variant="body2" color="text.secondary">
                          {category.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {category.parent_id ? (
                        categories.find((c) => c.id === category.parent_id)?.name || '-'
                      ) : (
                        <Chip label="ルート" size="small" />
                      )}
                    </TableCell>
                    <TableCell>{category.products_count || 0}</TableCell>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>
                      <Chip
                        label={category.is_active ? '公開' : '非公開'}
                        size="small"
                        color={category.is_active ? 'success' : 'default'}
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenFormDialog(category)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleOpenDeleteDialog(category)}
                      >
                        <DeleteIcon />
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

      {/* フォームダイアログ */}
      <Dialog open={formDialogOpen} onClose={handleCloseFormDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'カテゴリー編集' : '新規カテゴリー作成'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="カテゴリー名"
              value={formData.name}
              onChange={(e) => handleFormChange('name', e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="説明"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
            />

            {editingCategory && (
              <FormControl fullWidth>
                <InputLabel>親カテゴリー</InputLabel>
                <Select
                  value={formData.parent_id || ''}
                  label="親カテゴリー"
                  onChange={(e) => handleFormChange('parent_id', e.target.value || null)}
                >
                  <MenuItem value="">なし（ルートカテゴリー）</MenuItem>
                  {categories
                    .filter((c) => !c.parent_id && c.id !== editingCategory?.id)
                    .map((c) => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.name}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            )}

            <TextField
              fullWidth
              label="表示順"
              type="number"
              value={formData.sort_order}
              onChange={(e) => handleFormChange('sort_order', parseInt(e.target.value) || 0)}
              inputProps={{ min: 0 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => handleFormChange('is_active', e.target.checked)}
                />
              }
              label="公開する"
            />

            {editingCategory && (
              <Box>
                <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                  画像を選択
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
                {imagePreview && (
                  <Box sx={{ mt: 2 }}>
                    <Avatar
                      src={imagePreview}
                      variant="rounded"
                      sx={{ width: 150, height: 150 }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog} disabled={submitting}>
            キャンセル
          </Button>
          <Button
            onClick={handleSubmitForm}
            variant="contained"
            disabled={submitting || !formData.name}
          >
            {submitting ? '保存中...' : editingCategory ? '更新' : '作成'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>カテゴリーの削除</DialogTitle>
        <DialogContent>
          <Typography>
            本当に「{deletingCategory?.name}」を削除しますか？この操作は取り消せません。
          </Typography>
          {deletingCategory && (deletingCategory.products_count ?? 0) > 0 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              このカテゴリーには {deletingCategory.products_count} 件の商品が紐付いています。
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deleting}>
            キャンセル
          </Button>
          <Button onClick={handleDeleteCategory} color="error" disabled={deleting}>
            {deleting ? '削除中...' : '削除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminCategories;
