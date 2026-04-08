import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, downloadBinary } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translateEstimateStatus } from '../i18n/enums';
import { useAuth } from '../modules/auth/AuthContext';

const emptyItemForm = {
  materialId: '',
  workName: '',
  quantity: '',
  unitPrice: '',
  comment: '',
};

export function EstimateDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [estimate, setEstimate] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(() => {
    api(`/api/estimates/${id}`).then(setEstimate).catch(() => setEstimate(null));
    api('/api/materials').then(setMaterials).catch(() => setMaterials([]));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const completionProgress = useMemo(() => {
    if (!estimate?.items?.length) {
      return { done: 0, total: 0 };
    }
    const done = estimate.items.filter((item) => Number(item.actualLineTotal ?? 0) > 0 || item.purchaseSourceName?.trim()).length;
    return { done, total: estimate.items.length };
  }, [estimate]);

  const canEdit = ['ADMIN', 'BASE_USER'].includes(user.role) && !['ARCHIVED', 'COMPLETED'].includes(estimate?.status);

  async function addItem(event) {
    event.preventDefault();
    try {
      const updated = await api(`/api/estimates/${id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          materialId: itemForm.materialId ? Number(itemForm.materialId) : null,
          workName: itemForm.workName,
          quantity: Number(itemForm.quantity),
          unitPrice: Number(itemForm.unitPrice),
          comment: itemForm.comment,
        }),
      });
      setEstimate(updated);
      setItemForm(emptyItemForm);
      setError('');
      setSuccess('Позиция сметы добавлена.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function deleteItem(itemId) {
    try {
      await api(`/api/estimate-items/${itemId}`, { method: 'DELETE' });
      setError('');
      setSuccess('Позиция сметы удалена.');
      load();
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function changeEstimateState(action, successMessage) {
    try {
      const updated = await api(`/api/estimates/${id}/${action}`, { method: 'POST' });
      setEstimate(updated);
      setError('');
      setSuccess(successMessage);
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function downloadProjectWorkbook() {
    try {
      await downloadBinary(`/api/estimates/${id}/project-report.xlsx`, `project-${estimate.projectId}-estimates.xlsx`);
      setError('');
      setSuccess('Excel по всем сметам объекта скачан.');
    } catch (downloadError) {
      setError(downloadError.message);
      setSuccess('');
    }
  }

  if (!estimate) {
    return <div className="page-card">Загрузка сметы...</div>;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Смета объекта</p>
          <h2>{estimate.name}</h2>
          <p className="muted">
            {estimate.projectName} • {translateEstimateStatus(estimate.status)} • {estimate.items.length} поз.
          </p>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={downloadProjectWorkbook}>
            Скачать все сметы Excel
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate(`/projects/${estimate.projectId}`)}>
            К объекту
          </button>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="success-box">{success}</div> : null}

      <div className="detail-grid detail-grid-single">
        <article className="page-card">
          <p className="eyebrow">Описание расчета</p>
          <h3>Что заложено в смете</h3>
          <p>{estimate.notes}</p>
          <div className="detail-meta">
            <span className="tag">План: {formatCurrency(estimate.total)}</span>
            <span className="tag">Факт: {formatCurrency(estimate.actualTotal)}</span>
            <span className="tag">Отклонение: {formatCurrency(estimate.deviation)}</span>
            <span className="tag">Автор: {estimate.createdByName}</span>
            <span className="tag">Заполнено по факту: {completionProgress.done} из {completionProgress.total}</span>
          </div>
        </article>

        <article className="page-card">
          <p className="eyebrow">Жизненный цикл</p>
          <h3>Статус сметы и действия</h3>
          <div className="tag-row">
            <span className={`tag${estimate.status === 'DRAFT' ? ' tag-active' : ''}`}>Черновик</span>
            <span className={`tag${estimate.status === 'IN_PROGRESS' ? ' tag-active' : ''}`}>В работе</span>
            <span className={`tag${estimate.status === 'COMPLETED' ? ' tag-active' : ''}`}>Завершена</span>
            <span className={`tag${estimate.status === 'ARCHIVED' ? ' tag-active' : ''}`}>В архиве</span>
          </div>
          <p className="muted">
            Отдельной закупки больше нет: план, фактические цены и место покупки ведутся внутри позиций этой сметы.
          </p>
          <div className="action-row">
            {estimate.status === 'DRAFT' ? (
              <button type="button" className="ghost-button" onClick={() => changeEstimateState('start-work', 'Смета переведена в работу.')}>Начать работу</button>
            ) : null}
            {!['COMPLETED', 'ARCHIVED'].includes(estimate.status) ? (
              <button type="button" className="primary-button" onClick={() => changeEstimateState('complete', 'Смета завершена.')}>Завершить смету</button>
            ) : null}
            {estimate.status !== 'ARCHIVED' ? (
              <button type="button" className="ghost-button" onClick={() => changeEstimateState('archive', 'Смета переведена в архив.')}>Архивировать</button>
            ) : null}
          </div>
        </article>
      </div>

      {canEdit ? (
        <form className="page-card form-grid" onSubmit={addItem}>
          <div>
            <p className="eyebrow">Новая позиция</p>
            <h3>Добавить строку в смету</h3>
            <p className="muted">
              Можно указать материал, название работы или оба поля сразу. Факт и место покупки заполняются уже в карточке позиции.
            </p>
          </div>
          <label className="form-field">
            <span className="form-label">Название работы</span>
            <input value={itemForm.workName} onChange={(event) => setItemForm((current) => ({ ...current, workName: event.target.value }))} placeholder="Например: Монтаж смесителя" />
          </label>
          <label className="form-field">
            <span className="form-label">Материал</span>
            <select value={itemForm.materialId} onChange={(event) => setItemForm((current) => ({ ...current, materialId: event.target.value }))}>
              <option value="">Не выбран</option>
              {materials.map((material) => (
                <option key={material.id} value={material.id}>{material.name} • {formatCurrency(material.defaultPrice)}</option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span className="form-label">Количество</span>
            <input type="number" min="0.01" step="0.01" value={itemForm.quantity} onChange={(event) => setItemForm((current) => ({ ...current, quantity: event.target.value }))} required />
          </label>
          <label className="form-field">
            <span className="form-label">Цена за единицу</span>
            <input type="number" min="0.01" step="0.01" value={itemForm.unitPrice} onChange={(event) => setItemForm((current) => ({ ...current, unitPrice: event.target.value }))} required />
          </label>
          <label className="form-field">
            <span className="form-label">Комментарий</span>
            <textarea rows={2} value={itemForm.comment} onChange={(event) => setItemForm((current) => ({ ...current, comment: event.target.value }))} />
          </label>
          <button type="submit" className="primary-button">Добавить позицию</button>
        </form>
      ) : null}

      <article className="page-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Позиции сметы</p>
            <h3>План, факт и место покупки по каждой строке</h3>
          </div>
          <strong>{formatCurrency(estimate.total)}</strong>
        </div>

        <div className="stack-list" style={{ marginTop: 20 }}>
          {estimate.items.map((item) => (
            <div key={item.id} className="detail-list-item">
              <div>
                <strong>{item.workName || item.materialName || 'Позиция сметы'}</strong>
                <p className="muted">
                  План: {item.quantity} {item.unit ?? 'ед.'} по {formatCurrency(item.unitPrice)} • Факт: {item.actualQuantity} {item.unit ?? 'ед.'} по {formatCurrency(item.actualPrice)}
                </p>
                <p className="muted">
                  Где купили: {item.purchaseSourceName || 'Пока не указано'}
                </p>
              </div>
              <div className="detail-actions">
                <Link className="ghost-button" to={`/estimates/${estimate.id}/items/${item.id}`}>Открыть позицию</Link>
                {canEdit ? (
                  <button type="button" className="ghost-button" onClick={() => deleteItem(item.id)}>Удалить</button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
