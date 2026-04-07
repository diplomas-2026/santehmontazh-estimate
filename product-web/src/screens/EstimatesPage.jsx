import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translateEstimateStatus } from '../i18n/enums';

export function EstimatesPage() {
  const [estimates, setEstimates] = useState([]);
  const [purchases, setPurchases] = useState([]);

  function load() {
    api('/api/estimates').then(setEstimates).catch(() => setEstimates([]));
    api('/api/purchases').then(setPurchases).catch(() => setPurchases([]));
  }

  useEffect(() => {
    load();
  }, []);
  const purchasesByEstimateId = new Map(purchases.map((purchase) => [purchase.estimateId, purchase]));

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Вторичный реестр смет</p>
          <h2>Сметы и позиции затрат</h2>
          <p className="muted">
            Сметы создаются внутри объекта. Этот экран нужен, чтобы быстро найти нужный расчет, проверить его состояние и перейти в объект или закупку.
          </p>
        </div>
        <Link className="ghost-button" to="/projects">К объектам</Link>
      </div>

      <div className="stack-list">
        {estimates.map((estimate) => (
          <article key={estimate.id} className="page-card">
            <div className="row-between">
              <div>
                <h3>{estimate.name}</h3>
                <p className="muted">{estimate.projectName} • {translateEstimateStatus(estimate.status)} • {estimate.items.length} поз.</p>
              </div>
              <strong>{formatCurrency(estimate.total)}</strong>
            </div>
            <p>{estimate.notes}</p>
            <div className="tag-row">
              {estimate.items.map((item) => (
                <span key={item.id} className="tag">
                  {item.workName || item.materialName || 'Позиция'} • {item.quantity} {item.unit ?? 'ед.'}
                </span>
              ))}
            </div>
            <div className="action-row">
              <Link className="ghost-button" to={`/projects/${estimate.projectId}`}>К объекту</Link>
              <Link className="ghost-button" to={`/estimates/${estimate.id}`}>Открыть смету</Link>
              {purchasesByEstimateId.has(estimate.id) ? (
                <Link className="primary-button" to={`/purchases/${purchasesByEstimateId.get(estimate.id).id}`}>
                  Открыть закупку
                </Link>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
