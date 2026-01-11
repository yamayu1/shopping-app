import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
// import { ArrowForward } from '@mui/icons-material';
import { Product, Category } from '../types';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import ProductCard from '../components/products/ProductCard';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [addToCartLoading, setAddToCartLoading] = useState<number | null>(null);

  useEffect(() => {
    loadFeaturedProducts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('カテゴリの取得に失敗:', err);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const products = await productService.getFeaturedProducts(8);
      setFeaturedProducts(products);
    } catch (err: any) {
      console.error('おすすめ商品の読み込み失敗:', err);
      setError('注目商品の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // TODO: カートに入れた時にsnackbarで通知出したい
  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      setAddToCartLoading(product.id);
      await cartService.addItem({ product_id: product.id, quantity: 1 });
    } catch (err: any) {
      console.error('カートへの追加失敗:', err);
      setError('カートへの追加に失敗しました');
    } finally {
      setAddToCartLoading(null);
    }
  };

  const handleViewAllProducts = () => {
    navigate(ROUTES.PRODUCTS);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box
          sx={{
            mb: 4,
            py: 4,
            px: 3,
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 1,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            ShopApp
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            いろんな商品を取り揃えています
          </Typography>
          <Button
            variant="outlined"
            onClick={handleViewAllProducts}
            sx={{
              color: 'white',
              borderColor: 'white',
            }}
          >
            商品一覧へ
          </Button>
        </Box>

        {categories.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
              カテゴリ
            </Typography>
            <Grid container spacing={2}>
              {categories.map((category) => (
                <Grid item xs={6} md={2} key={category.id}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => navigate(`${ROUTES.PRODUCTS}?category=${category.id}`)}
                    sx={{ py: 1.5 }}
                  >
                    {category.name}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* おすすめ商品 */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
              おすすめ商品
            </Typography>
            <Button
              variant="text"
              onClick={handleViewAllProducts}
            >
              もっと見る
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : featuredProducts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">
                注目商品はまだありません
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {featuredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <ProductCard
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

      </Box>
    </Container>
  );
};

export default HomePage;