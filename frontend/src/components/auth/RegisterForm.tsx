import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { RegisterForm as RegisterFormType } from '../../types';
import { ROUTES, VALIDATION_RULES } from '../../utils/constants';

// バリデーションスキーマ
const schema = yup.object().shape({
  first_name: yup
    .string()
    .required('名前は必須項目です')
    .min(VALIDATION_RULES.NAME_MIN_LENGTH, `名前は${VALIDATION_RULES.NAME_MIN_LENGTH}文字以上で入力してください`)
    .max(VALIDATION_RULES.NAME_MAX_LENGTH, `名前は${VALIDATION_RULES.NAME_MAX_LENGTH}文字以下で入力してください`),
  last_name: yup
    .string()
    .required('苗字は必須項目です')
    .min(VALIDATION_RULES.NAME_MIN_LENGTH, `苗字は${VALIDATION_RULES.NAME_MIN_LENGTH}文字以上で入力してください`)
    .max(VALIDATION_RULES.NAME_MAX_LENGTH, `苗字は${VALIDATION_RULES.NAME_MAX_LENGTH}文字以下で入力してください`),
  email: yup
    .string()
    .required('メールアドレスは必須項目です')
    .email('正しいメールアドレスを入力してください'),
  password: yup
    .string()
    .required('パスワードは必須項目です')
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `パスワードは${VALIDATION_RULES.PASSWORD_MIN_LENGTH}文字以上で入力してください`),
  password_confirmation: yup
    .string()
    .required('パスワード確認は必須項目です')
    .oneOf([yup.ref('password')], 'パスワードが一致しません'),
  phone: yup
    .string()
    .required('電話番号は必須項目です')
    .matches(VALIDATION_RULES.PHONE, '正しい電話番号を入力してください'),
});

const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormType>({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      password_confirmation: '',
      phone: '',
    },
  });

  const onSubmit = async (data: RegisterFormType) => {
    try {
      clearError();
      await registerUser(data);
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
          maxWidth: 500,
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          align="center"
          gutterBottom
          sx={{ fontWeight: 600 }}
        >
          アカウント作成
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ mb: 3 }}
        >
          アカウントを作成してください。
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('first_name')}
                fullWidth
                label="名前"
                autoComplete="given-name"
                error={!!errors.first_name}
                helperText={errors.first_name?.message as string}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...register('last_name')}
                fullWidth
                label="苗字"
                autoComplete="family-name"
                error={!!errors.last_name}
                helperText={errors.last_name?.message as string}
                disabled={isLoading}
              />
            </Grid>
          </Grid>

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
            {...register('phone')}
            fullWidth
            label="電話番号"
            type="tel"
            autoComplete="tel"
            error={!!errors.phone}
            helperText={errors.phone?.message as string}
            margin="normal"
            disabled={isLoading}
          />

          <TextField
            {...register('password')}
            fullWidth
            label="パスワード"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message as string}
            margin="normal"
            disabled={isLoading}
          />

          <TextField
            {...register('password_confirmation')}
            fullWidth
            label="パスワード確認"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!errors.password_confirmation}
            helperText={errors.password_confirmation?.message as string}
            margin="normal"
            disabled={isLoading}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              type="button"
              variant="text"
              size="small"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              パスワードを{showPassword ? '非表示' : '表示'}
            </Button>
            <Button
              type="button"
              variant="text"
              size="small"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isLoading}
            >
              確認パスワードを{showConfirmPassword ? '非表示' : '表示'}
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
              'アカウント作成'
            )}
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" color="text.secondary">
              または
            </Typography>
          </Divider>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              すでにアカウントをお持ちですか？{' '}
              <Link to={ROUTES.LOGIN}>
                <Typography component="span" variant="body2" color="primary">
                  ログイン
                </Typography>
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterForm;