import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { getPeriodById, getPlanById } from '../modules/subscription/plans';

const initialForm = {
  companyName: '',
  email: '',
  cardHolder: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, activateSubscription } = useAuth();
  const plan = useMemo(() => getPlanById(params.get('plan')), [params]);
  const period = useMemo(() => getPeriodById(plan, params.get('period')), [plan, params]);
  const [form, setForm] = useState({
    ...initialForm,
    email: user?.email ?? '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setBusy(true);

    try {
      const subscription = await activateSubscription({
        tierId: plan.id,
        periodId: period.id,
        companyName: form.companyName,
        email: form.email,
        cardHolder: form.cardHolder,
        cardNumber: form.cardNumber,
        expiry: form.expiry,
        cvc: form.cvc,
      });

      setSuccess(`Подписка ${subscription.tierName} успешно активирована.`);
      window.setTimeout(() => navigate('/dashboard'), 900);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ display: 'grid', gap: 2.5 }}>
              <Typography className="eyebrow">Checkout</Typography>
              <Typography variant="h2">Оформление тестовой подписки</Typography>
              <Typography color="text.secondary">
                Платежный шлюз не подключен, поэтому после заполнения формы доступ активируется сразу и сохраняется в базе пользователя.
              </Typography>

              <Card sx={{ background: 'rgba(255,255,255,0.05)' }}>
                <CardContent sx={{ display: 'grid', gap: 1.2 }}>
                  <Typography variant="h4">{plan.name}</Typography>
                  <Typography color="text.secondary">{plan.description}</Typography>
                  <Typography variant="h5">{period.price}</Typography>
                  <Typography color="text.secondary">{period.label}</Typography>
                  <Stack spacing={1}>
                    {plan.features.map((feature) => (
                      <Typography key={feature}>{feature}</Typography>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Button component={RouterLink} to="/pricing" variant="outlined" color="inherit">
                Вернуться к тарифам
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent component="form" onSubmit={submit} sx={{ display: 'grid', gap: 2.5 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Компания" value={form.companyName} onChange={(event) => updateField('companyName', event.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Email для подписки" type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Владелец карты" value={form.cardHolder} onChange={(event) => updateField('cardHolder', event.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Номер карты" value={form.cardNumber} onChange={(event) => updateField('cardNumber', event.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="Срок действия" value={form.expiry} onChange={(event) => updateField('expiry', event.target.value)} />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField fullWidth label="CVC" value={form.cvc} onChange={(event) => updateField('cvc', event.target.value)} />
                </Grid>
              </Grid>

              {error ? <Alert severity="error">{error}</Alert> : null}
              {success ? <Alert severity="success">{success}</Alert> : null}

              <Button type="submit" variant="contained" size="large" disabled={busy}>
                {busy ? 'Активируем...' : `Активировать подписку за ${period.price}`}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

