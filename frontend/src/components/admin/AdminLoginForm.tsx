import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { adminAuthService, AdminLoginForm as AdminLoginFormType } from '../../services/adminAuthService';
import { ROUTES, VALIDATION_RULES } from '../../utils/constants';

// バリデーションスキーマ
const schema = yup.object().shape({
  email: yup
    .string()
    .email('正しいメールアドレスを入力してください')
    .required('メールアドレスは必須項目です'),
  password: yup
    .string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `パスワードは${VALIDATION_RULES.PASSWORD_MIN_LENGTH}文字以上で入力してください`)
    .required('パスワードは必須項目です'),
});

const AdminLoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormType>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: AdminLoginFormType) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await adminAuthService.login(data);
      
      // 管理者ダッシュボードにリダイレクト
      navigate(ROUTES.ADMIN);
    } catch (error) {
      setError(error instanceof Error ? error.message : '管理者ログインに失敗しました');
    } finally {
      setIsLoading(false);
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
          sx={{ fontWeight: 600, color: 'primary.main' }}
        >
          管理者ログイン
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          管理者アカウントでログインしてください。
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
            label="管理者メールアドレス"
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
            label="管理者パスワード"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message as string}
            margin="normal"
            disabled={isLoading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
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
            disabled={isLoading}
            sx={{ mt: 3, mb: 2 }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              '管理者としてログイン'
            )}
          </Button>

          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="text"
              onClick={() => navigate(ROUTES.HOME)}
              disabled={isLoading}
            >
              一般ユーザーページに戻る
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default AdminLoginForm;