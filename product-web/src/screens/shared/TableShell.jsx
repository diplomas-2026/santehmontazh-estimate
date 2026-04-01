import { Link } from 'react-router-dom';
import { useAuth } from '../../modules/auth/AuthContext';

export function TableShell({ title, subtitle, columns, rows, premium = false, premiumMessage }) {
  const { hasPremiumAccess } = useAuth();
  const showPremiumBanner = premium && !hasPremiumAccess;

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Рабочий раздел</p>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
      </div>

      {showPremiumBanner ? (
        <article className="page-card premium-banner">
          <div>
            <p className="eyebrow">Premium</p>
            <h3>Часть возможностей в этом разделе доступна только по подписке.</h3>
            <p>{premiumMessage ?? 'Подключите платный тариф, чтобы открыть аналитику и расширенные управленческие сценарии.'}</p>
          </div>
          <Link className="primary-button" to="/pricing">Оформить подписку</Link>
        </article>
      ) : null}

      <div className="page-card table-card">
        <table>
          <thead>
            <tr>
              {columns.map((column) => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={`${title}-${index + 1}`}>
                {row.map((cell, cellIndex) => <td key={`${title}-${index + 1}-${cellIndex + 1}`}>{cell}</td>)}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="empty-row">Пока нет данных для отображения.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
