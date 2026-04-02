import { useEffect, useState } from 'react';
import { api } from '../api';
import { translateEstimateStatus, translatePurchaseStatus } from '../i18n/enums';
import { useAuth } from '../modules/auth/AuthContext';

const emptyForm = { estimateId: '', supplierName: '', comment: '' };

export function PurchasesPage() {
  const { user } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [form, setForm] = useState(emptyForm);

  function load() {
    api('/api/purchases').then(setPurchases).catch(() => setPurchases([]));
    api('/api/estimates').then((items) => setEstimates(items.filter((item) => item.status === 'READY_FOR_PURCHASE'))).catch(() => setEstimates([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    await api('/api/purchases', {
      method: 'POST',
      body: JSON.stringify({ ...form, estimateId: Number(form.estimateId) }),
    });
    setForm(emptyForm);
    load();
  }

  async function changeStatus(id, action, body) {
    await api(`/api/purchases/${id}/${action}`, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
    load();
  }

  const canCreate = ['ADMIN', 'PURCHASER'].includes(user.role);
  const canApprove = ['ADMIN', 'MANAGER'].includes(user.role);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Закупочный модуль</p>
          <h2>Закупки и предложения поставщиков</h2>
        </div>
      </div>

      {canCreate ? (
        <form className="page-card form-grid" onSubmit={submit}>
          <select value={form.estimateId} onChange={(event) => setForm((current) => ({ ...current, estimateId: event.target.value }))}>
            <option value="">Готовая смета</option>
            {estimates.map((estimate) => (
              <option key={estimate.id} value={estimate.id}>{estimate.name} • {translateEstimateStatus(estimate.status)}</option>
            ))}
          </select>
          <input value={form.supplierName} onChange={(event) => setForm((current) => ({ ...current, supplierName: event.target.value }))} placeholder="Базовый поставщик" />
          <input value={form.comment} onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))} placeholder="Комментарий" />
          <button type="submit" className="primary-button">Создать закупку</button>
        </form>
      ) : null}

      <div className="stack-list">
        {purchases.map((purchase) => (
          <article key={purchase.id} className="page-card">
            <div className="row-between">
              <div>
                <h3>{purchase.projectName}</h3>
                <p className="muted">{purchase.estimateName} • {translatePurchaseStatus(purchase.status)}</p>
              </div>
              <div className="metric-inline">
                <span>План: {purchase.plannedTotal}</span>
                <span>Факт: {purchase.actualTotal}</span>
                <strong>Δ {purchase.deviation}</strong>
              </div>
            </div>

            <div className="tag-row">
              {purchase.items.map((item) => (
                <span key={item.id} className="tag">
                  {item.materialName} • {item.plannedQuantity} {item.unit} • {item.offers.find((offer) => offer.selected)?.supplierName ?? 'без выбора'}
                </span>
              ))}
            </div>

            <div className="action-row">
              {canCreate && purchase.status === 'DRAFT' ? (
                <button type="button" className="ghost-button" onClick={() => changeStatus(purchase.id, 'submit')}>
                  На согласование
                </button>
              ) : null}
              {canApprove && purchase.status === 'SUBMITTED' ? (
                <>
                  <button type="button" className="primary-button" onClick={() => changeStatus(purchase.id, 'approve')}>
                    Утвердить
                  </button>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => changeStatus(purchase.id, 'return-for-revision', { message: 'Нужно скорректировать выбор поставщика' })}
                  >
                    Вернуть
                  </button>
                </>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
