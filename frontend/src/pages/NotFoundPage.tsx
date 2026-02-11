import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: { xs: '4rem', md: '6rem' },
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2,
          }}
        >
          404
        </Typography>
        
        <Typography
          variant="h4"
          component="h2"
          sx={{
            mb: 2,
            color: 'text.primary',
          }}
        >
          ページが見つかりません
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: 'text.secondary',
            maxWidth: '500px',
          }}
        >
          申し訳ございません。お探しのページは存在しないか、移動された可能性があります。
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          onClick={handleGoHome}
          sx={{ px: 4, py: 1.5 }}
        >
          ホームに戻る
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage;