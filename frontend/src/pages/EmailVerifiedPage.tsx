import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Box, Paper, Typography, Button, Alert } from '@mui/material';

const EmailVerifiedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');

  let title = 'メールアドレスを確認しました';
  let severity: 'success' | 'info' | 'error' = 'success';
  let message = 'ご確認ありがとうございます。';

  if (status === 'already') {
    title = 'すでに確認済みです';
    severity = 'info';
    message = 'このメールアドレスは確認済みです。';
  } else if (status === 'error') {
    title = '確認できませんでした';
    severity = 'error';
    message = 'リンクが無効です。お手数ですが、もう一度お試しください。';
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>{title}</Typography>
          <Alert severity={severity} sx={{ my: 2 }}>{message}</Alert>
          <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
            トップページへ
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerifiedPage;