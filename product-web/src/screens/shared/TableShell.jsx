import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../modules/auth/AuthContext';

export function TableShell({ title, subtitle, columns, rows, premium = false, premiumMessage }) {
  const { hasPremiumAccess } = useAuth();
  const showPremiumBanner = premium && !hasPremiumAccess;

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Рабочий раздел</p>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
      </div>

      {showPremiumBanner ? (
        <Alert
          severity="warning"
          action={<Button component={RouterLink} to="/pricing" color="inherit" variant="contained">Оформить подписку</Button>}
        >
          <strong>Premium:</strong> {premiumMessage ?? 'Подключите платный тариф, чтобы открыть аналитику и расширенные управленческие сценарии.'}
        </Alert>
      ) : null}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      <Typography sx={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'primary.light' }}>
                        {column}
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length ? rows.map((row, index) => (
                  <TableRow key={`${title}-${index + 1}`} hover>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={`${title}-${index + 1}-${cellIndex + 1}`}>{cell}</TableCell>
                    ))}
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <Stack sx={{ py: 4 }} alignItems="center">
                        <Typography color="text.secondary">Пока нет данных для отображения.</Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </section>
  );
}

