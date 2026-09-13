import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { adminAuthService, AdminRegisterForm } from '../../services/adminAuthService';
import { VALIDATION_RULES } from '../../utils/constants';
import { Visibility, VisibilityOff } from '@mui/icons-material';

// 選択できる権限（APIで許可されている4種類）
const ROLE_OPTIONS = [
  { value: 'admin', label: '管理者' },
  { value: 'manager', label: 'マネージャー' },
  { value: 'editor', label: '編集者' },
  { value: 'super_admin', label: 'スーパー管理者' },
];

// バリデーションスキーマ（サーバー側のバリデーションと同じルール）
const schema = yup.object().shape({
  name: yup
    .string()
    .max(255, '名前は255文字以内で入力してください')
    .required('名前は必須項目です'),
  email: yup
    .string()
    .email('正しいメールアドレスを入力してください')
    .required('メールアドレスは必須項目です'),
  password: yup
    .string()
    .min(VALIDATION_RULES.PASSWORD_MIN_LENGTH, `パスワードは${VALIDATION_RULES.PASSWORD_MIN_LENGTH}文字以上で入力してください`)
    .required('パスワードは必須項目です'),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref('password')], 'パスワードが一致しません')
    .required('確認用パスワードは必須項目です'),
  role: yup
    .string()
    .required('権限は必須項目です'),
});

const AdminRegister: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const storedAdmin = adminAuthService.getStoredAdmin();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdminRegisterForm>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'admin',
    },
  });

  // スーパー管理者以外はフォームを表示しない
  if (storedAdmin?.role !== 'super_admin') {
    return (
      <Container maxWidth="sm">
        <Box sx={{ py: 4 }}>
          <Alert severity="error">この画面はスーパー管理者のみ利用できます。</Alert>
        </Box>
      </Container>
    );
  }

  const onSubmit = async (data: AdminRegisterForm) => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccessMessage(null);

      const created = await adminAuthService.registerAdmin(data);

      setSuccessMessage(`管理者「${created.name}」を登録しました`);
      reset();
    } catch (err) {
      console.error('管理者登録エラー:', err);
      if (axios.isAxiosError(err) && err.response?.status === 422) {
        setError('このメールアドレスは既に登録されています');
      } else if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('この操作はスーパー管理者のみ実行できます');
      } else {
        setError('管理者の登録に失敗しました');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
          管理者登録
        </Typography>

        <Paper sx={{ p: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register('name')}
              fullWidth
              label="名前"
              margin="normal"
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={isLoading}
            />
            <TextField
              {...register('email')}
              fullWidth
              label="メールアドレス"
              type="email"
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
              disabled={isLoading}
            />
            <TextField
              {...register('password')}
              fullWidth
              label="パスワード"
              type={showPassword ? 'text' : 'password'}
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'パスワードを非表示にする' : 'パスワードを表示する'}
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
              {...register('password_confirmation')}
              fullWidth
              label="パスワード（確認）"
              type={showConfirmPassword ? 'text' : 'password'}
              margin="normal"
              error={!!errors.password_confirmation}
              helperText={errors.password_confirmation?.message}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showConfirmPassword ? 'パスワードを非表示にする' : 'パスワードを表示する'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register('role')}
              fullWidth
              select
              label="権限"
              margin="normal"
              defaultValue="admin"
              error={!!errors.role}
              helperText={errors.role?.message}
              disabled={isLoading}
            >
              {ROLE_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : '登録する'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminRegister;