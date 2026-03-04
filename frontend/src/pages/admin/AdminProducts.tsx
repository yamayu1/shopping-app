import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Chip,
  IconButton,
  CardMedia,
  CircularProgress,
  Switch,
  FormControlLabel,
  TablePagination,
  Paper,
  Avatar,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminProductService } from '../../services/adminProductService';
import { adminCategoryService } from '../../services/adminCategoryService';
import { Product, ProductForm, Category } from '../../types';
import { getErrorMessage, formatCurrency } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

const productSchema = yup.object().shape({
  name: yup
    .string()
    .required('商品名は必須項目です')
    .min(2, '商品名は2文字以上で入力してください'),
  description: yup
    .string()
    .required('商品説明は必須項目です')
    .min(10, '商品説明は10文字以上で入力してください'),
  price: yup
    .number()
    .required('価格は必須項目です')
    .min(1, '価格は1円以上で入力してください'),
  category_id: yup
    .number()
    .required('カテゴリは必須項目です'),
  sku: yup
    .string()
    .optional(),
  stock_quantity: yup
    .number()
    .required('在庫数は必須項目です')
    .min(0, '在庫数は0以上で入力してください'),
  is_active: yup
    .boolean()
    .required(),
  featured: yup
    .boolean()
    .required(),
  weight: yup
    .number()
    .optional(),
  dimensions: yup
    .string()
    .optional(),
});

const AdminProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ページネーション
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(12);
  const [totalCount, setTotalCount] = useState(0);

  // 画像アップロード
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ProductForm>({
    resolver: yupResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category_id: 0,
      sku: '',
      stock_quantity: 0,
      is_active: true,
      featured: false,
      weight: 0,
      dimensions: '',
    },
  });

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page, rowsPerPage]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await adminProductService.getProducts({
        page: page + 1,
        per_page: rowsPerPage,
      });

      setProducts(response?.data || []);
      setTotalCount(response?.pagination?.total || 0);
    } catch (err: any) {
      console.error('Failed to load products:', err);
      setError(getErrorMessage(err));
      setProducts([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await adminCategoryService.getCategories({ per_page: 100 });
      setCategories(response?.data || []);
    } catch (err: any) {
      console.error('Failed to load categories:', err);
      setCategories([]);
    }
  };

  const onSubmit = async (data: ProductForm) => {
    try {
      setLoading(true);
      setError(null);

      // SKUが未入力の場合は自動生成
      if (!data.sku || data.sku.trim() === '') {
        data.sku = `PROD-${Date.now()}`;
      }

      if (editingProduct) {
        await adminProductService.updateProduct(editingProduct.id, data);
        setSuccess('商品を更新しました');
      } else {
        await adminProductService.createProduct(data);
        setSuccess('商品を追加しました');
      }

      handleCloseDialog();
      await loadProducts();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setValue('name', product.name);
      setValue('description', product.description);
      setValue('price', product.price);
      setValue('category_id', product.category_id);
      setValue('sku', product.sku);
      setValue('stock_quantity', product.stock_quantity);
      setValue('is_active', product.is_active);
      setValue('featured', product.featured);
      setValue('weight', product.weight || 0);
      setValue('dimensions', product.dimensions || '');
    } else {
      setEditingProduct(null);
      reset();
      // 新規商品のSKUを自動生成
      setValue('sku', `PROD-${Date.now()}`);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    reset();
  };

  const handleDeleteProduct = async (id: number) => {
    if (window.confirm('この商品を削除してもよろしいですか？')) {
      try {
        setError(null);
        await adminProductService.deleteProduct(id);
        setSuccess('商品を削除しました');
        await loadProducts();
      } catch (err: any) {
        console.error('Failed to delete product:', err);
        setError(getErrorMessage(err));
      }
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      setError(null);
      await adminProductService.updateProduct(product.id, {
        ...product,
        is_active: !product.is_active,
      });
      setSuccess(`商品を${product.is_active ? '非公開' : '公開'}にしました`);
      await loadProducts();
    } catch (err: any) {
      console.error('Failed to toggle product status:', err);
      setError(getErrorMessage(err));
    }
  };

  const handleOpenImageDialog = (product: Product) => {
    setSelectedProduct(product);
    setImageFiles([]);
    setImagePreviews([]);
    setImageDialogOpen(true);
  };

  const handleCloseImageDialog = () => {
    setImageDialogOpen(false);
    setSelectedProduct(null);
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setImageFiles(fileArray);

      // プレビューを作成
      const previews: string[] = [];
      fileArray.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          previews.push(reader.result as string);
          if (previews.length === fileArray.length) {
            setImagePreviews([...previews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleUploadImages = async () => {
    if (!selectedProduct || imageFiles.length === 0) return;

    try {
      setUploadingImages(true);
      setError(null);

      for (const file of imageFiles) {
        await adminProductService.uploadProductImage(selectedProduct.id, file);
      }

      setSuccess('画像をアップロードしました');
      handleCloseImageDialog();
      await loadProducts();
    } catch (err: any) {
      console.error('Failed to upload images:', err);
      setError(getErrorMessage(err));
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (productId: number, imageId: number) => {
    if (window.confirm('この画像を削除してもよろしいですか？')) {
      try {
        setError(null);
        await adminProductService.deleteProductImage(productId, imageId);
        setSuccess('画像を削除しました');
        await loadProducts();
      } catch (err: any) {
        console.error('Failed to delete image:', err);
        setError(getErrorMessage(err));
      }
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getCategoryName = (categoryId: number) => {
    return categories.find((c) => c.id === categoryId)?.name || '-';
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
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 600 }}>
            商品管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            新規商品追加
          </Button>
        </Box>

        {/* メッセージ */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        {/* 商品グリッド */}
        <Grid container spacing={3}>
          {products && products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {product.images && product.images.length > 0 ? (
                  <CardMedia
                    component="img"
                    height="200"
                    image={product.images.find((img) => img.is_primary)?.url || product.images[0].url}
                    alt={product.name}
                    sx={{ objectFit: 'cover' }}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 200,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.200',
                    }}
                  >
                    <ImageIcon sx={{ fontSize: 64, color: 'grey.400' }} />
                  </Box>
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom noWrap>
                    {product.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      mb: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {product.description}
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(product.price)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Chip label={getCategoryName(product.category_id)} size="small" variant="outlined" />
                    <Chip
                      label={product.is_active ? '公開' : '非公開'}
                      size="small"
                      color={product.is_active ? 'success' : 'default'}
                    />
                    {product.featured && <Chip label="注目" size="small" color="primary" />}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    在庫: {product.stock_quantity}個
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    SKU: {product.sku}
                  </Typography>
                </CardContent>
                <CardActions>
                  <IconButton size="small" onClick={() => handleOpenDialog(product)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleOpenImageDialog(product)} color="info">
                    <ImageIcon />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteProduct(product.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                  <Switch
                    size="small"
                    checked={product.is_active}
                    onChange={() => handleToggleActive(product)}
                    title={product.is_active ? '非公開にする' : '公開する'}
                  />
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* 空状態 */}
        {(!products || products.length === 0) && !loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              商品がありません
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              新規商品追加ボタンから商品を追加してください。
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              新規商品追加
            </Button>
          </Box>
        )}

        {/* ページネーション */}
        {products && products.length > 0 && (
          <Paper sx={{ mt: 3 }}>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="表示件数:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}件`}
            />
          </Paper>
        )}

        {/* 商品フォームダイアログ */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{editingProduct ? '商品編集' : '新規商品追加'}</DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    {...register('name')}
                    fullWidth
                    label="商品名"
                    error={!!errors.name}
                    helperText={errors.name?.message as string}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    {...register('description')}
                    fullWidth
                    label="商品説明"
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message as string}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('price', { valueAsNumber: true })}
                    fullWidth
                    label="価格 (円)"
                    type="number"
                    error={!!errors.price}
                    helperText={errors.price?.message as string}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('stock_quantity', { valueAsNumber: true })}
                    fullWidth
                    label="在庫数"
                    type="number"
                    error={!!errors.stock_quantity}
                    helperText={errors.stock_quantity?.message as string}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('category_id', { valueAsNumber: true })}
                    fullWidth
                    select
                    label="カテゴリ"
                    error={!!errors.category_id}
                    helperText={
                      (errors.category_id?.message as string) ||
                      (categories.length === 0 ? (
                        <span>
                          カテゴリが見つかりません。{' '}
                          <Link
                            component="button"
                            variant="body2"
                            onClick={(e) => {
                              e.preventDefault();
                              navigate(ROUTES.ADMIN_CATEGORIES);
                            }}
                            sx={{ cursor: 'pointer' }}
                          >
                            カテゴリ管理ページ
                          </Link>
                          から作成してください。
                        </span>
                      ) : "")
                    }
                    disabled={loading}
                  >
                    {categories.length === 0 ? (
                      <MenuItem value={0} disabled>
                        カテゴリがありません
                      </MenuItem>
                    ) : (
                      categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))
                    )}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('sku')}
                    fullWidth
                    label="商品管理番号（SKU）"
                    placeholder="自動生成されます"
                    helperText={(errors.sku?.message as string) || "商品を識別するための一意のコード（空欄の場合は自動生成）"}
                    disabled={loading}
                    InputProps={{
                      readOnly: !editingProduct,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...register('weight', { valueAsNumber: true })}
                    fullWidth
                    label="重量 (g)"
                    type="number"
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...register('dimensions')} fullWidth label="寸法" disabled={loading} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={<Switch {...register('is_active')} defaultChecked />}
                    label="公開する"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel control={<Switch {...register('featured')} />} label="注目商品" />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} disabled={loading}>
              キャンセル
            </Button>
            <Button onClick={handleSubmit(onSubmit)} variant="contained" disabled={loading}>
              {loading ? '処理中...' : editingProduct ? '更新' : '追加'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 画像アップロードダイアログ */}
        <Dialog open={imageDialogOpen} onClose={handleCloseImageDialog} maxWidth="md" fullWidth>
          <DialogTitle>商品画像管理 - {selectedProduct?.name}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* 登録済み画像 */}
              {selectedProduct && selectedProduct.images && selectedProduct.images.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    登録済み画像
                  </Typography>
                  <ImageList cols={3} gap={8}>
                    {selectedProduct.images.map((image) => (
                      <ImageListItem key={image.id}>
                        <img src={image.url} alt={image.alt_text || selectedProduct.name} loading="lazy" />
                        <ImageListItemBar
                          title={image.is_primary ? 'メイン画像' : `画像 ${image.sort_order}`}
                          actionIcon={
                            <IconButton
                              sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                              onClick={() => handleDeleteImage(selectedProduct.id, image.id)}
                            >
                              <CloseIcon />
                            </IconButton>
                          }
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Box>
              )}

              {/* 新しい画像をアップロード */}
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  新しい画像をアップロード
                </Typography>
                <Button variant="outlined" component="label" startIcon={<ImageIcon />} fullWidth>
                  画像を選択
                  <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
                </Button>
                {imagePreviews.length > 0 && (
                  <ImageList cols={3} gap={8} sx={{ mt: 2 }}>
                    {imagePreviews.map((preview, index) => (
                      <ImageListItem key={index}>
                        <img src={preview} alt={`Preview ${index + 1}`} loading="lazy" />
                      </ImageListItem>
                    ))}
                  </ImageList>
                )}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseImageDialog} disabled={uploadingImages}>
              閉じる
            </Button>
            <Button
              onClick={handleUploadImages}
              variant="contained"
              disabled={uploadingImages || imageFiles.length === 0}
            >
              {uploadingImages ? 'アップロード中...' : 'アップロード'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AdminProducts;
