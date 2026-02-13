import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import { ROUTES } from '../../utils/constants';

const Footer: React.FC = () => {
  const accountLinks = [
    { label: 'マイプロフィール', path: ROUTES.PROFILE },
    { label: '注文履歴', path: ROUTES.ORDERS },
    { label: 'ショッピングカート', path: ROUTES.CART },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        mt: 'auto',
        py: 3,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', gap: 3 }}>
            {accountLinks.map((link) => (
              <Typography
                key={link.label}
                variant="body2"
                component={Link}
                to={link.path}
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'none',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} ShopApp
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
