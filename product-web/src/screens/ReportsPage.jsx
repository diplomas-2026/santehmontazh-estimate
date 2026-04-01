import { useEffect, useState } from 'react';
import { api } from '../api';
import { TableShell } from './shared/TableShell';

export function ReportsPage() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api('/api/dashboard/deviations').then(setRows).catch(() => setRows([]));
  }, []);

  return (
    <TableShell
      title="Аналитика план / факт"
      subtitle="Контроль отклонений по закупкам и объектам"
      columns={['Объект', 'Смета', 'План', 'Факт', 'Отклонение']}
      rows={rows.map((row) => [
        row.projectName,
        row.estimateName,
        row.plannedTotal,
        row.actualTotal,
        row.deviation,
      ])}
    />
  );
}
