import { useEffect, useState } from 'react';
import { api } from '../api';

export function DashboardPage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api('/api/dashboard/summary').then(setSummary).catch(() => setSummary(null));
  }, []);

  if (!summary) {
    return <div className="page-card">Загрузка дашборда...</div>;
  }

  const cards = [
    ['План по активным сметам', summary.activeEstimateTotal],
    ['План по закупкам', summary.activePurchasePlannedTotal],
    ['Факт по закупкам', summary.completedPurchaseActualTotal],
    ['Отклонение', summary.totalDeviation],
  ];

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Главная панель</p>
          <h2>Оперативная сводка по объектам</h2>
        </div>
      </div>

      <div className="metric-grid">
        {cards.map(([label, value]) => (
          <article key={label} className="metric-card">
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>

      <div className="table-grid">
        <StatusCard title="Объекты" data={summary.projectStatuses} />
        <StatusCard title="Сметы" data={summary.estimateStatuses} />
        <StatusCard title="Закупки" data={summary.purchaseStatuses} />
      </div>
    </section>
  );
}

function StatusCard({ title, data }) {
  return (
    <article className="page-card">
      <h3>{title}</h3>
      {Object.entries(data).map(([status, count]) => (
        <div key={status} className="row-between">
          <span>{status}</span>
          <strong>{count}</strong>
        </div>
      ))}
    </article>
  );
}
