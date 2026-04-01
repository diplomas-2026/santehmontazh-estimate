import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';
import { getPeriodById, getPlanById } from '../modules/subscription/plans';

const initialForm = {
  companyName: '',
  email: '',
  cardHolder: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
};

export function CheckoutPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, activateSubscription } = useAuth();
  const plan = useMemo(() => getPlanById(params.get('plan')), [params]);
  const period = useMemo(() => getPeriodById(plan, params.get('period')), [plan, params]);
  const [form, setForm] = useState({
    ...initialForm,
    email: user?.email ?? '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setError('');

    if (!form.email.trim() || !form.companyName.trim() || !form.cardHolder.trim()) {
      setError('Заполните email, компанию и имя владельца карты.');
      return;
    }

    if (form.cardNumber.replace(/\s/g, '').length < 16 || form.expiry.trim().length < 4 || form.cvc.trim().length < 3) {
      setError('Проверьте номер карты, срок действия и CVC.');
      return;
    }

    const subscription = activateSubscription({
      email: form.email,
      tierId: plan.id,
      periodId: period.id,
      companyName: form.companyName,
      cardHolder: form.cardHolder,
    });

    setSuccess(`Подписка ${subscription.tierName} успешно активирована.`);

    window.setTimeout(() => {
      navigate(user ? '/dashboard' : '/register');
    }, 900);
  }

  return (
    <div className="marketing-shell">
      <section className="checkout-layout">
        <div className="checkout-summary">
          <p className="eyebrow">Checkout</p>
          <h1>Оформление тестовой подписки</h1>
          <p className="hero-text">
            Платежный шлюз не подключен, поэтому после заполнения формы подписка активируется сразу.
            Это позволяет показать продукт как коммерческий сервис уже на демо-версии.
          </p>

          <div className="checkout-plan-card">
            <span className="plan-chip">{plan.name}</span>
            <strong>{period.price}</strong>
            <p>{period.label}</p>
            <ul className="feature-list compact">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
          </div>

          <Link className="ghost-button hero-button" to="/pricing">
            Вернуться к тарифам
          </Link>
        </div>

        <form className="checkout-form" onSubmit={submit}>
          <div className="checkout-grid">
            <label>
              Компания
              <input
                value={form.companyName}
                onChange={(event) => updateField('companyName', event.target.value)}
                placeholder="ООО «САНТЕХМОНТАЖ»"
              />
            </label>
            <label>
              Email для подписки
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="team@santehmontazh.ru"
              />
            </label>
            <label>
              Владелец карты
              <input
                value={form.cardHolder}
                onChange={(event) => updateField('cardHolder', event.target.value)}
                placeholder="IVAN PETROV"
              />
            </label>
            <label>
              Номер карты
              <input
                value={form.cardNumber}
                onChange={(event) => updateField('cardNumber', event.target.value)}
                placeholder="4111 1111 1111 1111"
              />
            </label>
            <label>
              Срок действия
              <input
                value={form.expiry}
                onChange={(event) => updateField('expiry', event.target.value)}
                placeholder="12/28"
              />
            </label>
            <label>
              CVC
              <input
                value={form.cvc}
                onChange={(event) => updateField('cvc', event.target.value)}
                placeholder="123"
              />
            </label>
          </div>

          {error ? <div className="error-box">{error}</div> : null}
          {success ? <div className="success-box">{success}</div> : null}

          <button type="submit" className="primary-button checkout-button">
            Активировать подписку за {period.price}
          </button>
        </form>
      </section>
    </div>
  );
}

