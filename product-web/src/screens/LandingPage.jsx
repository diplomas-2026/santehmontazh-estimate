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
import { formatRuDate } from '../i18n/date';
import { useAuth } from '../modules/auth/AuthContext';

const premiumSignals = [
  ['24%', 'сокращение перерасхода по материалам'],
  ['3 дня', 'экономии на цикле обработки сметы'],
  ['1 окно', 'для объекта, сметы и факта'],
];

const productSteps = [
  {
    marker: '01',
    title: 'Соберите смету из реальной потребности',
    text: 'Платформа переводит инженерные объемы в финансовую картину объекта и сразу показывает стоимость решения.',
  },
  {
    marker: '02',
    title: 'Заполните факт прямо в смете без ручной пересборки',
    text: 'Команда не переносит данные между файлами: смета, ее позиции, фактические цены и место покупки идут в одном контуре.',
  },
  {
    marker: '03',
    title: 'Покажите прозрачность по объекту',
    text: 'План / факт, отклонения и premium-аналитика показывают, где объект теряет деньги и где можно выиграть.',
  },
];

const paidFeatures = [
  'План / факт по сметам с подсветкой перерасхода',
  'Расширенные карточки поставщиков и материалов',
  'Расширенная аналитика по пользователям и объектам',
  'Приоритетные управленческие сигналы и монетизация premium',
];

const userWorkflow = [
  {
    title: 'Объект',
    text: 'Создайте карточку объекта, чтобы зафиксировать площадку, адрес и текущий этап работ.',
  },
  {
    title: 'Смета',
    text: 'Соберите расчет и позиции затрат по объекту в одном месте.',
  },
  {
    title: 'Факт',
    text: 'Зафиксируйте фактическую цену и место покупки прямо в позиции сметы без ручного переноса данных.',
  },
  {
    title: 'Контроль',
    text: 'Смотрите статусы, контролируйте факт покупки и сравнивайте план / факт по объекту.',
  },
];

