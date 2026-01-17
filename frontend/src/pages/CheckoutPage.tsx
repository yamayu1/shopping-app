import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Button,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  TextField,
  Stack,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useCart } from '../contexts/CartContext';
import { addressService, CreateAddressData } from '../services/addressService';
import { orderService, CreateOrderData } from '../services/orderService';
import { Address } from '../types';
import { formatCurrency } from '../utils/helpers';
import { ROUTES, VALIDATION_RULES } from '../utils/constants';

const steps = ['配送先情報', '支払い方法', '注文確認'];

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

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, totalAmount, clearCart, isLoading: cartLoading } = useCart();
  const [activeStep, setActiveStep] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedShippingAddress, setSelectedShippingAddress] = useState<number | 'new'>('new');
  const [selectedBillingAddress, setSelectedBillingAddress] = useState<number | 'same' | 'new'>('same');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, reset, getValues } = useForm({
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
  }, []);

  useEffect(() => {
    if (!cartLoading && cart && cart.items && cart.items.length === 0 && activeStep === 0) {
      navigate(ROUTES.CART);
    }
  }, [cart, cartLoading]);

  const loadAddresses = async () => {
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);

      const defaultShipping = data.find(addr => addr.is_default);
      if (defaultShipping) {
        setSelectedShippingAddress(defaultShipping.id!);
      }
    } catch (err) {
      // 住所の取得に失敗
    }
  };

  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      let addressId = selectedShippingAddress;

      // 新しい住所の場合は先に作成
      if (selectedShippingAddress === 'new') {
        const formData = getValues();
        const newAddress = await addressService.createAddress({
          first_name: formData.first_name,
          last_name: formData.last_name,
          postal_code: formData.postal_code,
          prefecture: formData.state,
          city: formData.city,
          address_line1: formData.address_line_1,
          address_line2: formData.address_line_2,
          phone: formData.phone || '',
        });
        addressId = newAddress.id!;
      }

      const orderData: CreateOrderData = {
        address_id: addressId as number,
        payment_method: paymentMethod,
      };

      await orderService.createOrder(orderData);
      navigate(ROUTES.ORDERS);
    } catch (err: any) {
      setError('注文の処理に失敗しました。もう一度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const shippingCost = totalAmount >= 5000 ? 0 : 500;
  const finalTotal = totalAmount + shippingCost;

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          購入手続き
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    配送先住所
                  </Typography>

                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup
                      value={selectedShippingAddress}
                      onChange={(e) => setSelectedShippingAddress(e.target.value === 'new' ? 'new' : Number(e.target.value))}
                    >
                      {addresses.map((address) => (
                        <Card key={address.id} sx={{ mb: 2 }}>
                          <CardContent>
                            <FormControlLabel
                              value={address.id}
                              control={<Radio />}
                              label={
                                <Box>
                                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                    {address.first_name} {address.last_name}
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
                              }
                              sx={{ width: '100%' }}
                            />
                          </CardContent>
                        </Card>
                      ))}
                      <FormControlLabel
                        value="new"
                        control={<Radio />}
                        label="新しい住所を入力"
                      />
                    </RadioGroup>
                  </FormControl>

                  {selectedShippingAddress === 'new' && (
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                        新しい配送先住所
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Controller
                            name="last_name"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="姓"
                                fullWidth
                                error={!!errors.last_name}
                                helperText={errors.last_name?.message as string}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller
                            name="first_name"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="名"
                                fullWidth
                                error={!!errors.first_name}
                                helperText={errors.first_name?.message as string}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="postal_code"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="郵便番号"
                                fullWidth
                                error={!!errors.postal_code}
                                helperText={errors.postal_code?.message as string}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller
                            name="state"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="都道府県"
                                fullWidth
                                error={!!errors.state}
                                helperText={errors.state?.message as string}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <Controller
                            name="city"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="市区町村"
                                fullWidth
                                error={!!errors.city}
                                helperText={errors.city?.message as string}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="address_line_1"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="住所1"
                                fullWidth
                                error={!!errors.address_line_1}
                                helperText={errors.address_line_1?.message as string}
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="address_line_2"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="住所2（建物名・部屋番号など）"
                                fullWidth
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Controller
                            name="phone"
                            control={control}
                            render={({ field }) => (
                              <TextField
                                {...field}
                                label="電話番号"
                                fullWidth
                                error={!!errors.phone}
                                helperText={errors.phone?.message as string}
                              />
                            )}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
                    <Button variant="contained" onClick={handleNext}>
                      次へ
                    </Button>
                  </Box>
                </Box>
              )}

              {/* 支払い方法 */}
              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    支払い方法
                  </Typography>

                  <FormControl component="fieldset" fullWidth>
                    <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <FormControlLabel
                            value="credit_card"
                            control={<Radio />}
                            label="クレジットカード"
                          />
                        </CardContent>
                      </Card>
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <FormControlLabel
                            value="bank_transfer"
                            control={<Radio />}
                            label="銀行振込"
                          />
                        </CardContent>
                      </Card>
                      <Card sx={{ mb: 2 }}>
                        <CardContent>
                          <FormControlLabel
                            value="cash_on_delivery"
                            control={<Radio />}
                            label="代金引換"
                          />
                        </CardContent>
                      </Card>
                    </RadioGroup>
                  </FormControl>

                  <Alert severity="info" sx={{ mt: 3 }}>
                    この注文はシミュレーションです。実際の決済は行われません。
                  </Alert>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                    <Button onClick={handleBack}>
                      戻る
                    </Button>
                    <Button variant="contained" onClick={handleNext}>
                      次へ
                    </Button>
                  </Box>
                </Box>
              )}

              {activeStep === 2 && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    注文内容の確認
                  </Typography>

                  {cart.items.map((item) => (
                    <Box key={item.id} sx={{ mb: 2, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                      <Grid container spacing={2}>
                        <Grid item xs={8}>
                          <Typography variant="body1">{item.product.name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            数量: {item.quantity}
                          </Typography>
                        </Grid>
                        <Grid item xs={4} sx={{ textAlign: 'right' }}>
                          <Typography variant="body1">
                            {formatCurrency(item.price * item.quantity)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Box>
                  ))}

                  <Divider sx={{ my: 3 }} />

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>小計:</Typography>
                      <Typography>{formatCurrency(totalAmount)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>配送料:</Typography>
                      <Typography>{shippingCost === 0 ? '無料' : formatCurrency(shippingCost)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>合計:</Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                        {formatCurrency(finalTotal)}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                    <Button onClick={handleBack}>
                      戻る
                    </Button>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handlePlaceOrder}
                      disabled={loading}
                    >
                      {loading ? '処理中...' : '注文を確定する'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                注文サマリー
              </Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">商品点数:</Typography>
                  <Typography variant="body2">
                    {cart.items.reduce((total, item) => total + item.quantity, 0)}点
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">小計:</Typography>
                  <Typography variant="body2">{formatCurrency(totalAmount)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">配送料:</Typography>
                  <Typography variant="body2">{shippingCost === 0 ? '無料' : formatCurrency(shippingCost)}</Typography>
                </Box>
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>合計:</Typography>
                <Typography variant="h6" color="primary" sx={{ fontWeight: 700 }}>
                  {formatCurrency(finalTotal)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default CheckoutPage;