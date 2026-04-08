import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { useAuth } from '../modules/auth/AuthContext';
import { TableShell } from './shared/TableShell';

export function ReportsPage() {
  const { hasPremiumAccess } = useAuth();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api('/api/dashboard/deviations').then(setRows).catch(() => setRows([]));
  }, []);

  if (!hasPremiumAccess) {
    return (
      <section className="page-section">
        <div className="page-card premium-banner premium-banner-block">
          <div>
            <p className="eyebrow">Premium-аналитика</p>
            <h2>План / факт — сильный модуль, который раскрывает отклонения по сметам и объектам.</h2>
            <p>
              В платном доступе находятся отклонения по сметам, приоритеты по объектам и управленческие сигналы для команды.
            </p>
          </div>
          <Link className="primary-button" to="/pricing">Открыть premium</Link>
        </div>
      </section>
    );
  }

  return (
    <TableShell
      title="Аналитика план / факт"
      subtitle="Контроль отклонений по сметам и объектам"
      columns={['Объект', 'Смета', 'План', 'Факт', 'Отклонение']}
      rows={rows.map((row) => [
        <Link className="detail-link" to={`/projects/${row.projectId}`}>{row.projectName}</Link>,
        <Link className="detail-link" to={`/estimates/${row.estimateId}`}>{row.estimateName}</Link>,
        formatCurrency(row.plannedTotal),
        formatCurrency(row.actualTotal),
        formatCurrency(row.deviation),
      ])}
    />
  );
}
