import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translateEstimateStatus } from '../i18n/enums';
import { useAuth } from '../modules/auth/AuthContext';

const emptyForm = { projectId: '', name: '', notes: '' };

export function EstimatesPage() {
  const { user } = useAuth();
  const [estimates, setEstimates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState('');

  function load() {
    api('/api/estimates').then(setEstimates).catch(() => setEstimates([]));
    api('/api/projects').then(setProjects).catch(() => setProjects([]));
    api('/api/purchases').then(setPurchases).catch(() => setPurchases([]));
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event) {
    event.preventDefault();
    try {
      await api('/api/estimates', {
        method: 'POST',
        body: JSON.stringify({ ...form, projectId: Number(form.projectId) }),
      });
      setForm(emptyForm);
      setError('');
      load();
    } catch (submissionError) {
      setError(submissionError.message);
    }
  }

  async function submitForPurchase(id) {
    try {
      await api(`/api/purchases/from-estimate/${id}`, { method: 'POST' });
      setPurchaseError('');
      setPurchaseSuccess('Закупка создана по смете.');
      load();
    } catch (submissionError) {
      setPurchaseError(submissionError.message);
      setPurchaseSuccess('');
    }
  }

  const canEdit = ['ADMIN', 'BASE_USER'].includes(user.role);
  const canCreatePurchase = ['ADMIN', 'BASE_USER'].includes(user.role);
  const purchasesByEstimateId = new Map(purchases.map((purchase) => [purchase.estimateId, purchase]));

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Реестр смет</p>
          <h2>Сметы и позиции затрат</h2>
          <p className="muted">
            Сметы создаются внутри объекта. Этот экран нужен, чтобы быстро найти нужный расчет и перейти в карточку объекта.
          </p>
        </div>
        <Link className="ghost-button" to="/projects">К объектам</Link>
      </div>

      {canEdit ? (
        <form className="page-card form-grid" onSubmit={submit}>
          <select value={form.projectId} onChange={(event) => setForm((current) => ({ ...current, projectId: event.target.value }))}>
            <option value="">Выберите объект</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Название сметы" />
          <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Примечание" />
          <button type="submit" className="primary-button">Создать смету</button>
          {error ? <div className="error-box">{error}</div> : null}
        </form>
      ) : null}

      {purchaseError ? <div className="error-box">{purchaseError}</div> : null}
      {purchaseSuccess ? <div className="success-box">{purchaseSuccess}</div> : null}

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
                <span key={item.id} className="tag">{item.materialName} • {item.quantity} {item.unit}</span>
              ))}
            </div>
            {canCreatePurchase ? (
              <div className="action-row">
                <Link className="ghost-button" to={`/estimates/${estimate.id}`}>Открыть смету</Link>
                {purchasesByEstimateId.has(estimate.id) ? (
                  <Link className="primary-button" to={`/purchases/${purchasesByEstimateId.get(estimate.id).id}`}>
                    Открыть закупку
                  </Link>
                ) : null}
                {estimate.status === 'DRAFT' && estimate.items.length > 0 && !purchasesByEstimateId.has(estimate.id) ? (
                  <button type="button" className="primary-button" onClick={() => submitForPurchase(estimate.id)}>Создать закупку</button>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
