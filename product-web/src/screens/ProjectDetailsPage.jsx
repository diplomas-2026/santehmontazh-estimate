import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { formatRuDate, formatRuDateTime } from '../i18n/date';
import { translateEstimateStatus, translateProjectStatus, translatePurchaseStatus } from '../i18n/enums';
import { useAuth } from '../modules/auth/AuthContext';

const emptyEstimateForm = { name: '', notes: '' };
const emptyAiState = { message: '' };
const projectLifecycle = [
  ['DRAFT', 'Черновик'],
  ['IN_PROGRESS', 'В работе'],
  ['PURCHASE_IN_PROGRESS', 'Закупка идет'],
  ['COMPLETED', 'Завершен'],
];

export function ProjectDetailsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [estimateForm, setEstimateForm] = useState(emptyEstimateForm);
  const [estimateError, setEstimateError] = useState('');
  const [projectError, setProjectError] = useState('');
  const [projectSuccess, setProjectSuccess] = useState('');
  const [purchaseError, setPurchaseError] = useState('');
  const [purchaseSuccess, setPurchaseSuccess] = useState('');
  const [aiUsage, setAiUsage] = useState(null);
  const [aiForm, setAiForm] = useState(emptyAiState);
  const [aiSession, setAiSession] = useState(null);
  const [aiAnswers, setAiAnswers] = useState({});
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState('');

  const load = useCallback(() => {
    api(`/api/projects/${id}`).then(setProject).catch(() => setProject(null));
    api(`/api/projects/${id}/estimates`).then(setEstimates).catch(() => setEstimates([]));
    api(`/api/projects/${id}/purchases`).then(setPurchases).catch(() => setPurchases([]));
    api('/api/ai/usage').then(setAiUsage).catch(() => setAiUsage(null));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

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

  async function completeProject() {
    try {
      const updated = await api(`/api/projects/${id}/complete`, { method: 'POST' });
      setProject(updated);
      setProjectError('');
      setProjectSuccess('Объект завершен и переведен в архив активной работы.');
      load();
    } catch (submissionError) {
      setProjectError(submissionError.message);
      setProjectSuccess('');
    }
  }

  async function startAiSession(event) {
    event.preventDefault();
    setAiBusy(true);
    try {
      const response = await api('/api/ai/estimate-assistant/sessions', {
        method: 'POST',
        body: JSON.stringify({
          projectId: Number(id),
          message: aiForm.message,
        }),
      });
      setAiSession(response);
      setAiAnswers({});
      setAiError('');
      setAiSuccess('AI-помощник начал разбор задачи. Ответьте на уточнения или сразу примените черновик.');
      setAiUsage(response.usage);
      window.dispatchEvent(new Event('ai-usage-updated'));
    } catch (submissionError) {
      setAiError(submissionError.message);
      setAiSuccess('');
    } finally {
      setAiBusy(false);
    }
  }

  async function continueAiSession(event) {
    event.preventDefault();
    if (!aiSession) {
      return;
    }
    setAiBusy(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(aiAnswers).filter(([, value]) => value && value.trim()),
      );
      const response = await api(`/api/ai/estimate-assistant/sessions/${aiSession.id}/answers`, {
        method: 'POST',
        body: JSON.stringify({ answers: payload }),
      });
      setAiSession(response);
      setAiAnswers({});
      setAiError('');
      setAiSuccess(
        response.status === 'READY'
          ? 'AI-помощник подготовил черновик сметы. Проверьте позиции перед созданием.'
          : 'Ответы приняты. AI уточнил следующие вопросы.',
      );
      setAiUsage(response.usage);
      window.dispatchEvent(new Event('ai-usage-updated'));
    } catch (submissionError) {
      setAiError(submissionError.message);
      setAiSuccess('');
    } finally {
      setAiBusy(false);
    }
  }

  async function applyAiDraft() {
    if (!aiSession) {
      return;
    }
    setAiBusy(true);
    try {
      const created = await api(`/api/ai/estimate-assistant/sessions/${aiSession.id}/apply`, {
        method: 'POST',
      });
      setAiError('');
      setAiSuccess('Черновик применен. Смета создана и появилась в списке объекта.');
      setAiSession(null);
      setAiAnswers({});
      setAiForm(emptyAiState);
      load();
      window.dispatchEvent(new Event('ai-usage-updated'));
      setProjectSuccess(`AI-помощник создал смету «${created.name}».`);
    } catch (submissionError) {
      setAiError(submissionError.message);
      setAiSuccess('');
    } finally {
      setAiBusy(false);
    }
  }

  const canEditEstimates = ['ADMIN', 'BASE_USER'].includes(user.role);
  const canCreatePurchase = ['ADMIN', 'BASE_USER'].includes(user.role);
  const canManagePurchase = ['ADMIN', 'BASE_USER'].includes(user.role);
  const purchasesByEstimateId = useMemo(
    () => new Map(purchases.map((purchase) => [purchase.estimateId, purchase])),
    [purchases],
  );

  function renderDeviationClass(value) {
    const numericValue = Number(value ?? 0);
    if (numericValue > 0) {
      return 'deviation-badge deviation-negative';
    }
    if (numericValue < 0) {
      return 'deviation-badge deviation-positive';
    }
    return 'deviation-badge deviation-neutral';
  }

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

      <div className="detail-grid detail-grid-single">
        <article className="page-card">
          <p className="eyebrow">Описание</p>
          <h3>Что это за объект</h3>
          <p>{project.description}</p>
          <div className="detail-meta">
            <span className="tag">Адрес: {project.address}</span>
            <span className="tag">Старт: {formatRuDate(project.plannedStartDate)}</span>
            <span className="tag">Финиш: {formatRuDate(project.plannedEndDate)}</span>
          </div>
          <div className="tag-row" style={{ marginTop: 16 }}>
            {projectLifecycle.map(([value, label]) => (
              <span key={value} className={`tag${project.status === value ? ' tag-active' : ''}`}>
                {label}
              </span>
            ))}
          </div>
          {projectError ? <div className="error-box" style={{ marginTop: 16 }}>{projectError}</div> : null}
          {projectSuccess ? <div className="success-box" style={{ marginTop: 16 }}>{projectSuccess}</div> : null}
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
          <div className="action-row" style={{ marginTop: 16 }}>
            {project.status !== 'COMPLETED' ? (
              <button type="button" className="primary-button" onClick={completeProject}>
                Завершить объект
              </button>
            ) : (
              <span className="tag tag-success">Объект завершен</span>
            )}
          </div>
          <p className="muted">
            Объект можно завершить, когда все закупки завершены, а все сметы переведены в архив.
          </p>
        </article>
      </div>

      <article className="page-card">
        <p className="eyebrow">Как работать с объектом</p>
        <h3>Основной сценарий</h3>
        <div className="tag-row">
          <span className="tag">1. Подготовить смету</span>
          <span className="tag">2. Заполнить позиции сметы</span>
          <span className="tag">3. Передать в закупку</span>
          <span className="tag">4. Зафиксировать покупку</span>
          <span className="tag">5. Сравнить план и факт</span>
        </div>
        <p className="muted">
          Для каждого объекта все должно происходить здесь: сначала формируется смета, затем на ее основе идет закупка,
          а после этого команда контролирует фактические затраты и отклонения.
        </p>
      </article>

      {canEditEstimates && project.status !== 'COMPLETED' ? (
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

      {canEditEstimates && project.status !== 'COMPLETED' ? (
        <article className="page-card ai-assistant-card">
          <div className="row-between">
            <div>
              <p className="eyebrow">AI-помощник по смете</p>
              <h3>Сначала задаст уточняющие вопросы, потом соберет черновик</h3>
            </div>
            {aiUsage ? (
              <div className="detail-actions">
                <strong>{aiUsage.remainingTokens} токенов</strong>
                <span className="muted">Сброс: {formatRuDateTime(aiUsage.resetAt)}</span>
              </div>
            ) : null}
          </div>
          <p className="muted">
            Опишите задачу своими словами. AI не будет делать точный расчет из воздуха: он сначала спросит, чего не хватает, и только потом соберет черновик сметы.
          </p>

          {!aiSession ? (
            <form className="ai-assistant-flow" onSubmit={startAiSession}>
              <label className="form-field">
                <span className="form-label">Что нужно посчитать</span>
                <textarea
                  rows={4}
                  value={aiForm.message}
                  onChange={(event) => setAiForm({ message: event.target.value })}
                  placeholder="Например: Нужно собрать смету по кухне в квартире, есть мойка, гарнитур, смеситель и монтаж. Размер кухни 3 на 4 метра."
                  required
                />
              </label>
              {aiError ? <div className="error-box">{aiError}</div> : null}
              {aiSuccess ? <div className="success-box">{aiSuccess}</div> : null}
              <div className="action-row">
                <button type="submit" className="primary-button" disabled={aiBusy || !aiUsage?.available}>
                  {aiBusy ? 'AI анализирует...' : 'Начать с AI'}
                </button>
              </div>
              {aiUsage ? <p className="muted">{aiUsage.message}</p> : null}
            </form>
          ) : (
            <div className="ai-assistant-flow">
              <article className="ai-assistant-message">
                <strong>AI-помощник</strong>
                <p>{aiSession.assistantMessage}</p>
              </article>

              {aiSession.status === 'QUESTIONING' ? (
                <form className="ai-assistant-flow" onSubmit={continueAiSession}>
                  {aiSession.questions.map((question) => (
                    <label key={question.key} className="form-field">
                      <span className="form-label">{question.label}</span>
                      <input
                        value={aiAnswers[question.key] ?? ''}
                        onChange={(event) => setAiAnswers((current) => ({ ...current, [question.key]: event.target.value }))}
                        placeholder={question.placeholder || 'Введите ответ'}
                      />
                      {question.reason ? <span className="muted">{question.reason}</span> : null}
                    </label>
                  ))}
                  {aiError ? <div className="error-box">{aiError}</div> : null}
                  {aiSuccess ? <div className="success-box">{aiSuccess}</div> : null}
                  <div className="action-row">
                    <button type="submit" className="primary-button" disabled={aiBusy}>
                      {aiBusy ? 'AI уточняет...' : 'Продолжить'}
                    </button>
                    <button type="button" className="ghost-button" onClick={() => { setAiSession(null); setAiAnswers({}); setAiError(''); setAiSuccess(''); }}>
                      Начать заново
                    </button>
                  </div>
                </form>
              ) : null}

              {aiSession.status === 'READY' ? (
                <div className="ai-assistant-flow">
                  <div className="detail-meta">
                    <span className="tag">Название сметы: {aiSession.estimateName}</span>
                    <span className="tag">Позиции: {aiSession.draftItems.length}</span>
                    <span className="tag">Токены сессии: {aiSession.consumedTokens}</span>
                  </div>
                  <p className="muted">{aiSession.estimateNotes}</p>
                  <div className="table-card">
                    <table>
                      <thead>
                        <tr>
                          <th>Позиция</th>
                          <th>Материал</th>
                          <th>Количество</th>
                          <th>Цена</th>
                          <th>Комментарий</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aiSession.draftItems.map((item, index) => (
                          <tr key={`${item.workName}-${index}`}>
                            <td>{item.workName}</td>
                            <td>{item.materialName || 'Материал не найден в каталоге'}</td>
                            <td>{item.quantity} {item.unit}</td>
                            <td>{formatCurrency(item.unitPrice)}</td>
                            <td>{item.comment || (item.needsAttention ? 'Нужно проверить перед сохранением' : 'Готово к сохранению')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {aiError ? <div className="error-box">{aiError}</div> : null}
                  {aiSuccess ? <div className="success-box">{aiSuccess}</div> : null}
                  <div className="action-row">
                    <button type="button" className="primary-button" onClick={applyAiDraft} disabled={aiBusy}>
                      {aiBusy ? 'Создаем смету...' : 'Создать смету из черновика'}
                    </button>
                    <button type="button" className="ghost-button" onClick={() => { setAiSession(null); setAiAnswers({}); setAiError(''); setAiSuccess(''); }}>
                      Новый AI-черновик
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </article>
      ) : null}

      {purchaseError ? <div className="error-box">{purchaseError}</div> : null}
      {purchaseSuccess ? <div className="success-box">{purchaseSuccess}</div> : null}

      <div className="detail-grid detail-grid-single">
        <article className="page-card">
          <div className="row-between">
            <div>
              <p className="eyebrow">Связанные сметы</p>
              <h3>Расчеты по объекту</h3>
            </div>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>Смета</th>
                  <th>Статус</th>
                  <th>Позиции</th>
                  <th>Сумма</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {estimates.length ? estimates.map((estimate) => (
                  <tr key={estimate.id}>
                    <td>
                      <Link className="detail-link" to={`/estimates/${estimate.id}`}>
                        {estimate.name}
                      </Link>
                    </td>
                    <td>{translateEstimateStatus(estimate.status)}</td>
                    <td>{estimate.items.length}</td>
                    <td>{formatCurrency(estimate.total)}</td>
                    <td>
                      <div className="action-row">
                        <Link className="ghost-button" to={`/estimates/${estimate.id}`}>
                          Открыть смету
                        </Link>
                        {purchasesByEstimateId.has(estimate.id) ? (
                          <Link
                            className="primary-button"
                            to={`/purchases/${purchasesByEstimateId.get(estimate.id).id}`}
                          >
                            Открыть закупку
                          </Link>
                        ) : null}
                        {canCreatePurchase && estimate.status === 'DRAFT' && estimate.items.length > 0 && !purchasesByEstimateId.has(estimate.id) ? (
                          <button type="button" className="primary-button" onClick={() => createPurchase(estimate.id)}>
                            Создать закупку
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td className="empty-row" colSpan={5}>По объекту пока нет смет.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="page-card">
          <p className="eyebrow">Связанные закупки</p>
          <h3>Закупочный контур объекта</h3>
          <p className="muted">
            Здесь важны три сигнала: в каком статусе находится закупка, сколько уже потрачено по факту и по скольким позициям уже зафиксирован источник покупки.
          </p>
          <div className="stack-list purchase-registry">
            {purchases.length ? purchases.map((purchase) => {
              const visibleItems = purchase.items.slice(0, 2);
              const hiddenItemsCount = Math.max(0, purchase.items.length - visibleItems.length);

              return (
                <article key={purchase.id} className="purchase-registry-card">
                  <div className="purchase-registry-main">
                    <div className="purchase-registry-head">
                      <div>
                        <p className="eyebrow">Закупка по смете</p>
                        <h4>
                          <Link className="detail-link" to={`/purchases/${purchase.id}`}>
                            {purchase.estimateName}
                          </Link>
                        </h4>
                      </div>
                      <span className={`status-pill status-pill-${purchase.status.toLowerCase()}`}>
                        {translatePurchaseStatus(purchase.status)}
                      </span>
                    </div>

                    <div className="purchase-finance-grid">
                      <div className="purchase-finance-card">
                        <span>План</span>
                        <strong>{formatCurrency(purchase.plannedTotal)}</strong>
                      </div>
                      <div className="purchase-finance-card">
                        <span>Факт</span>
                        <strong>{formatCurrency(purchase.actualTotal)}</strong>
                      </div>
                      <div className={renderDeviationClass(purchase.deviation)}>
                        <span>Отклонение</span>
                        <strong>{formatCurrency(purchase.deviation)}</strong>
                      </div>
                    </div>

                    <div className="purchase-summary-block">
                      <div className="purchase-meta-line">
                        <strong>Позиции</strong>
                        <span>{purchase.items.length} шт.</span>
                      </div>
                      <div className="tag-row">
                        {visibleItems.map((item) => (
                          <span key={item.id} className="tag">
                            {item.materialName} • {item.plannedQuantity} {item.unit}
                          </span>
                        ))}
                        {hiddenItemsCount > 0 ? (
                          <span className="tag">Еще {hiddenItemsCount}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="purchase-source-line">
                      <span>Источники покупки</span>
                      <strong>
                        {purchase.items.filter((item) => item.supplierName?.trim()).length} из {purchase.items.length} позиций
                      </strong>
                    </div>
                  </div>

                  <div className="purchase-registry-actions">
                    <Link className="ghost-button" to={`/purchases/${purchase.id}`}>
                      Открыть
                    </Link>
                    {canManagePurchase && purchase.status === 'DRAFT' ? (
                      <button type="button" className="ghost-button" onClick={() => changePurchaseStatus(purchase.id, 'start')}>
                        Начать закупку
                      </button>
                    ) : null}
                    {canManagePurchase && purchase.status === 'IN_PROGRESS' ? (
                      <button type="button" className="primary-button" onClick={() => changePurchaseStatus(purchase.id, 'complete')}>
                        Завершить закупку
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            }) : (
              <div className="empty-note">По объекту пока нет закупок.</div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
