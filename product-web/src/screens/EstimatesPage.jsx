import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translateEstimateStatus } from '../i18n/enums';

export function EstimatesPage() {
  const [estimates, setEstimates] = useState([]);

  useEffect(() => {
    api('/api/estimates').then(setEstimates).catch(() => setEstimates([]));
  }, []);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Реестр смет</p>
          <h2>Сметы и фактические затраты</h2>
          <p className="muted">
            Сметы создаются внутри объекта. Этот экран нужен, чтобы быстро найти нужный расчет, проверить его состояние и перейти к позиции, где заполняется факт.
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
              <div className="metric-inline">
                <span>План: {formatCurrency(estimate.total)}</span>
                <span>Факт: {formatCurrency(estimate.actualTotal)}</span>
                <strong>Δ {formatCurrency(estimate.deviation)}</strong>
              </div>
            </div>
            <p>{estimate.notes}</p>
            <div className="tag-row">
              {estimate.items.slice(0, 4).map((item) => (
                <span key={item.id} className="tag">
                  {item.workName || item.materialName || 'Позиция'} • {item.quantity} {item.unit ?? 'ед.'}
                </span>
              ))}
              {estimate.items.length > 4 ? <span className="tag">Еще {estimate.items.length - 4}</span> : null}
            </div>
            <div className="action-row">
              <Link className="ghost-button" to={`/projects/${estimate.projectId}`}>К объекту</Link>
              <Link className="primary-button" to={`/estimates/${estimate.id}`}>Открыть смету</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
