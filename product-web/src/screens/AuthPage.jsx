import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../modules/auth/AuthContext';

export function AuthPage({ mode }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isRegister = mode === 'register';

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) {
        await register(form);
      } else {
        await login(form);
      }
      navigate('/dashboard');
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 }, minHeight: '100vh', display: 'grid', alignItems: 'center' }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 3, md: 5 }, display: 'grid', gap: 3 }}>
              <Typography className="eyebrow">Современный продукт для подрядчика</Typography>
              <Typography variant="h1" sx={{ fontSize: { xs: '2.4rem', md: '4.6rem' }, maxWidth: '11ch' }}>
                Объекты, сметы и закупки в одном потоке, а не в десятке таблиц.
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 680 }}>
                Платформа помогает вести объект от первого расчета до закупки материалов и показывает прозрачную картину по бюджету.
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                <Button variant="outlined" color="inherit">Объекты</Button>
                <Button variant="outlined" color="inherit">Позиции смет</Button>
                <Button variant="outlined" color="inherit">Premium-аналитика</Button>
              </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button component={RouterLink} to="/" variant="outlined" color="inherit" size="large">О продукте</Button>
                <Button component={RouterLink} to="/pricing" variant="contained" size="large">Тарифы</Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 }, display: 'grid', gap: 2.5 }}>
              <Box>
                <Typography className="eyebrow">Производственная платформа</Typography>
                <Typography variant="h3" sx={{ mb: 1.5 }}>
                  {isRegister ? 'Регистрация пользователя' : 'Вход в систему'}
                </Typography>
                <Typography color="text.secondary">
                  {isRegister
                    ? 'После регистрации у вас появится рабочее пространство для объектов, смет и закупок.'
                    : 'Авторизуйтесь, чтобы работать со сметами, закупками и premium-аналитикой по объектам.'}
                </Typography>
              </Box>

              <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                {isRegister ? (
                  <TextField
                    label="ФИО"
                    value={form.fullName}
                    onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                    placeholder="Иван Петров"
                  />
                ) : null}

                <TextField
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="user@santehmontazh.local"
                />

                <TextField
                  label="Пароль"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Минимум 8 символов"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          edge="end"
                          aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                          onClick={() => setShowPassword((current) => !current)}
                        >
                          {showPassword ? 'Скрыть' : 'Показать'}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error ? <Alert severity="error">{error}</Alert> : null}

                <Button type="submit" variant="contained" size="large" disabled={busy}>
                  {busy ? 'Подождите...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
                </Button>
              </Stack>

              <Typography color="text.secondary">
                {isRegister ? (
                  <RouterLink to="/login">Уже есть аккаунт? Войти</RouterLink>
                ) : (
                  <RouterLink to="/register">Нет аккаунта? Зарегистрироваться</RouterLink>
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
