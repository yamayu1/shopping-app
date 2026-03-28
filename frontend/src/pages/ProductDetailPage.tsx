import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  TextField,
  IconButton,
  Stack,
} from '@mui/material';
import {
  ShoppingCart,
  Add,
  Remove,
  Star,
  LocalShipping,
  Verified,
} from '@mui/icons-material';
import { Product } from '../types';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import { formatCurrency, getImageUrl } from '../utils/helpers';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      console.log('商品ID:', id);
      loadProduct(Number(id));
    }
  }, [id]);

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getProduct(productId);
      console.log('商品データ:', data);
      setProduct(data);
    } catch (err: any) {
      console.error('商品の取得エラー:', err);
      setError('商品の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

    if (!product) return;

    try {
      setAddingToCart(true);
      await cartService.addItem({ product_id: product.id, quantity });
      setError(null);
      // 成功メッセージを表示
      alert('カートに追加しました');
    } catch (err: any) {
      console.error('カート追加エラー:', err);
      setError('カートへの追加に失敗しました');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && product && newQuantity <= product.stock_quantity) {
      setQuantity(newQuantity);
    }
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

  if (error || !product) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 8 }}>
          <Alert severity="error">{error || '商品が見つかりません'}</Alert>
          <Button
            variant="contained"
            onClick={() => navigate(ROUTES.PRODUCTS)}
            sx={{ mt: 2 }}
          >
            商品一覧に戻る
          </Button>
        </Box>
      </Container>
    );
  }

  const isOutOfStock = product.stock_quantity <= 0;
  const isInactive = !product.is_active;
  const canAddToCart = !isOutOfStock && !isInactive;
  const primaryImage = product.images?.[selectedImage] || product.images?.[0];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={4}>
          {/* 左側: 画像ギャラリー */}
          <Grid item xs={12} md={6}>
            <Box>
              {/* メイン画像 */}
              <Card sx={{ mb: 2, position: 'relative' }}>
                <CardMedia
                  component="img"
                  image={getImageUrl(primaryImage?.url || '')}
                  alt={primaryImage?.alt_text || product.name}
                  sx={{
                    width: '100%',
                    height: 400,
                    objectFit: 'cover',
                  }}
                />
                {/* バッジ */}
                <Box sx={{ position: 'absolute', top: 16, left: 16 }}>
                  {product.is_featured && (
                    <Chip label="注目商品" color="primary" sx={{ mb: 1 }} />
                  )}
                  {isInactive && (
                    <Chip label="販売停止中" color="error" />
                  )}
                  {isOutOfStock && !isInactive && (
                    <Chip label="在庫切れ" color="error" />
                  )}
                </Box>
              </Card>

              {/* サムネイル画像 */}
              {product.images && product.images.length > 1 && (
                <Grid container spacing={1}>
                  {product.images.map((image, index) => (
                    <Grid item xs={3} key={image.id}>
                      <Card
                        onClick={() => setSelectedImage(index)}
                        sx={{
                          cursor: 'pointer',
                          border: selectedImage === index ? 2 : 0,
                          borderColor: 'primary.main',
                          transition: 'all 0.2s',
                          '&:hover': {
                            opacity: 0.8,
                          },
                        }}
                      >
                        <CardMedia
                          component="img"
                          image={getImageUrl(image.url)}
                          alt={image.alt_text || product.name}
                          sx={{
                            width: '100%',
                            height: 80,
                            objectFit: 'cover',
                          }}
                        />
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Grid>

          {/* 右側: 商品情報 */}
          <Grid item xs={12} md={6}>
            {/* カテゴリ */}
            {product.category && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
              >
                {product.category.name}
              </Typography>
            )}

            {/* 商品名 */}
            <Typography variant="h3" component="h1" sx={{ fontWeight: 600, mb: 2 }}>
              {product.name}
            </Typography>

            {/* 評価 */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} sx={{ color: '#ffc107', fontSize: 20 }} />
              ))}
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                4.5 (128 レビュー)
              </Typography>
            </Box>

            {/* 価格 */}
            <Typography variant="h4" color="primary" sx={{ fontWeight: 700, mb: 3 }}>
              {formatCurrency(product.price)}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* 説明 */}
            <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.8 }}>
              {product.description}
            </Typography>

            {/* 商品詳細 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                商品詳細
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">SKU:</Typography>
                  <Typography variant="body2">{product.sku}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">在庫状況:</Typography>
                  <Typography
                    variant="body2"
                    color={canAddToCart ? 'success.main' : 'error.main'}
                    sx={{ fontWeight: 600 }}
                  >
                    {isInactive ? '販売停止中' : isOutOfStock ? '在庫切れ' : `在庫あり (${product.stock_quantity}個)`}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* 数量選択 */}
            {canAddToCart && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  数量
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <IconButton
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      size="small"
                    >
                      <Remove />
                    </IconButton>
                    <TextField
                      value={quantity}
                      size="small"
                      sx={{
                        width: 60,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': { border: 'none' },
                        },
                        '& input': { textAlign: 'center' },
                      }}
                      inputProps={{ readOnly: true }}
                    />
                    <IconButton
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock_quantity}
                      size="small"
                    >
                      <Add />
                    </IconButton>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {product.stock_quantity > 10
                      ? '在庫十分あり'
                      : `残り${product.stock_quantity}個`}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* カートに追加ボタン */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<ShoppingCart />}
              onClick={handleAddToCart}
              disabled={!canAddToCart || addingToCart}
              sx={{ mb: 2, py: 1.5 }}
            >
              {addingToCart
                ? 'カートに追加中...'
                : !canAddToCart
                ? isInactive
                  ? '販売停止中'
                  : '在庫切れ'
                : 'カートに追加'}
            </Button>

            {/* 特典 */}
            <Box sx={{ mt: 4 }}>
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LocalShipping color="primary" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      送料無料
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      5,000円以上のご注文で送料無料
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Verified color="primary" />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      品質保証
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      30日間返品保証
                    </Typography>
                  </Box>
                </Box>
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ProductDetailPage;