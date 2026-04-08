import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translateEstimateStatus, translateProjectStatus, translateRole } from '../i18n/enums';
import { useAuth } from '../modules/auth/AuthContext';

export function DashboardPage() {
  const { user, subscription, hasPremiumAccess } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api('/api/dashboard/summary').then(setSummary).catch(() => setSummary(null));
  }, []);

  if (!summary) {
    return <div className="page-card">Загрузка дашборда...</div>;
  }

  const cards = [
    ['План по сметам', summary.plannedEstimateTotal],
    ['Факт по сметам', summary.actualEstimateTotal],
    ['Отклонение', summary.totalDeviation],
  ];

  return (
    <section className="page-section">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Оперативный обзор</p>
          <h2>Одна смета теперь хранит и план, и реальный факт исполнения.</h2>
          <p className="muted">
            Пользователь работает через объекты и сметы: создает расчет, фиксирует фактические цены и место покупки прямо в позициях,
            а затем сравнивает план и факт без отдельной сущности закупки.
          </p>
          <div className="hero-actions">
            <Link className="primary-button hero-button" to="/projects">Открыть объекты</Link>
            <Link className="ghost-button hero-button" to="/estimates">Открыть сметы</Link>
          </div>
        </div>

        <div className="status-card premium">
          <span>Аккаунт и доступ</span>
          <strong>{user.fullName}</strong>
          <p>
            {translateRole(user.role)} • {subscription ? `тариф ${subscription.tierName} активен` : 'используется бесплатный доступ'}
          </p>
        </div>
      </div>

      <div className="metric-grid">
        {cards.map(([label, value]) => (
          <article key={label} className="metric-card">
            <span>{label}</span>
            <strong>{formatCurrency(value)}</strong>
            <p>{label === 'Отклонение' ? 'Разница между суммой смет и фактическими затратами' : 'Сводка по вашим сметам'}</p>
          </article>
        ))}
      </div>

      <div className="table-grid">
        <StatusCard title="Объекты" data={summary.projectStatuses} translator={translateProjectStatus} />
        <StatusCard title="Сметы" data={summary.estimateStatuses} translator={translateEstimateStatus} />
      </div>

      <div className="table-grid">
        <article className="page-card">
          <p className="eyebrow">Рабочий сценарий</p>
          <h3>Как теперь идет работа</h3>
          <div className="tag-row">
            <span className="tag">Создать объект</span>
            <span className="tag">Создать смету</span>
            <span className="tag">Добавить позиции</span>
            <span className="tag">Зафиксировать факт</span>
            <span className="tag">Указать где купили</span>
            <span className="tag">Сравнить план и факт</span>
          </div>
        </article>

        <article className="page-card">
          <p className="eyebrow">Premium</p>
          <h3>Дополнительная аналитика</h3>
          <ul className="feature-list compact">
            <li>Отклонения по сметам и объектам</li>
            <li>Управленческая AI-помощь по смете</li>
            <li>Глубокий контроль план / факт</li>
          </ul>
          {!hasPremiumAccess ? (
            <Link className="primary-button" to="/pricing">Открыть premium</Link>
          ) : (
            <p className="success-inline">Премиальные сценарии уже доступны вашей команде.</p>
          )}
        </article>
      </div>
    </section>
  );
}

function StatusCard({ title, data, translator }) {
  return (
    <article className="page-card">
      <h3>{title}</h3>
      {Object.entries(data).map(([status, count]) => (
        <div key={status} className="row-between">
          <span>{translator ? translator(status) : status}</span>
          <strong>{count}</strong>
        </div>
      ))}
    </article>
  );
}
