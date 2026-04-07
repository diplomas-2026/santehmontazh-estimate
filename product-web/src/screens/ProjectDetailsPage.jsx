import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { formatRuDate } from '../i18n/date';
import { translateEstimateStatus, translateProjectStatus, translatePurchaseStatus } from '../i18n/enums';
import { useAuth } from '../modules/auth/AuthContext';

const emptyEstimateForm = { name: '', notes: '' };

export function ProjectDetailsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [estimateForm, setEstimateForm] = useState(emptyEstimateForm);
  const [estimateError, setEstimateError] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState('');

  function load() {
    api(`/api/projects/${id}`).then(setProject).catch(() => setProject(null));
    api('/api/estimates')
      .then((items) => setEstimates(items.filter((item) => String(item.projectId) === String(id))))
      .catch(() => setEstimates([]));
    api('/api/purchases')
      .then((items) => setPurchases(items.filter((item) => String(item.projectId) === String(id))))
      .catch(() => setPurchases([]));
  }

  useEffect(() => {
    load();
  }, [id]);

  const summary = useMemo(() => {
    return {
      estimates: estimates.length,
      purchases: purchases.length,
      planned: purchases.reduce((sum, item) => sum + Number(item.plannedTotal ?? 0), 0),
      actual: purchases.reduce((sum, item) => sum + Number(item.actualTotal ?? 0), 0),
    };
  }, [estimates, purchases]);

  async function createEstimate(event) {
    event.preventDefault();
    try {
      await api('/api/estimates', {
        method: 'POST',
        body: JSON.stringify({
          projectId: Number(id),
          name: estimateForm.name,
          notes: estimateForm.notes,
        }),
      });
      setEstimateForm(emptyEstimateForm);
      setEstimateError('');
      load();
    } catch (submissionError) {
      setEstimateError(submissionError.message);
    }
  }

  async function createPurchase(estimateId) {
    try {
      await api(`/api/purchases/from-estimate/${estimateId}`, { method: 'POST' });
      setPurchaseError('');
      setPurchaseSuccess('Закупка создана по выбранной смете.');
      load();
    } catch (submissionError) {
      setPurchaseError(submissionError.message);
      setPurchaseSuccess('');
    }
  }

  async function changePurchaseStatus(purchaseId, action, body) {
    try {
      await api(`/api/purchases/${purchaseId}/${action}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
      });
      setPurchaseError('');
      setPurchaseSuccess('Статус закупки обновлен.');
      load();
    } catch (submissionError) {
      setPurchaseError(submissionError.message);
      setPurchaseSuccess('');
    }
  }

  const canEditEstimates = ['ADMIN', 'BASE_USER'].includes(user.role);
  const canCreatePurchase = ['ADMIN', 'BASE_USER'].includes(user.role);
  const canManagePurchase = ['ADMIN', 'BASE_USER'].includes(user.role);
  const canApprovePurchase = ['ADMIN', 'BASE_USER'].includes(user.role);
  const purchasesByEstimateId = useMemo(
    () => new Map(purchases.map((purchase) => [purchase.estimateId, purchase])),
    [purchases],
  );

  if (!project) {
    return <div className="page-card">Загрузка данных по объекту...</div>;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Карточка объекта</p>
          <h2>{project.name}</h2>
          <p className="muted">
            {project.code} • {translateProjectStatus(project.status)}
          </p>
        </div>
        <Link className="ghost-button" to="/projects">К списку объектов</Link>
      </div>

      <div className="detail-grid">
        <article className="page-card">
          <p className="eyebrow">Описание</p>
          <h3>Что это за объект</h3>
          <p>{project.description}</p>
          <div className="detail-meta">
            <span className="tag">Адрес: {project.address}</span>
            <span className="tag">Старт: {formatRuDate(project.plannedStartDate)}</span>
            <span className="tag">Финиш: {formatRuDate(project.plannedEndDate)}</span>
          </div>
        </article>

        <article className="page-card">
          <p className="eyebrow">Сводка</p>
          <h3>Что происходит по объекту</h3>
          <div className="metric-grid compact-grid">
            <div className="metric-card">
              <span>Сметы</span>
              <strong>{summary.estimates}</strong>
            </div>
            <div className="metric-card">
              <span>Закупки</span>
              <strong>{summary.purchases}</strong>
            </div>
            <div className="metric-card">
              <span>План</span>
              <strong>{formatCurrency(summary.planned)}</strong>
            </div>
            <div className="metric-card">
              <span>Факт</span>
              <strong>{formatCurrency(summary.actual)}</strong>
            </div>
          </div>
        </article>
      </div>

      <article className="page-card">
        <p className="eyebrow">Как работать с объектом</p>
        <h3>Основной сценарий</h3>
        <div className="tag-row">
          <span className="tag">1. Подготовить смету</span>
          <span className="tag">2. Заполнить позиции сметы</span>
          <span className="tag">3. Передать в закупку</span>
          <span className="tag">4. Согласовать закупку</span>
          <span className="tag">5. Сравнить план и факт</span>
        </div>
        <p className="muted">
          Для каждого объекта все должно происходить здесь: сначала формируется смета, затем на ее основе идет закупка,
          а после этого команда контролирует фактические затраты и отклонения.
        </p>
      </article>

      {canEditEstimates ? (
        <form className="page-card form-grid" onSubmit={createEstimate}>
          <div>
            <p className="eyebrow">Новая смета</p>
            <h3>Создать смету прямо внутри объекта</h3>
            <p className="muted">
              Смета автоматически будет привязана к объекту {project.name}. После создания она появится в списке ниже.
            </p>
          </div>
          <input
            value={estimateForm.name}
            onChange={(event) => setEstimateForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Например: Смета по внутренним сетям"
          />
          <input
            value={estimateForm.notes}
            onChange={(event) => setEstimateForm((current) => ({ ...current, notes: event.target.value }))}
            placeholder="Примечание к расчету"
          />
          {estimateError ? <div className="error-box">{estimateError}</div> : null}
          <button type="submit" className="primary-button">Создать смету</button>
        </form>
      ) : null}

      {purchaseError ? <div className="error-box">{purchaseError}</div> : null}
      {purchaseSuccess ? <div className="success-box">{purchaseSuccess}</div> : null}

      <div className="detail-grid">
        <article className="page-card">
          <div className="row-between">
            <div>
              <p className="eyebrow">Связанные сметы</p>
              <h3>Расчеты по объекту</h3>
            </div>
          </div>

          <div className="stack-list">
            {estimates.length ? estimates.map((estimate) => (
              <div key={estimate.id} className="detail-list-item">
                <div>
                  <strong>{estimate.name}</strong>
                  <p className="muted">{translateEstimateStatus(estimate.status)} • {estimate.items.length} поз.</p>
                </div>
                <div className="detail-actions">
                  <strong>{formatCurrency(estimate.total)}</strong>
                  <Link className="ghost-button" to={`/estimates/${estimate.id}`}>
                    Открыть смету
                  </Link>
                  {purchasesByEstimateId.has(estimate.id) ? (
                    <button type="button" className="ghost-button" onClick={() => navigate('/purchases')}>
                      Закупка создана
                    </button>
                  ) : null}
                  {canCreatePurchase ? (
                    <div className="action-row">
                      {estimate.status === 'DRAFT' && estimate.items.length > 0 ? (
                        <button type="button" className="primary-button" onClick={() => createPurchase(estimate.id)}>
                          Создать закупку
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            )) : <p className="muted">По объекту пока нет смет.</p>}
          </div>
        </article>

        <article className="page-card">
          <p className="eyebrow">Связанные закупки</p>
          <h3>Закупочный контур объекта</h3>

          <div className="stack-list">
            {purchases.length ? purchases.map((purchase) => (
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
                      {item.materialName} • {item.plannedQuantity} {item.unit} • {item.offers.find((offer) => offer.selected)?.supplierName ?? 'без выбора'}
                    </span>
                  ))}
                </div>

                <div className="action-row">
                  {canManagePurchase && purchase.status === 'DRAFT' ? (
                    <button type="button" className="ghost-button" onClick={() => changePurchaseStatus(purchase.id, 'submit')}>
                      На согласование
                    </button>
                  ) : null}
                  {canApprovePurchase && purchase.status === 'SUBMITTED' ? (
                    <>
                      <button type="button" className="primary-button" onClick={() => changePurchaseStatus(purchase.id, 'approve')}>
                        Утвердить
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => changePurchaseStatus(purchase.id, 'return-for-revision', { message: 'Нужно скорректировать выбор поставщика' })}
                      >
                        Вернуть
                      </button>
                    </>
                  ) : null}
                </div>
              </article>
            )) : <p className="muted">По объекту пока нет закупок.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}
