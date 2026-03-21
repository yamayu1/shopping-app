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
import { ArrowForward } from '@mui/icons-material';
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
      console.error('Failed to load categories:', err);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const filters = {
        featured: true,
        sort_by: 'created_at' as const,
        sort_order: 'desc' as const,
      };

      const response = await productService.getProducts(filters);
      setFeaturedProducts(response?.data?.slice(0, 8) || []);
    } catch (err: any) {
      console.error('Failed to load featured products:', err);
      setError('注目商品の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      setAddToCartLoading(product.id);
      await cartService.addItem({ product_id: product.id, quantity: 1 });
    } catch (err: any) {
      console.error('Failed to add to cart:', err);
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
        {/* Hero Section */}
        <Box
          sx={{
            mb: 6,
            textAlign: 'center',
            py: 6,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: 2,
            color: 'white',
          }}
        >
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            ショッピングアプリへようこそ
          </Typography>
          <Typography variant="h5" sx={{ mb: 3, opacity: 0.9 }}>
            最高品質の商品をお手頃な価格で
          </Typography>
          <Button
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            onClick={handleViewAllProducts}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'grey.100',
              },
            }}
          >
            商品を見る
          </Button>
        </Box>

        {/* Categories Section */}
        {categories.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600, mb: 3 }}>
              カテゴリから探す
            </Typography>
            <Grid container spacing={2}>
              {categories.map((category) => (
                <Grid item xs={6} md={3} key={category.id}>
                  <Box
                    sx={{
                      p: 3,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => navigate(`${ROUTES.PRODUCTS}?category=${category.id}`)}
                  >
                    <Typography variant="h6">{category.name}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Featured Products Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h2" sx={{ fontWeight: 600 }}>
              注目の商品
            </Typography>
            <Button
              variant="text"
              endIcon={<ArrowForward />}
              onClick={handleViewAllProducts}
            >
              すべて見る
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