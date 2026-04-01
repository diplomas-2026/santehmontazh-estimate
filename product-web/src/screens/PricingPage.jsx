import { Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';

export function PricingPage() {
  const { plans, subscription } = useAuth();

  return (
    <div className="marketing-shell">
      <section className="pricing-hero">
        <div className="section-heading">
          <p className="eyebrow">Тарифы</p>
          <h1>Выберите формат доступа под ваш объект, команду и масштаб закупок.</h1>
          <p className="muted">
            Подписка оформляется на нужный период, активируется сразу после тестовой оплаты и открывает платные функции прямо в продукте.
          </p>
        </div>

        {subscription ? (
          <div className="status-card success">
            <span>Подписка уже активна</span>
            <strong>{subscription.tierName}</strong>
            <p>Действует до {new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}.</p>
          </div>
        ) : (
          <div className="status-card premium">
            <span>Без подписки</span>
            <strong>Premium-функции закрыты</strong>
            <p>Подключите платный тариф, чтобы открыть аналитику и монетизируемые сценарии продукта.</p>
          </div>
        )}
      </section>

      <section className="pricing-grid">
        {plans.map((plan) => (
          <article key={plan.id} className={`pricing-card${plan.highlight ? ' highlight' : ''}`}>
            <div className="pricing-card-head">
              <div>
                <span className="eyebrow">{plan.accent}</span>
                <h2>{plan.name}</h2>
                <p>{plan.label}</p>
              </div>
              {plan.highlight ? <span className="plan-chip">Рекомендуем</span> : null}
            </div>

            <p className="pricing-description">{plan.description}</p>

            <ul className="feature-list">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>

            <div className="period-grid">
              {plan.periods.map((period) => (
                <div key={period.id} className="period-card">
                  <span>{period.label}</span>
                  <strong>{period.price}</strong>
                  <Link className="primary-button" to={`/checkout?plan=${plan.id}&period=${period.id}`}>
                    Оформить
                  </Link>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

