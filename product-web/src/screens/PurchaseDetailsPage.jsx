import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translatePurchaseStatus } from '../i18n/enums';

export function PurchaseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);

  useEffect(() => {
    api(`/api/purchases/${id}`).then(setPurchase).catch(() => setPurchase(null));
  }, [id]);

  if (!purchase) {
    return <div className="page-card">Загрузка закупки...</div>;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Закупка объекта</p>
          <h2>{purchase.estimateName}</h2>
          <p className="muted">{purchase.projectName} • {translatePurchaseStatus(purchase.status)}</p>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => navigate(`/projects/${purchase.projectId}`)}>
            К объекту
          </button>
          <Link className="ghost-button" to="/purchases">К списку закупок</Link>
        </div>
      </div>

      <div className="detail-grid">
        <article className="page-card">
          <p className="eyebrow">Основная информация</p>
          <h3>Что закупаем</h3>
          <div className="detail-meta">
            <span className="tag">Поставщик: {purchase.supplierName}</span>
            <span className="tag">План: {formatCurrency(purchase.plannedTotal)}</span>
            <span className="tag">Факт: {formatCurrency(purchase.actualTotal)}</span>
            <span className="tag">Отклонение: {formatCurrency(purchase.deviation)}</span>
          </div>
          <p className="muted">{purchase.comment}</p>
        </article>

        <article className="page-card">
          <p className="eyebrow">Статус закупки</p>
          <h3>Где находится процесс</h3>
          <div className="tag-row">
            <span className="tag">Черновик</span>
            <span className="tag">Согласование</span>
            <span className="tag">Утверждение</span>
            <span className="tag">Заказ</span>
            <span className="tag">Получение</span>
          </div>
          <p className="muted">
            Текущий статус: <strong>{translatePurchaseStatus(purchase.status)}</strong>.
          </p>
        </article>
      </div>

      <article className="page-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Позиции закупки</p>
            <h3>Что входит в заказ</h3>
          </div>
          <strong>{formatCurrency(purchase.plannedTotal)}</strong>
        </div>

        <div className="stack-list">
          {purchase.items.length ? purchase.items.map((item) => (
            <div key={item.id} className="detail-list-item">
              <div>
                <strong>{item.materialName}</strong>
                <p className="muted">
                  План: {item.plannedQuantity} {item.unit} по {formatCurrency(item.plannedPrice)}
                </p>
                <p className="muted">
                  Факт: {item.actualQuantity} {item.unit} по {formatCurrency(item.actualPrice)}
                </p>
                {item.comment ? <p className="muted">{item.comment}</p> : null}
              </div>
              <div className="detail-actions">
                <strong>{formatCurrency(item.plannedLineTotal)}</strong>
                {item.offers.length ? (
                  <span className="tag">
                    {item.offers.find((offer) => offer.selected)?.supplierName ?? 'Есть предложения'}
                  </span>
                ) : (
                  <span className="tag">Предложений пока нет</span>
                )}
              </div>
            </div>
          )) : <p className="muted">В этой закупке пока нет позиций.</p>}
        </div>
      </article>
    </section>
  );
}
