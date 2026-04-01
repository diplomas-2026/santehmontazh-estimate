import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../modules/auth/AuthContext';

const baseLinks = [
  { to: '/dashboard', label: 'Дашборд' },
  { to: '/projects', label: 'Объекты' },
  { to: '/materials', label: 'Материалы' },
  { to: '/suppliers', label: 'Поставщики', roles: ['ADMIN', 'PURCHASER', 'MANAGER'] },
  { to: '/estimates', label: 'Сметы' },
  { to: '/purchases', label: 'Закупки' },
  { to: '/reports/deviations', label: 'План / факт', roles: ['ADMIN', 'MANAGER'] },
  { to: '/admin/users', label: 'Пользователи', roles: ['ADMIN'] },
];

export function Layout() {
  const { user, logout } = useAuth();
  const links = baseLinks.filter((link) => !link.roles || link.roles.includes(user.role));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">ООО «САНТЕХМОНТАЖ»</p>
          <h1 className="brand-title">Смета и закупки</h1>
          <p className="muted">{user.fullName}</p>
          <p className="muted">{user.role}</p>
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

        <button type="button" className="ghost-button" onClick={logout}>
          Выйти
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
