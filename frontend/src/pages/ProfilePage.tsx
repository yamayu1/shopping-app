import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  IconButton,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { addressService, CreateAddressData } from '../services/addressService';
import { Address } from '../types';
import { VALIDATION_RULES } from '../utils/constants';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const profileSchema = yup.object({
  first_name: yup.string().required('名を入力してください'),
  last_name: yup.string().required('姓を入力してください'),
  email: yup.string().email('有効なメールアドレスを入力してください').required('メールアドレスは必須です'),
  phone: yup.string().matches(VALIDATION_RULES.PHONE, '正しい電話番号を入力してください'),
});

const passwordSchema = yup.object({
  current_password: yup.string().required('現在のパスワードを入力してください'),
  new_password: yup.string().min(8, 'パスワードは8文字以上で入力してください').required('新しいパスワードは必須です'),
  new_password_confirmation: yup.string().oneOf([yup.ref('new_password')], 'パスワードが一致しません').required('パスワード確認は必須です'),
});

const addressSchema = yup.object({
  first_name: yup.string().required('名を入力してください'),
  last_name: yup.string().required('姓を入力してください'),
  address_line_1: yup.string().required('住所を入力してください'),
  address_line_2: yup.string(),
  city: yup.string().required('市区町村を入力してください'),
  state: yup.string().required('都道府県を入力してください'),
  postal_code: yup.string().required('郵便番号を入力してください'),
  country: yup.string().required('国を入力してください'),
  phone: yup.string().matches(VALIDATION_RULES.PHONE, '正しい電話番号を入力してください'),
});

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);

  const profileForm = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
    },
  });

  const passwordForm = useForm({
    resolver: yupResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      new_password_confirmation: '',
    },
  });

  const addressForm = useForm({
    resolver: yupResolver(addressSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '日本',
      phone: '',
    },
  });

  useEffect(() => {
    loadAddresses();

    // ユーザープロフィールデータを読み込んでフォームに反映
    if (user) {
      const nameParts = (user as any).name?.split(' ') || [];
      const firstName = nameParts.slice(1).join(' ') || user.first_name || '';
      const lastName = nameParts[0] || user.last_name || '';

      profileForm.reset({
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err: any) {
      // 404エラーは無視（エンドポイント未実装のため）
      if (err?.status !== 404) {
        console.error('住所の取得エラー:', err);
      }
    }
  };

  const handleProfileUpdate = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await updateProfile(data);
      setSuccess('プロフィールを更新しました');
    } catch (err: any) {
      setError('プロフィールの更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      await authService.changePassword({
        current_password: data.current_password,
        new_password: data.new_password,
        new_password_confirmation: data.new_password_confirmation,
      });
      setSuccess('パスワードを変更しました');
      passwordForm.reset();
    } catch (err: any) {
      setError('パスワードの変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = async (data: any) => {
    try {
      setLoading(true);
      setError(null);
      const addressData: CreateAddressData = {
        ...data,
        prefecture: data.state || data.prefecture,
        address_line1: data.address_line_1 || data.address_line1,
        address_line2: data.address_line_2 || data.address_line2,
        is_default: addresses.length === 0,
      };
      await addressService.createAddress(addressData);
      await loadAddresses();
      setShowAddressForm(false);
      addressForm.reset();
      setSuccess('住所を追加しました');
    } catch (err: any) {
      setError('住所の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!window.confirm('この住所を削除してもよろしいですか？')) return;

    try {
      setLoading(true);
      await addressService.deleteAddress(addressId);
      await loadAddresses();
      setSuccess('住所を削除しました');
    } catch (err: any) {
      setError('住所の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (addressId: number) => {
    try {
      setLoading(true);
      await addressService.setDefaultAddress(addressId);
      await loadAddresses();
      setSuccess('デフォルト住所を設定しました');
    } catch (err: any) {
      setError('デフォルト住所の設定に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          アカウント設定
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%' }}>
          <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="プロフィール" />
            <Tab label="住所管理" />
            <Tab label="パスワード変更" />
          </Tabs>

          {/* プロフィールタブ */}
          <TabPanel value={activeTab} index={0}>
            <Box component="form" onSubmit={profileForm.handleSubmit(handleProfileUpdate)} sx={{ maxWidth: 600, mx: 'auto' }}>
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Controller
                    name="last_name"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="姓"
                        fullWidth
                        error={!!profileForm.formState.errors.last_name}
                        helperText={profileForm.formState.errors.last_name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Controller
                    name="first_name"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="名"
                        fullWidth
                        error={!!profileForm.formState.errors.first_name}
                        helperText={profileForm.formState.errors.first_name?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="email"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="メールアドレス"
                        type="email"
                        fullWidth
                        error={!!profileForm.formState.errors.email}
                        helperText={profileForm.formState.errors.email?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="phone"
                    control={profileForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="電話番号"
                        fullWidth
                        error={!!profileForm.formState.errors.phone}
                        helperText={profileForm.formState.errors.phone?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? '更新中...' : 'プロフィールを更新'}
              </Button>
            </Box>
          </TabPanel>

          {/* 住所タブ */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  保存された住所
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setShowAddressForm(!showAddressForm)}
                >
                  新しい住所を追加
                </Button>
              </Box>

              {showAddressForm && (
                <Card sx={{ mb: 3, bgcolor: 'grey.50' }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                      新しい住所
                    </Typography>
                    <Box component="form" onSubmit={addressForm.handleSubmit(handleAddressSubmit)}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Controller
                            name="last_name"
                            control={addressForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="姓"
                                fullWidth
                                size="small"
                                error={!!addressForm.formState.errors.last_name}
                                helperText={addressForm.formState.errors.last_name?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller
                            name="first_name"
                            control={addressForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="名"
                                fullWidth
                                size="small"
                                error={!!addressForm.formState.errors.first_name}
                                helperText={addressForm.formState.errors.first_name?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="postal_code"
                            control={addressForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="郵便番号"
                                fullWidth
                                size="small"
                                error={!!addressForm.formState.errors.postal_code}
                                helperText={addressForm.formState.errors.postal_code?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller
                            name="state"
                            control={addressForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="都道府県"
                                fullWidth
                                size="small"
                                error={!!addressForm.formState.errors.state}
                                helperText={addressForm.formState.errors.state?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller
                            name="city"
                            control={addressForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="市区町村"
                                fullWidth
                                size="small"
                                error={!!addressForm.formState.errors.city}
                                helperText={addressForm.formState.errors.city?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="address_line_1"
                            control={addressForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="住所1"
                                fullWidth
                                size="small"
                                error={!!addressForm.formState.errors.address_line_1}
                                helperText={addressForm.formState.errors.address_line_1?.message}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="address_line_2"
                            control={addressForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="住所2（建物名・部屋番号など）"
                                fullWidth
                                size="small"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="phone"
                            control={addressForm.control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="電話番号"
                                fullWidth
                                size="small"
                                error={!!addressForm.formState.errors.phone}
                                helperText={addressForm.formState.errors.phone?.message}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>

                      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                        <Button variant="contained" type="submit" disabled={loading}>
                          追加
                        </Button>
                        <Button variant="outlined" onClick={() => setShowAddressForm(false)}>
                          キャンセル
                        </Button>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              )}

              <Stack spacing={2}>
                {addresses.map((address) => (
                  <Card key={address.id}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {address.first_name} {address.last_name}
                            {address.is_default && (
                              <Typography component="span" variant="caption" color="primary" sx={{ ml: 1, px: 1, py: 0.5, bgcolor: 'primary.50', borderRadius: 1 }}>
                                デフォルト
                              </Typography>
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            〒{address.postal_code}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {address.prefecture} {address.city} {address.address_line1}
                            {address.address_line2 && ` ${address.address_line2}`}
                          </Typography>
                          {address.phone && (
                            <Typography variant="body2" color="text.secondary">
                              電話: {address.phone}
                            </Typography>
                          )}
                        </Box>
                        <Box>
                          {!address.is_default && (
                            <Button size="small" onClick={() => handleSetDefault(address.id!)}>
                              デフォルトに設定
                            </Button>
                          )}
                          <IconButton size="small" onClick={() => handleDeleteAddress(address.id!)} color="error">
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                {addresses.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      保存された住所はありません
                    </Typography>
                  </Box>
                )}
              </Stack>
            </Box>
          </TabPanel>

          {/* パスワードタブ */}
          <TabPanel value={activeTab} index={2}>
            <Box component="form" onSubmit={passwordForm.handleSubmit(handlePasswordChange)} sx={{ maxWidth: 600, mx: 'auto' }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Controller
                    name="current_password"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="現在のパスワード"
                        type="password"
                        fullWidth
                        error={!!passwordForm.formState.errors.current_password}
                        helperText={passwordForm.formState.errors.current_password?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="new_password"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="新しいパスワード"
                        type="password"
                        fullWidth
                        error={!!passwordForm.formState.errors.new_password}
                        helperText={passwordForm.formState.errors.new_password?.message}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Controller
                    name="new_password_confirmation"
                    control={passwordForm.control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="新しいパスワード（確認）"
                        type="password"
                        fullWidth
                        error={!!passwordForm.formState.errors.new_password_confirmation}
                        helperText={passwordForm.formState.errors.new_password_confirmation?.message}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                sx={{ mt: 3 }}
              >
                {loading ? '変更中...' : 'パスワードを変更'}
              </Button>
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </Container>
  );
};

export default ProfilePage;