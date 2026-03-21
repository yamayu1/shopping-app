import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Paper,
  Stack,
} from '@mui/material';
import {
  Add,
  Remove,
  Delete,
  ShoppingCartOutlined,
  ArrowForward,
} from '@mui/icons-material';
import { useCart } from '../contexts/CartContext';
import { formatCurrency, getImageUrl } from '../utils/helpers';
import { ROUTES } from '../utils/constants';

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, itemCount, totalAmount, isLoading, error, loadCart, updateQuantity, removeItem, clearError } = useCart();

  useEffect(() => {
    loadCart();
  }, []);

  const handleQuantityChange = async (productId: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    try {
      await updateQuantity(productId, newQuantity);
    } catch (err) {
      console.error('数量の更新エラー:', err);
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      await removeItem(productId);
    } catch (err) {
      console.error('商品の削除エラー:', err);
    }
  };

  const handleCheckout = () => {
    navigate(ROUTES.CHECKOUT);
  };

  const handleContinueShopping = () => {
    navigate(ROUTES.PRODUCTS);
  };

  if (isLoading && !cart) {
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
          ショッピングカート
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearError}>
            {error}
          </Alert>
        )}

        {!cart || cart.items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingCartOutlined sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" gutterBottom color="text.secondary">
              カートは空です
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              商品を追加してショッピングを始めましょう
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleContinueShopping}
            >
              商品を見る
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Stack spacing={2}>
                {cart.items.map((item) => {
                  const primaryImage = item.product.images?.find(img => img.is_primary) || item.product.images?.[0];
                  const isOutOfStock = item.product.stock_quantity <= 0;
                  const isInactive = !item.product.is_active;

                  return (
                    <Card key={item.id} sx={{ opacity: isOutOfStock || isInactive ? 0.6 : 1 }}>
                      <Grid container>
                        <Grid item xs={12} sm={3}>
                          <CardMedia
                            component="img"
                            image={getImageUrl(primaryImage?.url || '')}
                            alt={item.product.name}
                            sx={{
                              height: '100%',
                              minHeight: 150,
                              objectFit: 'cover',
                              cursor: 'pointer',
                            }}
                            onClick={() => navigate(ROUTES.PRODUCT_DETAIL.replace(':id', item.product.id.toString()))}
                          />
                        </Grid>

                        <Grid item xs={12} sm={9}>
                          <CardContent sx={{ position: 'relative' }}>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveItem(item.product_id)}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                              }}
                            >
                              <Delete />
                            </IconButton>

                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 500,
                                mb: 1,
                                pr: 4,
                                cursor: 'pointer',
                                '&:hover': { color: 'primary.main' },
                              }}
                              onClick={() => navigate(ROUTES.PRODUCT_DETAIL.replace(':id', item.product.id.toString()))}
                            >
                              {item.product.name}
                            </Typography>

                            {item.product.category && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                {item.product.category.name}
                              </Typography>
                            )}

                            {isInactive && (
                              <Alert severity="error" sx={{ mb: 2 }}>
                                この商品は現在販売停止中です
                              </Alert>
                            )}
                            {isOutOfStock && !isInactive && (
                              <Alert severity="warning" sx={{ mb: 2 }}>
                                この商品は在庫切れです
                              </Alert>
                            )}

                            {/* 数量と価格 */}
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                  数量:
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 1 }}>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                                    disabled={item.quantity <= 1 || isLoading}
                                  >
                                    <Remove fontSize="small" />
                                  </IconButton>
                                  <TextField
                                    value={item.quantity}
                                    size="small"
                                    sx={{
                                      width: 50,
                                      '& .MuiOutlinedInput-root': {
                                        '& fieldset': { border: 'none' },
                                      },
                                      '& input': { textAlign: 'center', p: 0.5 },
                                    }}
                                    inputProps={{ readOnly: true }}
                                  />
                                  <IconButton
                                    size="small"
                                    onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                                    disabled={item.quantity >= item.product.stock_quantity || isLoading}
                                  >
                                    <Add fontSize="small" />
                                  </IconButton>
                                </Box>
                              </Box>

                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" color="text.secondary">
                                  単価: {formatCurrency(item.price)}
                                </Typography>
                                <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                                  小計: {formatCurrency(item.price * item.quantity)}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Grid>
                      </Grid>
                    </Card>
                  );
                })}
              </Stack>
            </Grid>

            {/* 注文サマリー */}
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                  注文サマリー
                </Typography>

                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">商品点数:</Typography>
                    <Typography variant="body2">{itemCount}点</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">小計:</Typography>
                    <Typography variant="body2">{formatCurrency(totalAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">配送料:</Typography>
                    <Typography variant="body2" color="success.main">
                      {totalAmount >= 5000 ? '無料' : formatCurrency(500)}
                    </Typography>
                  </Box>
                  {totalAmount < 5000 && (
                    <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
                      あと{formatCurrency(5000 - totalAmount)}で送料無料
                    </Alert>
                  )}
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    合計:
                  </Typography>
                  <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                    {formatCurrency(totalAmount + (totalAmount >= 5000 ? 0 : 500))}
                  </Typography>
                </Box>

                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  endIcon={<ArrowForward />}
                  onClick={handleCheckout}
                  disabled={cart.items.some(item => !item.product.is_active || item.product.stock_quantity <= 0)}
                  sx={{ mb: 2 }}
                >
                  購入手続きへ
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={handleContinueShopping}
                >
                  買い物を続ける
                </Button>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default CartPage;