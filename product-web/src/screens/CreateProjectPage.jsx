import {
  Alert,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { api } from '../api';

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
  ['IN_PROGRESS', 'В работе'],
  ['PURCHASE_IN_PROGRESS', 'Закупка идет'],
];

export function CreateProjectPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyProjectForm);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const created = await api('/api/projects', {
        method: 'POST',
        body: JSON.stringify(form),
      });
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
          <p className="eyebrow">Новый объект</p>
          <h2>Создание объекта</h2>
          <p className="muted">
            Сначала оформляется объект. После сохранения вы сразу перейдете в его карточку и сможете вести сметы и закупки.
          </p>
        </div>
        <Button component={Link} to="/projects" variant="outlined" color="inherit">
          К реестру объектов
        </Button>
      </div>

      <Card>
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
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
                  minRows={4}
                  label="Описание"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Что это за объект, какие работы и какой контур закупки планируется"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
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
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Старт"
                  value={form.plannedStartDate}
                  onChange={(event) => setForm((current) => ({ ...current, plannedStartDate: event.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
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
              <Button component={Link} to="/projects" variant="outlined" color="inherit" size="large">
                Отмена
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </section>
  );
}
