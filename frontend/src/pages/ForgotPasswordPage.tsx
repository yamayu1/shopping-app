import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '../services/authService';
import { ForgotPasswordForm } from '../types';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES } from '../utils/constants';

const schema = yup.object({
  email: yup
    .string()
    .email('有効なメールアドレスを入力してください')
    .required('メールアドレスは必須です'),
});

const ForgotPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await authService.forgotPassword(data);

      setSuccess(true);
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 600, mb: 1 }}>
            パスワードを忘れた場合
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            登録されているメールアドレスを入力してください。パスワードリセット用のリンクをお送りします。
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              パスワードリセット用のメールを送信しました。メールボックスをご確認ください。
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              autoComplete="email"
              autoFocus
              margin="normal"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message as string}
              disabled={loading || success}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || success}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? '送信中...' : 'リセットリンクを送信'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link component={RouterLink} to={ROUTES.LOGIN} variant="body2">
                ログインページに戻る
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage;
