import { Link, NavLink, Outlet } from 'react-router-dom';
import { formatRuDate } from '../i18n/date';
import { translateRole, translateSubscriptionStatus } from '../i18n/enums';
import { useAuth } from '../modules/auth/AuthContext';

const baseLinks = [
  { to: '/dashboard', label: 'Командный центр' },
  { to: '/projects', label: 'Объекты' },
  { to: '/materials', label: 'Материалы' },
  { to: '/suppliers', label: 'Поставщики', roles: ['ADMIN', 'PURCHASER', 'MANAGER'] },
  { to: '/reports/deviations', label: 'План / факт', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/users', label: 'Пользователи', roles: ['ADMIN'] },
];

export function Layout() {
  const { user, logout, subscription } = useAuth();
  const links = baseLinks.filter((link) => !link.roles || link.roles.includes(user.role));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Link to="/" className="brand-lockup">
            <span className="brand-mark">SM</span>
            <div>
              <p className="eyebrow">SantechMontazh Estimate</p>
              <h1 className="brand-title">Смета и закупки</h1>
            </div>
          </Link>

          <div className="user-card">
            <strong>{user.fullName}</strong>
            <span>{translateRole(user.role)}</span>
            <span className={`plan-chip${subscription ? '' : ' muted-chip'}`}>
              {subscription ? `${subscription.tierName} • ${translateSubscriptionStatus(subscription.status)}` : 'Бесплатный доступ'}
            </span>
          </div>
        </div>

        <nav className="nav-list">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="upgrade-panel">
            <p className="eyebrow">Монетизация</p>
            <h3>{subscription ? 'Premium уже включен' : 'Откройте платные сценарии'}</h3>
            <p>
              {subscription
                ? `Активен тариф ${subscription.tierName} до ${formatRuDate(subscription.expiresAt)}.`
                : 'Подключите подписку, чтобы открыть аналитику, paywall-функции и расширенный контроль закупки.'}
            </p>
            <Link className="primary-button" to="/pricing">
              {subscription ? 'Управлять подпиской' : 'Оформить подписку'}
            </Link>
          </div>

          <button type="button" className="ghost-button" onClick={logout}>
            Выйти
          </button>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