export function LandingPage() {
  const { user, plans, subscription } = useAuth();
  const featuredPlan = plans.find((plan) => plan.highlight) ?? plans[1];
  const checkoutLink = user
    ? `/checkout?plan=${featuredPlan.id}&period=${featuredPlan.periods[0].id}`
    : '/login';

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 3, md: 4 } }}>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: { xs: 1, md: 2 }, minHeight: '100%' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack spacing={4}>
                <Stack spacing={2}>
                  <Typography className="eyebrow">Смета. Факт. Контроль маржи.</Typography>
                  <Typography variant="h1" sx={{ fontSize: { xs: '2.5rem', md: '4.8rem' }, maxWidth: '12ch' }}>
                    Платформа, которая превращает потребность объекта в управляемую смету и понятный план / факт.
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 760, fontWeight: 500 }}>
                    «СантехМонтаж Estimate» помогает подрядчику считать сметы быстрее, контролировать материалы и
                    показывать команде современный цифровой процесс вместо Excel-хаоса.
                  </Typography>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button component={RouterLink} to={user ? '/dashboard' : '/register'} variant="contained" size="large">
                    {user ? 'Открыть кабинет' : 'Попробовать бесплатно'}
                  </Button>
                  <Button component={RouterLink} to="/pricing" variant="outlined" color="inherit" size="large">
                    Посмотреть тарифы
                  </Button>
                </Stack>

                <Grid container spacing={2}>
                  {premiumSignals.map(([value, label]) => (
                    <Grid key={label} size={{ xs: 12, sm: 4 }}>
                      <Card
                        sx={{
                          height: '100%',
                          background: alpha('#ffffff', 0.05),
                        }}
                      >
                        <CardContent>
                          <Typography variant="h4" sx={{ mb: 1 }}>{value}</Typography>
                          <Typography color="text.secondary">{label}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <Card
              sx={{
                background: `linear-gradient(180deg, ${alpha('#ff9b62', 0.18)}, ${alpha('#0c1526', 0.88)})`,
              }}
            >
              <CardContent sx={{ display: 'grid', gap: 2.5 }}>
                <Typography className="eyebrow">Тариф дня</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  <Typography variant="h3">{featuredPlan.name}</Typography>
                </Stack>
                <Typography color="text.secondary">{featuredPlan.description}</Typography>
                <Typography variant="h4">{featuredPlan.periods[0].price}</Typography>
                <Typography color="text.secondary">{featuredPlan.periods[0].label}</Typography>
                <Stack spacing={1}>
                  {featuredPlan.features.slice(0, 4).map((feature) => (
                    <Chip key={feature} label={feature} sx={{ justifyContent: 'flex-start' }} />
                  ))}
                </Stack>
                <Button component={RouterLink} to={checkoutLink} variant="contained" size="large">
                  {user ? 'Оформить подписку' : 'Войти и оформить'}
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ background: alpha('#ffffff', 0.05) }}>
              <CardContent sx={{ display: 'grid', gap: 1 }}>
                <Typography className="eyebrow">Статус premium</Typography>
                <Typography variant="h5">
                  {subscription ? `Подписка ${subscription.tierName}` : 'Premium еще не активирован'}
                </Typography>
                <Typography color="text.secondary">
                  {subscription
                    ? `Доступ активен до ${formatRuDate(subscription.expiresAt)}.`
                    : 'Подключите подписку, чтобы открыть расширенную аналитику, поставщиков и платные сценарии продукта.'}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Card sx={{ p: { xs: 1, md: 2 } }}>
          <CardContent>
            <Stack spacing={3}>
              <Box>
                <Typography className="eyebrow">Как это работает</Typography>
                  <Typography variant="h3">Продукт выстраивает путь от потребности объекта до фактических затрат без потери контекста.</Typography>
              </Box>

              <Grid container spacing={2}>
                {productSteps.map((step) => (
                  <Grid key={step.title} size={{ xs: 12, md: 4 }}>
                    <Card sx={{ height: '100%', background: alpha('#ffffff', 0.04) }}>
                        <CardContent sx={{ display: 'grid', gap: 2 }}>
                        <Box sx={{ width: 52, height: 52, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: alpha('#ffffff', 0.08), fontWeight: 800 }}>
                          {step.marker}
                        </Box>
                        <Typography variant="h5">{step.title}</Typography>
                        <Typography color="text.secondary">{step.text}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Grid container spacing={3} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ p: { xs: 1, md: 2 }, height: '100%' }}>
            <CardContent>
              <Stack spacing={2.5}>
                <Box>
                  <Typography className="eyebrow">Premium продает себя сам</Typography>
                  <Typography variant="h3">Часть функций сознательно вынесена в платный доступ, чтобы монетизация была естественной.</Typography>
                </Box>
                <Typography color="text.secondary">
                  Бесплатный сценарий дает вход в систему, а платные блоки усиливают ценность продукта и помогают продавать подписку внутри кабинета.
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {paidFeatures.map((feature) => (
                    <Chip key={feature} label={feature} color="primary" variant="outlined" />
                  ))}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ p: { xs: 1, md: 2 }, height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography className="eyebrow">Как пользоваться сервисом</Typography>
                  <Typography variant="h3">Сервис нужен, чтобы провести пользователя от объекта до контроля фактических затрат.</Typography>
                </Box>
                <Grid container spacing={2}>
                  {userWorkflow.map((step, index) => (
                    <Grid key={step.title} size={{ xs: 12, sm: 6 }}>
                      <Card sx={{ height: '100%', background: alpha('#ffffff', 0.04) }}>
                        <CardContent sx={{ display: 'grid', gap: 1.2 }}>
                          <Typography className="eyebrow">Шаг {index + 1}</Typography>
                          <Typography variant="h5">{step.title}</Typography>
                          <Typography color="text.secondary">{step.text}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Typography color="text.secondary">
                  Идея продукта в том, чтобы команда не считала смету отдельно от факта. Сервис показывает,
                  что именно нужно сделать, во сколько это должно обойтись и где по объекту начинается перерасход.
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Card sx={{ p: { xs: 1, md: 2 }, height: '100%' }}>
            <CardContent>
              <Stack spacing={3}>
                <Box>
                  <Typography className="eyebrow">Готово к демо</Typography>
                  <Typography variant="h3">Запустите тестовый сценарий сегодня и покажите команде, как должна выглядеть современная смета.</Typography>
                </Box>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button component={RouterLink} to="/pricing" variant="contained" size="large">
                    Выбрать подписку
                  </Button>
                  <Button component={RouterLink} to={user ? '/dashboard' : '/login'} variant="outlined" color="inherit" size="large">
                    {user ? 'Перейти в кабинет' : 'У меня уже есть аккаунт'}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
