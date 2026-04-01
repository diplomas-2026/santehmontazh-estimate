import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';

export function PricingPage() {
  const { plans, subscription, user } = useAuth();

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Stack spacing={3}>
        <Card sx={{ p: { xs: 1, md: 2 } }}>
          <CardContent>
            <Grid container spacing={3} alignItems="center">
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography className="eyebrow">Тарифы</Typography>
                <Typography variant="h2" sx={{ mb: 1.5 }}>Выберите формат доступа под объект, команду и масштаб закупок.</Typography>
                <Typography color="text.secondary">
                  Подписка оформляется на нужный период, активируется сразу после тестовой оплаты и открывает premium-возможности в интерфейсе.
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Card sx={{ background: alpha('#ffffff', 0.05) }}>
                  <CardContent>
                    <Typography className="eyebrow">Текущий статус</Typography>
                    <Typography variant="h5">{subscription ? subscription.tierName : 'Без подписки'}</Typography>
                    <Typography color="text.secondary">
                      {subscription
                        ? `Действует до ${new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}`
                        : 'Подключите тариф, чтобы открыть платные функции продукта.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {plans.map((plan) => (
            <Grid key={plan.id} size={{ xs: 12, md: 4 }}>
              <Card
                sx={{
                  height: '100%',
                  background: plan.highlight
                    ? `linear-gradient(160deg, ${alpha('#ff9b62', 0.18)}, ${alpha('#13213a', 0.86)})`
                    : alpha('#ffffff', 0.04),
                }}
              >
                <CardContent sx={{ display: 'grid', gap: 2.5 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                    <BoxPart title={plan.name} subtitle={plan.label} accent={plan.accent} />
                    {plan.highlight ? <Chip label="Рекомендуем" color="primary" /> : null}
                  </Stack>

                  <Typography color="text.secondary">{plan.description}</Typography>

                  <Stack spacing={1.2}>
                    {plan.features.map((feature) => (
                      <Stack key={feature} direction="row" spacing={1.2} alignItems="center">
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }} />
                        <Typography>{feature}</Typography>
                      </Stack>
                    ))}
                  </Stack>

                  <Stack spacing={1.5}>
                    {plan.periods.map((period) => (
                      <Card key={period.id} sx={{ background: alpha('#ffffff', 0.05) }}>
                        <CardContent sx={{ display: 'grid', gap: 1.2 }}>
                          <Typography>{period.label}</Typography>
                          <Typography variant="h5">{period.price}</Typography>
                          <Button
                            component={RouterLink}
                            to={user ? `/checkout?plan=${plan.id}&period=${period.id}` : '/login'}
                            variant="contained"
                          >
                            {user ? 'Оформить' : 'Войти для оплаты'}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Container>
  );
}

function BoxPart({ title, subtitle, accent }) {
  return (
    <Stack spacing={0.75}>
      <Typography className="eyebrow">{accent}</Typography>
      <Typography variant="h4">{title}</Typography>
      <Typography color="text.secondary">{subtitle}</Typography>
    </Stack>
  );
}
