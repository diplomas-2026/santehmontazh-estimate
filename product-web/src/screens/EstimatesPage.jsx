import { useEffect, useState } from 'react';
import { api } from '../api';
import { translateEstimateStatus } from '../i18n/enums';
import { useAuth } from '../modules/auth/AuthContext';

const emptyForm = { projectId: '', name: '', notes: '' };

export function EstimatesPage() {
  const { user } = useAuth();
  const [estimates, setEstimates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  function load() {
    api('/api/estimates').then(setEstimates).catch(() => setEstimates([]));
    api('/api/projects').then(setProjects).catch(() => setProjects([]));
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
    await api(`/api/estimates/${id}/submit-for-purchase`, { method: 'POST' });
    load();
  }

  const canEdit = ['ADMIN', 'ESTIMATOR'].includes(user.role);

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Сметный модуль</p>
          <h2>Сметы и позиции затрат</h2>
        </div>
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

      <div className="stack-list">
        {estimates.map((estimate) => (
          <article key={estimate.id} className="page-card">
            <div className="row-between">
              <div>
                <h3>{estimate.name}</h3>
                <p className="muted">{estimate.projectName} • {translateEstimateStatus(estimate.status)} • {estimate.items.length} поз.</p>
              </div>
              <strong>{estimate.total}</strong>
            </div>
            <p>{estimate.notes}</p>
            <div className="tag-row">
              {estimate.items.map((item) => (
                <span key={item.id} className="tag">{item.materialName} • {item.quantity} {item.unit}</span>
              ))}
            </div>
            {canEdit ? (
              <div className="action-row">
                {estimate.status === 'DRAFT' ? (
                  <button type="button" className="primary-button" onClick={() => submitForPurchase(estimate.id)}>В закупку</button>
                ) : null}
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
