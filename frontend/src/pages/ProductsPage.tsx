import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  CircularProgress,
  Alert,
  Pagination,
  TextField,
  InputAdornment,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Search, FilterList } from '@mui/icons-material';
import { Product, Category, ProductFilters as ProductFiltersType } from '../types';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService';
import ProductCard from '../components/products/ProductCard';
import ProductFilters from '../components/products/ProductFilters';
import { ROUTES } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';

const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<ProductFiltersType>({
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, [filters, currentPage]);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setFilters(prev => ({ ...prev, category_id: Number(category) }));
    }
  }, [searchParams]);

  const loadCategories = async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('カテゴリ取得エラー:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await productService.getProducts(
        {
          ...filters,
          search: searchQuery || undefined,
        },
        currentPage,
        12
      );

      console.log('商品一覧取得:', response.data?.length, '件');
      setProducts(response.data || []);
      setTotalPages(response.pagination?.total_pages || 1);

      if (response.data && response.data.length > 0) {
        const prices = response.data.map(p => p.price);
        setPriceRange({
          min: Math.min(...prices),
          max: Math.max(...prices),
        });
      }
    } catch (err: any) {
      console.error('商品の読み込みエラー:', err);
      setError('商品の読み込みに失敗しました');
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
      await cartService.addItem({ product_id: product.id, quantity: 1 });
    } catch (err: any) {
      console.error('カート追加エラー:', err);
      setError('カートへの追加に失敗しました');
    }
  };

  const handleFiltersChange = (newFilters: ProductFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setFilters({
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadProducts();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const FiltersComponent = (
    <ProductFilters
      categories={categories}
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onClearFilters={handleClearFilters}
      priceRange={priceRange}
    />
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        {/* ヘッダー */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            商品一覧
          </Typography>

          {/* 検索バー */}
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }}
          >
            <TextField
              fullWidth
              placeholder="商品を検索..."
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
            {isMobile && (
              <IconButton
                onClick={() => setFilterDrawerOpen(true)}
                sx={{ border: 1, borderColor: 'divider' }}
              >
                <FilterList />
              </IconButton>
            )}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* メインコンテンツ */}
        <Grid container spacing={3}>
          {/* フィルターサイドバー（PC用） */}
          {!isMobile && (
            <Grid item md={3}>
              <Box sx={{ position: 'sticky', top: 80 }}>
                {FiltersComponent}
              </Box>
            </Grid>
          )}

          {/* 商品グリッド */}
          <Grid item xs={12} md={9}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : products.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">
                  商品が見つかりませんでした
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  検索条件を変更してみてください
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    {products.length} 件の商品が見つかりました
                  </Typography>
                </Box>

                <Grid container spacing={3}>
                  {products.map((product) => (
                    <Grid item xs={12} sm={6} lg={4} key={product.id}>
                      <ProductCard
                        product={product}
                        onAddToCart={handleAddToCart}
                      />
                    </Grid>
                  ))}
                </Grid>

                {/* ページネーション */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={handlePageChange}
                      color="primary"
                      size={isMobile ? 'small' : 'medium'}
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>

        {/* フィルター（スマホ用） */}
        <Drawer
          anchor="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
        >
          <Box sx={{ width: 300, p: 2 }}>
            {FiltersComponent}
          </Box>
        </Drawer>
      </Box>
    </Container>
  );
};

export default ProductsPage;