import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Link,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { authService } from '../services/authService';
import { ResetPasswordForm } from '../types';
import { getErrorMessage } from '../utils/helpers';
import { ROUTES, VALIDATION_RULES } from '../utils/constants';

const schema = yup.object({
  email: yup
    .string()
    .email('有効なメールアドレスを入力してください')
    .required('メールアドレスは必須です'),
  password: yup
    .string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `パスワードは${VALIDATION_RULES.PASSWORD_MIN_LENGTH}文字以上である必要があります`)
    .required('パスワードは必須です'),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref('password')], 'パスワードが一致しません')
    .required('パスワード確認は必須です'),
});

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Omit<ResetPasswordForm, 'token'>>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      email: emailParam || '',
    },
  });

  useEffect(() => {
    if (!token) {
      setError('パスワードリセットトークンが無効です。再度パスワードリセットを申請してください。');
    }
    if (emailParam) {
      setValue('email', emailParam);
    }
  }, [token, emailParam, setValue]);

  const onSubmit = async (data: Omit<ResetPasswordForm, 'token'>) => {
    if (!token) {
      setError('パスワードリセットトークンが無効です。');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await authService.resetPassword({
        ...data,
        token,
      });

      // 成功メッセージを表示してログイン画面にリダイレクト
      navigate(ROUTES.LOGIN, {
        state: {
          message: 'パスワードが正常にリセットされました。新しいパスワードでログインしてください。',
        },
      });
    } catch (err: any) {
      console.error('Reset password error:', err);
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
            パスワードリセット
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 4 }}>
            新しいパスワードを入力してください。
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="メールアドレス"
              type="email"
              autoComplete="email"
              margin="normal"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message as string}
              disabled={loading}
            />

            <TextField
              fullWidth
              label="新しいパスワード"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              margin="normal"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message as string}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="パスワードを表示"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="新しいパスワード（確認）"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              margin="normal"
              {...register('password_confirmation')}
              error={!!errors.password_confirmation}
              helperText={errors.password_confirmation?.message as string}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="パスワードを表示"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !token}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? 'リセット中...' : 'パスワードをリセット'}
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

export default ResetPasswordPage;
