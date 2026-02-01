import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
} from '@mui/material';
import { ShoppingCart } from '@mui/icons-material';
import { Product } from '../../types';
import { formatCurrency, getImageUrl } from '../../utils/helpers';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const navigate = useNavigate();
  const isOutOfStock = product.stock_quantity <= 0;

  const handleClick = () => {
    navigate(`/products/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation(); // カードのクリックイベントが発火しないようにする
    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 4,
        },
        opacity: isOutOfStock ? 0.7 : 1,
      }}
      onClick={handleClick}
    >
      {/* 在庫切れバッジ */}
      {isOutOfStock && (
        <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
          <Chip label="在庫切れ" size="small" color="error" />
        </Box>
      )}

      {/* 商品画像 */}
      <CardMedia
        component="img"
        height="200"
        image={getImageUrl(product.images?.[0]?.url || '')}
        alt={product.name}
        sx={{ objectFit: 'cover', backgroundColor: 'grey.100' }}
      />

      {/* 商品情報 */}
      <CardContent sx={{ flexGrow: 1 }}>
        {product.category && (
          <Typography variant="caption" color="text.secondary">
            {product.category.name}
          </Typography>
        )}

        <Typography variant="h6" component="h3" sx={{ fontWeight: 500, mb: 1 }}>
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

        <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
          {formatCurrency(product.price)}
        </Typography>

        {/* 在庫状況 */}
        <Typography
          variant="caption"
          color={product.stock_quantity > 10 ? 'success.main' : 'warning.main'}
        >
          {product.stock_quantity > 10
            ? '在庫あり'
            : product.stock_quantity > 0
            ? `残り${product.stock_quantity}個`
            : '在庫切れ'}
        </Typography>
      </CardContent>

      {/* カートに追加ボタン */}
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button
          variant="contained"
          fullWidth
          startIcon={<ShoppingCart />}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          カートに追加
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard;
