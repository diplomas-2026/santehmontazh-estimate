import { useEffect, useState } from 'react';
import { api } from '../api';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../i18n/currency';
import { translateEstimateStatus, translateProjectStatus, translatePurchaseStatus, translateRole } from '../i18n/enums';
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
    ['План по активным сметам', summary.activeEstimateTotal],
    ['План по закупкам', summary.activePurchasePlannedTotal],
    ['Факт по закупкам', summary.completedPurchaseActualTotal],
    ['Отклонение', summary.totalDeviation],
  ];

  const premiumInsights = [
    'Рейтинг объектов по маржинальности',
    'Прогноз роста закупочного бюджета',
    'Подсказки по материалам с риском перерасхода',
  ];

  return (
    <section className="page-section">
      <div className="dashboard-hero">
        <div className="dashboard-hero-copy">
          <p className="eyebrow">Главный экран продукта</p>
          <h2>Командный центр для сметчика, снабжения и руководителя объекта.</h2>
          <p className="muted">
            Здесь видно, где теряются деньги, какие закупки тормозят объект и какие premium-модули уже помогают команде быстрее принимать решения.
          </p>
          <div className="hero-actions">
            <Link className="primary-button hero-button" to="/estimates">Открыть сметы</Link>
            <Link className="ghost-button hero-button" to="/pricing">
              {subscription ? 'Усилить тариф' : 'Включить premium'}
            </Link>
          </div>
        </div>

        <div className="status-card premium">
          <span>Аккаунт</span>
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
            <p>{label === 'Отклонение' ? 'Показывает эффект решений закупки' : 'Данные обновляются из боевого контура'}</p>
          </article>
        ))}
      </div>

      <div className="table-grid">
        <StatusCard title="Объекты" data={summary.projectStatuses} translator={translateProjectStatus} />
        <StatusCard title="Сметы" data={summary.estimateStatuses} translator={translateEstimateStatus} />
        <StatusCard title="Закупки" data={summary.purchaseStatuses} translator={translatePurchaseStatus} />
      </div>

      <div className="table-grid">
        <article className="page-card">
          <p className="eyebrow">Сценарии продукта</p>
          <h3>Что уже можно сделать в системе</h3>
          <div className="tag-row">
            <span className="tag">Создать смету и позиции</span>
            <span className="tag">Сформировать закупку</span>
            <span className="tag">Передать на согласование</span>
            <span className="tag">Сравнить план и факт</span>
          </div>
        </article>

        <article className="page-card">
          <p className="eyebrow">Монетизация внутри продукта</p>
          <h3>Premium-функции, которые хочется купить</h3>
          <ul className="feature-list compact">
            {premiumInsights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {!hasPremiumAccess ? (
            <Link className="primary-button" to="/pricing">Открыть premium</Link>
          ) : (
            <p className="success-inline">Премиальные сценарии уже доступны вашей команде.</p>
          )}
        </article>
      </div>

      <article className="page-card">
        <p className="eyebrow">Как пользоваться системой</p>
        <h3>Рабочий сценарий от первого объекта до контроля закупки</h3>
        <div className="tag-row">
          <span className="tag">1. Создайте объект</span>
          <span className="tag">2. Сформируйте смету</span>
          <span className="tag">3. Передайте смету в закупку</span>
          <span className="tag">4. Согласуйте закупку</span>
          <span className="tag">5. Смотрите план / факт</span>
        </div>
        <p className="muted">
          Сервис нужен для того, чтобы связать расчет сметы и реальную закупку материалов в один процесс.
          Пользователь видит, что нужно купить, сколько это стоит и где начинается перерасход по объекту.
        </p>
      </article>
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
