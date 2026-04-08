import { Link, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { formatRuDate } from '../i18n/date';
import { translateEstimateStatus, translateProjectStatus } from '../i18n/enums';
import { useAuth } from '../modules/auth/AuthContext';
import { TableShell } from './shared/TableShell';

const emptyEstimate = {
  name: '',
  notes: '',
};

const emptyAiState = {
  message: '',
};

export function ProjectDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [estimateForm, setEstimateForm] = useState(emptyEstimate);
  const [projectError, setProjectError] = useState('');
  const [projectSuccess, setProjectSuccess] = useState('');
  const [aiForm, setAiForm] = useState(emptyAiState);
  const [aiSession, setAiSession] = useState(null);
  const [aiAnswers, setAiAnswers] = useState({});
  const [aiUsage, setAiUsage] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiSuccess, setAiSuccess] = useState('');

  const load = useCallback(() => {
    api(`/api/projects/${id}`).then(setProject).catch(() => setProject(null));
    api(`/api/projects/${id}/estimates`).then(setEstimates).catch(() => setEstimates([]));
    api('/api/ai/usage').then(setAiUsage).catch(() => setAiUsage(null));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const summary = useMemo(() => {
    const planned = estimates.reduce((sum, estimate) => sum + Number(estimate.total ?? 0), 0);
    const actual = estimates.reduce((sum, estimate) => sum + Number(estimate.actualTotal ?? 0), 0);
    return {
      estimates: estimates.length,
      planned,
      actual,
      deviation: actual - planned,
    };
  }, [estimates]);

  const canEditEstimates = ['ADMIN', 'BASE_USER'].includes(user.role);

  async function createEstimate(event) {
    event.preventDefault();
    try {
      const created = await api('/api/estimates', {
        method: 'POST',
        body: JSON.stringify({
          projectId: Number(id),
          name: estimateForm.name,
          notes: estimateForm.notes,
        }),
      });
      setEstimateForm(emptyEstimate);
      setProjectError('');
      setProjectSuccess(`Смета «${created.name}» создана.`);
      load();
    } catch (submissionError) {
      setProjectError(submissionError.message);
      setProjectSuccess('');
    }
  }

  async function completeProject() {
    try {
      const updated = await api(`/api/projects/${id}/complete`, { method: 'POST' });
      setProject(updated);
      setProjectError('');
      setProjectSuccess('Объект завершен.');
    } catch (submissionError) {
      setProjectError(submissionError.message);
      setProjectSuccess('');
    }
  }

  async function startAiAssistant(event) {
    event.preventDefault();
    setAiBusy(true);
    try {
      const response = await api('/api/ai/estimate-assistant/sessions', {
        method: 'POST',
        body: JSON.stringify({ projectId: Number(id), message: aiForm.message }),
      });
      setAiSession(response);
      setAiAnswers({});
      setAiError('');
      setAiSuccess(
        response.status === 'READY'
          ? 'AI-помощник сразу подготовил черновик сметы.'
          : 'AI-помощник задал уточняющие вопросы.',
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

  async function sendAiAnswers(event) {
    event.preventDefault();
    if (!aiSession) return;
    setAiBusy(true);
    try {
      const payload = Object.fromEntries(Object.entries(aiAnswers).filter(([, value]) => value?.trim()));
      const response = await api(`/api/ai/estimate-assistant/sessions/${aiSession.id}/answers`, {
        method: 'POST',
        body: JSON.stringify({ answers: payload }),
      });
      setAiSession(response);
      setAiError('');
      setAiSuccess(response.status === 'READY' ? 'Черновик сметы готов.' : 'Ответы сохранены, AI задал следующие вопросы.');
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
    if (!aiSession) return;
    setAiBusy(true);
    try {
      const created = await api(`/api/ai/estimate-assistant/sessions/${aiSession.id}/apply`, { method: 'POST' });
      setAiSession(null);
      setAiAnswers({});
      setAiForm(emptyAiState);
      setAiError('');
      setAiSuccess('Черновик применен. Смета создана.');
      setProjectSuccess(`AI-помощник создал смету «${created.name}».`);
      load();
      window.dispatchEvent(new Event('ai-usage-updated'));
    } catch (submissionError) {
      setAiError(submissionError.message);
      setAiSuccess('');
    } finally {
      setAiBusy(false);
    }
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
          {projectError ? <div className="error-box" style={{ marginTop: 16 }}>{projectError}</div> : null}
          {projectSuccess ? <div className="success-box" style={{ marginTop: 16 }}>{projectSuccess}</div> : null}
        </article>

        <article className="page-card">
          <p className="eyebrow">Сводка</p>
          <h3>План и факт по объекту</h3>
          <div className="metric-grid compact-grid">
            <div className="metric-card"><span>Сметы</span><strong>{summary.estimates}</strong></div>
            <div className="metric-card"><span>План</span><strong>{formatCurrency(summary.planned)}</strong></div>
            <div className="metric-card"><span>Факт</span><strong>{formatCurrency(summary.actual)}</strong></div>
            <div className="metric-card"><span>Отклонение</span><strong>{formatCurrency(summary.deviation)}</strong></div>
          </div>
          <div className="action-row" style={{ marginTop: 16 }}>
            {project.status !== 'COMPLETED' ? (
              <button type="button" className="primary-button" onClick={completeProject}>Завершить объект</button>
            ) : (
              <span className="tag tag-success">Объект завершен</span>
            )}
          </div>
          <p className="muted">Объект можно завершить, когда все рабочие сметы доведены до конца и больше не требуют изменений.</p>
        </article>
      </div>

      <article className="page-card">
        <p className="eyebrow">Как работать с объектом</p>
        <h3>Обновленный сценарий</h3>
        <div className="tag-row">
          <span className="tag">1. Создать смету</span>
          <span className="tag">2. Добавить позиции</span>
          <span className="tag">3. Заполнить факт по строкам</span>
          <span className="tag">4. Указать где купили</span>
          <span className="tag">5. Сравнить план и факт</span>
        </div>
        <p className="muted">
          Отдельной закупки больше нет. Вся работа ведется в смете: там же находится плановая сумма, фактическая цена и источник покупки по каждой позиции.
        </p>
      </article>

      {canEditEstimates && project.status !== 'COMPLETED' ? (
        <form className="page-card form-grid" onSubmit={createEstimate}>
          <div>
            <p className="eyebrow">Новая смета</p>
            <h3>Создать смету внутри объекта</h3>
            <p className="muted">После создания смета сразу появится в списке ниже.</p>
          </div>
          <label className="form-field">
            <span className="form-label">Название сметы</span>
            <input value={estimateForm.name} onChange={(event) => setEstimateForm((current) => ({ ...current, name: event.target.value }))} required />
          </label>
          <label className="form-field">
            <span className="form-label">Описание</span>
            <textarea rows={3} value={estimateForm.notes} onChange={(event) => setEstimateForm((current) => ({ ...current, notes: event.target.value }))} required />
          </label>
          <button type="submit" className="primary-button">Создать смету</button>
        </form>
      ) : null}

      <article className="page-card ai-assistant-card">
        <div>
          <p className="eyebrow">AI-помощник</p>
          <h3>Сформировать черновик сметы через уточняющие вопросы</h3>
          <p className="muted">
            AI не считает смету из воздуха: он сначала уточняет размеры, точки подключения и состав работ, а потом готовит черновик для подтверждения.
          </p>
        </div>
        {aiUsage ? <p className="muted">Осталось {aiUsage.remainingTokens} токенов из {aiUsage.dailyLimit}.</p> : null}
        {aiError ? <div className="error-box">{aiError}</div> : null}
        {aiSuccess ? <div className="success-box">{aiSuccess}</div> : null}

        {!aiSession ? (
          <form className="form-grid" onSubmit={startAiAssistant}>
            <label className="form-field">
              <span className="form-label">Описание задачи для AI</span>
              <textarea rows={4} value={aiForm.message} onChange={(event) => setAiForm({ message: event.target.value })} placeholder="Например: нужно оснастить кухню, подключить мойку и смеситель" required />
            </label>
            <button type="submit" className="primary-button" disabled={aiBusy}>Запустить AI-помощника</button>
          </form>
        ) : null}

        {aiSession?.status === 'QUESTIONING' ? (
          <form className="form-grid" onSubmit={sendAiAnswers}>
            {aiSession.questions.map((question) => (
              <label key={question.key} className="form-field">
                <span className="form-label">{question.label}</span>
                <input value={aiAnswers[question.key] ?? ''} onChange={(event) => setAiAnswers((current) => ({ ...current, [question.key]: event.target.value }))} placeholder={question.placeholder} />
                <span className="muted">{question.reason}</span>
              </label>
            ))}
            <button type="submit" className="primary-button" disabled={aiBusy}>Отправить ответы</button>
          </form>
        ) : null}

        {aiSession?.status === 'READY' ? (
          <div className="stack-list">
            <div className="success-box">AI подготовил черновик сметы. Проверьте позиции перед созданием.</div>
            {aiSession.draftItems.map((item, index) => (
              <div key={`${item.workName}-${index + 1}`} className="detail-list-item">
                <div>
                  <strong>{item.workName || item.materialName || 'Позиция'}</strong>
                  <p className="muted">{item.quantity} {item.unit} • {formatCurrency(item.unitPrice)}</p>
                  {item.needsAttention ? <p className="muted">Требует уточнения перед работой.</p> : null}
                </div>
              </div>
            ))}
            <div className="action-row">
              <button type="button" className="ghost-button" onClick={() => setAiSession(null)}>Сбросить</button>
              <button type="button" className="primary-button" onClick={applyAiDraft} disabled={aiBusy}>Создать смету из черновика</button>
            </div>
          </div>
        ) : null}
      </article>

      <TableShell
        title="Сметы объекта"
        subtitle="Здесь видны все расчеты по объекту и их фактическое заполнение."
        columns={['Смета', 'Статус', 'План', 'Факт', 'Отклонение', 'Заполнено', 'Действие']}
        rows={estimates.map((estimate) => {
          const done = estimate.items.filter((item) => Number(item.actualLineTotal ?? 0) > 0 || item.purchaseSourceName?.trim()).length;
          return [
            estimate.name,
            translateEstimateStatus(estimate.status),
            formatCurrency(estimate.total),
            formatCurrency(estimate.actualTotal),
            formatCurrency(estimate.deviation),
            `${done} из ${estimate.items.length}`,
            <Link key={`estimate-${estimate.id}`} className="primary-button" to={`/estimates/${estimate.id}`}>Открыть смету</Link>,
          ];
        })}
      />
    </section>
  );
}
