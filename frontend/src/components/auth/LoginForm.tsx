import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  FormControlLabel,
  Checkbox,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm as LoginFormType } from '../../types';
import { ROUTES, VALIDATION_RULES } from '../../utils/constants';

// バリデーションスキーマ
const schema = yup.object().shape({
  email: yup
    .string()
    .email('正しいメールアドレスを入力してください')
    .required('メールアドレスは必須項目です'),
  password: yup
    .string()
    .required('パスワードは必須項目です')
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `パスワードは${VALIDATION_RULES.PASSWORD_MIN_LENGTH}文字以上で入力してください`),
  remember_me: yup.boolean(),
});

const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormType>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
      remember_me: false,
    },
  });

  const onSubmit = async (data: LoginFormType) => {
    try {
      clearError();
      await login(data);
      navigate(ROUTES.HOME);
    } catch (error) {
      // エラーはコンテキストで処理される
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          align="center"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          ログイン
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          アカウントにログインしてください。
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register('email')}
            fullWidth
            label="メールアドレス"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message as string}
            margin="normal"
            disabled={isLoading}
          />

          <TextField
            {...register('password')}
            fullWidth
            label="パスワード"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message as string}
            margin="normal"
            disabled={isLoading}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <FormControlLabel
              control={<Checkbox {...register('remember_me')} disabled={isLoading} />}
              label="ログイン状態を保持"
            />
            <Button
              type="button"
              variant="text"
              size="small"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              パスワードを{showPassword ? '非表示' : '表示'}
            </Button>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'ログイン'
            )}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Link to={ROUTES.FORGOT_PASSWORD}>
              <Typography variant="body2" color="primary">
                パスワードをお忘れですか？
              </Typography>
            </Link>
          </Box>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              または
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              アカウントをお持ちではありませんか？{' '}
              <Link to={ROUTES.REGISTER}>
                <Typography component="span" variant="body2" color="primary">
                  会員登録
                </Typography>
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;