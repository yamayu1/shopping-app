import React from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  Email,
  Phone,
  LocationOn,
} from '@mui/icons-material';
import { ROUTES } from '../../utils/constants';

const Footer: React.FC = () => {
  const theme = useTheme();

  const footerSections = [
    {
      title: 'ショップ',
      links: [
        { label: '全商品', path: ROUTES.PRODUCTS },
        { label: '新着商品', path: `${ROUTES.PRODUCTS}?featured=true` },
        { label: 'ベストセラー', path: `${ROUTES.PRODUCTS}?sort=popular` },
        { label: 'セール商品', path: `${ROUTES.PRODUCTS}?on_sale=true` },
      ],
    },
    {
      title: 'アカウント',
      links: [
        { label: 'マイプロフィール', path: ROUTES.PROFILE },
        { label: '注文履歴', path: ROUTES.ORDERS },
        { label: 'ショッピングカート', path: ROUTES.CART },
        { label: 'お気に入りリスト', path: '/wishlist' },
      ],
    },
    {
      title: 'サポート',
      links: [
        { label: 'ヘルプセンター', path: '/help' },
        { label: 'お問い合わせ', path: '/contact' },
        { label: '配送情報', path: '/shipping' },
        { label: '返品・交換', path: '/returns' },
      ],
    },
    {
      title: '会社情報',
      links: [
        { label: '会社概要', path: '/about' },
        { label: '採用情報', path: '/careers' },
        { label: 'プライバシーポリシー', path: '/privacy' },
        { label: '利用規約', path: '/terms' },
      ],
    },
  ];

  const socialLinks = [
    { icon: <Facebook />, url: 'https://facebook.com', label: 'Facebook' },
    { icon: <Twitter />, url: 'https://twitter.com', label: 'Twitter' },
    { icon: <Instagram />, url: 'https://instagram.com', label: 'Instagram' },
    { icon: <LinkedIn />, url: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {/* 会社情報 */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              component="div"
              gutterBottom
              sx={{ fontWeight: 700 }}
            >
              ShopApp
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              品質の高い商品と素晴らしいショッピング体験を提供するプレミアムショップです。
              大切なお客様に最高のサービスと商品を提供することをお約束いたします。
            </Typography>
            
            {/* 連絡先情報 */}
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Email sx={{ mr: 1, fontSize: 18 }} color="action" />
                <Typography variant="body2" color="text.secondary">
                  support@shopapp.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Phone sx={{ mr: 1, fontSize: 18 }} color="action" />
                <Typography variant="body2" color="text.secondary">
                  03-1234-5678
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 1, fontSize: 18 }} color="action" />
                <Typography variant="body2" color="text.secondary">
                  〒150-0001 東京都渋谷区神宮前1-1-1
                </Typography>
              </Box>
            </Box>

            {/* ソーシャルリンク */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                フォローしてください
              </Typography>
              <Box>
                {socialLinks.map((social) => (
                  <IconButton
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{
                      mr: 1,
                      color: 'text.secondary',
                      '&:hover': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Box>
          </Grid>

          {/* フッターリンク */}
          {footerSections.map((section) => (
            <Grid item xs={6} sm={3} md={2} key={section.title}>
              <Typography
                variant="subtitle2"
                gutterBottom
                sx={{ fontWeight: 600 }}
              >
                {section.title}
              </Typography>
              <Box>
                {section.links.map((link) => (
                  <Typography
                    key={link.label}
                    variant="body2"
                    component={Link}
                    to={link.path}
                    sx={{
                      display: 'block',
                      color: 'text.secondary',
                      textDecoration: 'none',
                      mb: 0.5,
                      '&:hover': {
                        color: 'primary.main',
                        textDecoration: 'underline',
                      },
                    }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* ボトムセクション */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} ShopApp. すべての権利を保有します。
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Typography
              variant="body2"
              component={Link}
              to="/privacy"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              プライバシーポリシー
            </Typography>
            <Typography
              variant="body2"
              component={Link}
              to="/terms"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              利用規約
            </Typography>
            <Typography
              variant="body2"
              component={Link}
              to="/cookies"
              sx={{
                color: 'text.secondary',
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              クッキーポリシー
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;