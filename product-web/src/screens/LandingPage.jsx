import { Link } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';

const premiumSignals = [
  ['24%', 'сокращение перерасхода по материалам'],
  ['3 дня', 'в среднем экономим на подготовке закупки'],
  ['1 окно', 'для сметчика, снабжения и руководителя'],
];

const productSteps = [
  {
    title: 'Соберите смету из реальной потребности',
    text: 'Сервис переводит проектные объемы в позиции сметы, чтобы команда сразу видела стоимость и критичные материалы.',
  },
  {
    title: 'Переведите смету в закупку без ручной пересборки',
    text: 'Потребность по объекту автоматически готова к закупке и сравнению поставщиков.',
  },
  {
    title: 'Контролируйте отклонения до того, как они съедят маржу',
    text: 'План / факт, версии смет, история действий и управленческая аналитика доступны в одном интерфейсе.',
  },
];

const paidFeatures = [
  'План / факт по закупкам с подсветкой перерасхода',
  'Сравнение поставщиков и выбор лучшего предложения',
  'Расширенная аналитика по объектам и ролям',
  'Приоритетная поддержка и премиальные сценарии согласования',
];

export function LandingPage() {
  const { user, plans, subscription } = useAuth();
  const featuredPlan = plans.find((plan) => plan.highlight) ?? plans[1];

  return (
    <div className="marketing-shell">
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">Смета. Закупка. Контроль маржи.</p>
          <h1>Платформа, которая превращает потребность объекта в управляемую смету и закупку.</h1>
          <p className="hero-text">
            «СантехМонтаж Estimate» помогает строительным и инженерным подрядчикам быстрее считать сметы,
            видеть дефицит материалов, контролировать отклонения и продавить закупку до результата без Excel-хаоса.
          </p>

          <div className="hero-actions">
            <Link className="primary-button hero-button" to={user ? '/dashboard' : '/register'}>
              {user ? 'Открыть кабинет' : 'Попробовать бесплатно'}
            </Link>
            <Link className="ghost-button hero-button" to="/pricing">
              Посмотреть тарифы
            </Link>
          </div>

          <div className="signal-grid">
            {premiumSignals.map(([value, label]) => (
              <article key={label} className="signal-card">
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>
        </div>

        <aside className="hero-panel">
          <div className="hero-panel-glow" />
          <p className="hero-panel-label">Почему продукт хочется попробовать сразу</p>
          <div className="hero-price-card">
            <span className="eyebrow">Тариф дня</span>
            <h2>{featuredPlan.name}</h2>
            <p>{featuredPlan.description}</p>
            <div className="price-stack">
              <strong>{featuredPlan.periods[0].price}</strong>
              <span>{featuredPlan.periods[0].label}</span>
            </div>
            <ul className="feature-list">
              {featuredPlan.features.slice(0, 4).map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Link className="primary-button" to={`/checkout?plan=${featuredPlan.id}&period=${featuredPlan.periods[0].id}`}>
              Оформить подписку
            </Link>
          </div>

          <div className="status-card premium">
            <span>Текущий статус</span>
            <strong>{subscription ? `Подписка ${subscription.tierName}` : 'Premium еще не активирован'}</strong>
            <p>
              {subscription
                ? `Доступ активен до ${new Date(subscription.expiresAt).toLocaleDateString('ru-RU')}.`
                : 'Подключите платный режим и откройте аналитику, сравнение поставщиков и управленческие отчеты.'}
            </p>
          </div>
        </aside>
      </section>

      <section className="marketing-section">
        <div className="section-heading">
          <p className="eyebrow">Как это работает</p>
          <h2>Продукт выстраивает путь от потребности объекта до закупки без потери контекста.</h2>
        </div>

        <div className="step-grid">
          {productSteps.map((step, index) => (
            <article key={step.title} className="story-card">
              <span className="story-index">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section split">
        <div className="section-heading">
          <p className="eyebrow">Premium продает себя сам</p>
          <h2>Часть функций сознательно вынесена в платный доступ, чтобы монетизация ощущалась естественно.</h2>
          <p className="muted">
            Бесплатный сценарий дает возможность зайти в продукт, а платные модули показывают реальную ценность:
            меньше перерасхода, выше прозрачность и быстрее цикл закупки.
          </p>
        </div>

        <div className="premium-grid">
          {paidFeatures.map((feature) => (
            <article key={feature} className="premium-tile">
              <span className="premium-badge">Premium</span>
              <h3>{feature}</h3>
              <p>Эта возможность продается на лендинге, в кабинете и прямо внутри рабочих разделов.</p>
            </article>
          ))}
        </div>
      </section>

      <section className="marketing-section cta">
        <div>
          <p className="eyebrow">Готово к демо</p>
          <h2>Запустите тестовый сценарий сегодня и покажите команде, как должна выглядеть современная смета.</h2>
        </div>
        <div className="hero-actions">
          <Link className="primary-button hero-button" to="/pricing">
            Выбрать подписку
          </Link>
          <Link className="ghost-button hero-button" to={user ? '/dashboard' : '/login'}>
            {user ? 'Перейти в кабинет' : 'У меня уже есть аккаунт'}
          </Link>
        </div>
      </section>
    </div>
  );
}

