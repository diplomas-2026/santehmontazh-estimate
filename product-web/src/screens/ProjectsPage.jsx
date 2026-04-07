import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translateProjectStatus } from '../i18n/enums';
import { TableShell } from './shared/TableShell';
import { useAuth } from '../modules/auth/AuthContext';

const emptyProjectForm = {
  name: '',
  code: '',
  address: '',
  description: '',
  status: 'DRAFT',
  plannedStartDate: '',
  plannedEndDate: '',
};

const projectLifecycle = [
  ['DRAFT', 'Черновик'],
  ['PLANNED', 'Запланирован'],
  ['IN_PROGRESS', 'В работе'],
  ['PURCHASE_IN_PROGRESS', 'Закупка идет'],
  ['COMPLETED', 'Завершен'],
];

export function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyProjectForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const totalPurchases = useMemo(
    () => projects.reduce((sum, project) => sum + Number(project.purchaseTotal ?? 0), 0),
    [projects],
  );

  function load() {
    api('/api/projects').then(setProjects).catch(() => setProjects([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await api('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          code: form.code,
          address: form.address,
          description: form.description,
          status: form.status,
          plannedStartDate: form.plannedStartDate,
          plannedEndDate: form.plannedEndDate,
        }),
      });
      setError('');
      setForm(emptyProjectForm);
      load();
      navigate(`/projects/${created.id}`);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Главный рабочий контур</p>
          <h2>Объекты</h2>
          <p className="muted">
            Сначала создается объект. Внутри него пользователь ведет сметы, запускает закупки и отслеживает итоговый план / факт.
          </p>
        </div>
      </div>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 3, md: 4 } }}>
              <Stack spacing={3}>
                <div>
                  <Typography className="eyebrow">Новый объект</Typography>
                  <Typography variant="h3" sx={{ mb: 1 }}>
                    Создайте объект и сразу начните вести сметы внутри него
                  </Typography>
                  <Typography color="text.secondary">
                    Все последующие действия происходят уже в карточке объекта: смета, позиции, закупка и контроль исполнения.
                  </Typography>
                </div>

                <Stack component="form" spacing={2} onSubmit={submit}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Название объекта"
                        value={form.name}
                        onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                        placeholder="Например: ЖК Волна, секция А"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Код объекта"
                        value={form.code}
                        onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                        placeholder="OBJ-001"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        label="Адрес"
                        value={form.address}
                        onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                        placeholder="Город, улица, дом"
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Описание"
                        value={form.description}
                        onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Что это за объект и какие работы планируются"
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        select
                        label="Статус"
                        value={form.status}
                        onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}
                      >
                        {projectLifecycle.map(([value, label]) => (
                          <MenuItem key={value} value={value}>{label}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Старт"
                        value={form.plannedStartDate}
                        onChange={(event) => setForm((current) => ({ ...current, plannedStartDate: event.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        type="date"
                        label="Финиш"
                        value={form.plannedEndDate}
                        onChange={(event) => setForm((current) => ({ ...current, plannedEndDate: event.target.value }))}
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>

                  {error ? <Alert severity="error">{error}</Alert> : null}

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button type="submit" variant="contained" size="large" disabled={busy}>
                      {busy ? 'Создаем объект...' : 'Создать объект'}
                    </Button>
                    <Button component={Link} to="/dashboard" variant="outlined" color="inherit" size="large">
                      Вернуться к обзору
                    </Button>
                  </Stack>
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
                  Переход от расчета к закупке
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  Статусы помогают быстро понять, на каком этапе находится объект без лишних объяснений.
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
                  Что видно в списке объектов
                </Typography>
                <Typography color="text.secondary">
                  Таблица ниже показывает код, адрес, статус и общую сумму закупок по каждому объекту.
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Typography color="text.secondary">Всего объектов: <strong>{projects.length}</strong></Typography>
                  <Typography color="text.secondary">Сумма закупок по всем объектам: <strong>{formatCurrency(totalPurchases)}</strong></Typography>
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
          subtitle="Это список всех объектов. Для работы со сметами и закупками откройте карточку объекта."
          columns={['Название', 'Код', 'Адрес', 'Статус', 'Закупки', 'Карточка']}
          rows={projects.map((project) => [
            project.name,
            project.code,
            project.address,
            translateProjectStatus(project.status),
            formatCurrency(project.purchaseTotal),
            <Link key={`project-${project.id}`} className="primary-button" to={`/projects/${project.id}`}>Открыть объект</Link>,
          ])}
        />
      </div>
    </section>
  );
}
