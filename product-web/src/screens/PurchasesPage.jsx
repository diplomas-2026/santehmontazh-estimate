import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translatePurchaseStatus } from '../i18n/enums';

export function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);

  function load() {
    api('/api/purchases').then(setPurchases).catch(() => setPurchases([]));
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Реестр закупок</p>
          <h2>Закупки по вашим объектам</h2>
          <p className="muted">
            Закупка всегда начинается со сметы внутри объекта. Здесь видно, что уже куплено, что еще в работе и где пользователь зафиксировал покупку.
          </p>
        </div>
        <Link className="ghost-button" to="/projects">К объектам</Link>
      </div>

      <div className="stack-list">
        {purchases.map((purchase) => (
          <article key={purchase.id} className="page-card">
            <div className="row-between">
              <div>
                <h3>
                  <Link className="detail-link" to={`/purchases/${purchase.id}`}>
                    {purchase.projectName}
                  </Link>
                </h3>
                <p className="muted">{purchase.estimateName} • {translatePurchaseStatus(purchase.status)}</p>
              </div>
              <div className="metric-inline">
                <span>План: {formatCurrency(purchase.plannedTotal)}</span>
                <span>Факт: {formatCurrency(purchase.actualTotal)}</span>
                <strong>Δ {formatCurrency(purchase.deviation)}</strong>
              </div>
            </div>

            <div className="tag-row">
              {purchase.items.map((item) => (
                <span key={item.id} className="tag">
                  {item.materialName} • {item.plannedQuantity} {item.unit}
                </span>
              ))}
              <span className="tag">
                Где купили: {purchase.supplierName || 'не указано'}
              </span>
            </div>

            <div className="action-row">
              <Link className="ghost-button" to={`/projects/${purchase.projectId}`}>К объекту</Link>
              <Link className="primary-button" to={`/purchases/${purchase.id}`}>Открыть закупку</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
