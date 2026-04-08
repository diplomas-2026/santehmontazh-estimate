import {
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translateProjectStatus } from '../i18n/enums';
import { TableShell } from './shared/TableShell';
import { useAuth } from '../modules/auth/AuthContext';

const projectLifecycle = [
  ['DRAFT', 'Черновик'],
  ['IN_PROGRESS', 'В работе'],
  ['PURCHASE_IN_PROGRESS', 'Факт фиксируется'],
  ['COMPLETED', 'Завершен'],
];

export function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);

  const totalActual = useMemo(
    () => projects.reduce((sum, project) => sum + Number(project.actualTotal ?? 0), 0),
    [projects],
  );

  useEffect(() => {
    api('/api/projects').then(setProjects).catch(() => setProjects([]));
  }, []);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Главный рабочий контур</p>
          <h2>Объекты</h2>
          <p className="muted">
            Основной путь в системе начинается с объекта. Уже внутри объекта ведутся сметы, позиции, факт затрат и итоговый контроль.
          </p>
        </div>
        <Button component={Link} to="/projects/new" variant="contained" size="large">
          Создать объект
        </Button>
      </div>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <div>
                  <Typography className="eyebrow">Object-first сценарий</Typography>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    Реестр нужен для поиска и контроля, а создание вынесено в отдельный спокойный экран
                  </Typography>
                  <Typography color="text.secondary">
                    Так пользователю проще: здесь он видит все свои объекты и открывает нужный, а кнопка создания ведет в отдельный мастер без лишнего шума.
                  </Typography>
                </div>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <Button component={Link} to="/projects/new" variant="contained" size="large">
                    Новый объект
                  </Button>
                  <Button component={Link} to="/dashboard" variant="outlined" color="inherit" size="large">
                    К обзору
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3} sx={{ height: '100%' }}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography className="eyebrow">Жизненный цикл объекта</Typography>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  От расчета до завершения
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Статусы помогают быстро понять, где объект только начинается, где уже идет активная работа по сметам и какие объекты закрыты.
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {projectLifecycle.map(([value, label]) => (
                    <Chip
                      key={value}
                      label={label}
                      color={value === 'IN_PROGRESS' ? 'primary' : 'default'}
                      variant={value === 'IN_PROGRESS' ? 'filled' : 'outlined'}
                    />
                  ))}
                </Stack>
              </CardContent>
            </Card>

            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography className="eyebrow">Быстрый ориентир</Typography>
                <Typography variant="h4" sx={{ mb: 1 }}>
                  Сводка по вашим объектам
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Typography color="text.secondary">Всего объектов: <strong>{projects.length}</strong></Typography>
                  <Typography color="text.secondary">Факт по сметам: <strong>{formatCurrency(totalActual)}</strong></Typography>
                  <Typography color="text.secondary">Текущий пользователь: <strong>{user.fullName}</strong></Typography>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <div style={{ marginTop: '24px' }}>
        <TableShell
          title="Реестр объектов"
          subtitle="Откройте объект, чтобы перейти к сметам, позициям и детальному контролю план / факт."
          columns={['Название', 'Код', 'Адрес', 'Статус', 'Факт', 'Карточка']}
          rows={projects.map((project) => [
            project.name,
            project.code,
            project.address,
            translateProjectStatus(project.status),
            formatCurrency(project.actualTotal),
            <Link key={`project-${project.id}`} className="primary-button" to={`/projects/${project.id}`}>Открыть объект</Link>,
          ])}
        />
      </div>
    </section>
  );
}
