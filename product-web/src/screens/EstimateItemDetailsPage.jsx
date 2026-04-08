import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translateEstimateStatus } from '../i18n/enums';

const emptyDraft = {
  quantity: '',
  unitPrice: '',
  comment: '',
  actualQuantity: '',
  actualPrice: '',
  purchaseSourceName: '',
  purchaseSourceUrl: '',
  purchaseNote: '',
};

function buildDraft(item) {
  return {
    quantity: String(item?.quantity ?? ''),
    unitPrice: String(item?.unitPrice ?? ''),
    comment: item?.comment ?? '',
    actualQuantity: String(item?.actualQuantity ?? ''),
    actualPrice: String(item?.actualPrice ?? ''),
    purchaseSourceName: item?.purchaseSourceName ?? '',
    purchaseSourceUrl: item?.purchaseSourceUrl ?? '',
    purchaseNote: item?.purchaseNote ?? '',
  };
}

export function EstimateItemDetailsPage() {
  const { id, itemId } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [materialDetail, setMaterialDetail] = useState(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const response = await api(`/api/estimates/${id}`);
        if (!active) return;
        setEstimate(response);
        setError('');
      } catch {
        if (active) {
          setEstimate(null);
          setError('Не удалось загрузить позицию сметы.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [id]);

  const item = useMemo(
    () => estimate?.items?.find((entry) => String(entry.id) === String(itemId)) ?? null,
    [estimate, itemId],
  );

  useEffect(() => {
    if (item) {
      setDraft(buildDraft(item));
    }
  }, [item]);

  useEffect(() => {
    let active = true;
    async function loadMaterialDetail() {
      if (!item?.materialId) {
        setMaterialDetail(null);
        return;
      }
      try {
        const response = await api(`/api/materials/${item.materialId}`);
        if (active) {
          setMaterialDetail(response);
        }
      } catch {
        if (active) {
          setMaterialDetail(null);
        }
      }
    }
    loadMaterialDetail();
    return () => {
      active = false;
    };
  }, [item?.materialId]);

  async function reload(message) {
    const response = await api(`/api/estimates/${id}`);
    setEstimate(response);
    const refreshed = response.items?.find((entry) => String(entry.id) === String(itemId));
    if (refreshed) {
      setDraft(buildDraft(refreshed));
    }
    setSuccess(message);
    setError('');
  }

  async function saveItem(event) {
    event.preventDefault();
    try {
      await api(`/api/estimate-items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({
          materialId: item.materialId,
          workName: item.workName,
          quantity: Number(draft.quantity),
          unitPrice: Number(draft.unitPrice),
          comment: draft.comment,
          actualQuantity: Number(draft.actualQuantity || 0),
          actualPrice: Number(draft.actualPrice || 0),
          purchaseSourceName: draft.purchaseSourceName,
          purchaseSourceUrl: draft.purchaseSourceUrl,
          purchaseNote: draft.purchaseNote,
        }),
      });
      await reload('Позиция сметы обновлена.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  if (loading) {
    return <div className="page-card">Загрузка позиции сметы...</div>;
  }

  if (!estimate || !item) {
    return <div className="page-card">Позиция сметы не найдена.</div>;
  }

  const canEdit = !['ARCHIVED', 'COMPLETED'].includes(estimate.status);
  const deviation = Number(item.actualLineTotal ?? 0) - Number(item.lineTotal ?? 0);

  return (
    <section className="page-section purchase-workbench">
      <div className="page-header">
        <div>
          <p className="eyebrow">Позиция сметы</p>
          <h2>{item.workName || item.materialName || 'Позиция сметы'}</h2>
          <p className="muted">
            {estimate.name} • {translateEstimateStatus(estimate.status)}
          </p>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => navigate(`/estimates/${id}`)}>
            К смете
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
          <p className="eyebrow">План и факт</p>
          <h3>Сводка по строке сметы</h3>
          <div className="detail-meta">
            <span className="tag">Единица: {item.unit ?? 'ед.'}</span>
            <span className="tag">План: {item.quantity} {item.unit ?? 'ед.'} по {formatCurrency(item.unitPrice)}</span>
            <span className="tag">Факт: {item.actualQuantity} {item.unit ?? 'ед.'} по {formatCurrency(item.actualPrice)}</span>
            <span className="tag">Плановая сумма: {formatCurrency(item.lineTotal)}</span>
            <span className="tag">Фактическая сумма: {formatCurrency(item.actualLineTotal)}</span>
            <span className={`tag ${deviation > 0 ? 'tag-warning' : deviation < 0 ? 'tag-success' : ''}`}>Отклонение: {formatCurrency(deviation)}</span>
          </div>
          <p className="muted">{item.comment || 'Комментарий к плановой позиции пока не добавлен.'}</p>
        </article>
      </div>

      <form className="page-card purchase-item-editor" onSubmit={saveItem}>
        <div>
          <p className="eyebrow">Работа с позицией</p>
          <h3>Зафиксируйте план, факт и источник покупки</h3>
          <p className="muted">
            Теперь отдельной закупки нет: вся реальная история по материалу или работе хранится прямо в позиции сметы.
          </p>
        </div>

        <div className="purchase-item-fields">
          <label className="form-field">
            <span className="form-label">Плановое количество</span>
            <input type="number" min="0.01" step="0.01" value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))} required disabled={!canEdit} />
          </label>
          <label className="form-field">
            <span className="form-label">Плановая цена</span>
            <input type="number" min="0.01" step="0.01" value={draft.unitPrice} onChange={(event) => setDraft((current) => ({ ...current, unitPrice: event.target.value }))} required disabled={!canEdit} />
          </label>
          <label className="form-field">
            <span className="form-label">Фактическое количество</span>
            <input type="number" min="0" step="0.01" value={draft.actualQuantity} onChange={(event) => setDraft((current) => ({ ...current, actualQuantity: event.target.value }))} disabled={!canEdit} />
          </label>
          <label className="form-field">
            <span className="form-label">Фактическая цена</span>
            <input type="number" min="0" step="0.01" value={draft.actualPrice} onChange={(event) => setDraft((current) => ({ ...current, actualPrice: event.target.value }))} disabled={!canEdit} />
          </label>
        </div>

        <label className="form-field">
          <span className="form-label">Где купили / у кого заказали</span>
          <input value={draft.purchaseSourceName} onChange={(event) => setDraft((current) => ({ ...current, purchaseSourceName: event.target.value }))} placeholder="Например: Леруа Мерлен или ИП Петров" disabled={!canEdit} />
        </label>
        <label className="form-field">
          <span className="form-label">Ссылка на источник</span>
          <input value={draft.purchaseSourceUrl} onChange={(event) => setDraft((current) => ({ ...current, purchaseSourceUrl: event.target.value }))} placeholder="Ссылка на магазин, карточку товара или прайс" disabled={!canEdit} />
        </label>
        <label className="form-field">
          <span className="form-label">Комментарий к плану</span>
          <textarea rows={2} value={draft.comment} onChange={(event) => setDraft((current) => ({ ...current, comment: event.target.value }))} disabled={!canEdit} />
        </label>
        <label className="form-field">
          <span className="form-label">Заметка по факту</span>
          <textarea rows={3} value={draft.purchaseNote} onChange={(event) => setDraft((current) => ({ ...current, purchaseNote: event.target.value }))} placeholder="Например: купили офлайн, цена выше из-за срочной доставки" disabled={!canEdit} />
        </label>
        <div className="action-row">
          <button type="submit" className="primary-button" disabled={!canEdit}>Сохранить позицию</button>
        </div>
      </form>

      {item.materialId ? (
        <div className="detail-grid detail-grid-single">
          <article className="page-card">
            <p className="eyebrow">Материал</p>
            <h3>Справочная карточка</h3>
            <p className="muted">Если по позиции выбран материал из каталога, можно быстро перейти в его карточку.</p>
            <div className="action-row">
              <Link className="ghost-button" to={`/materials/${item.materialId}`}>Открыть материал</Link>
            </div>
          </article>

          <article className="page-card">
            <p className="eyebrow">Подсказки по поставщикам</p>
            <h3>Кто может поставить этот материал</h3>
            <p className="muted">
              Это справочный список наших поставщиков по материалу. Вы можете купить у них или указать любой другой внешний источник в полях выше.
            </p>
            <div className="linked-grid">
              {materialDetail?.suppliers?.length ? materialDetail.suppliers.map((supplier) => (
                <Link key={supplier.id} className="linked-card" to={`/suppliers/${supplier.id}`}>
                  <strong>{supplier.name}</strong>
                  <span>{supplier.phone || supplier.email || 'Контакты не указаны'}</span>
                  <span>{supplier.telegram || supplier.websiteUrl || 'Без сайта и Telegram'}</span>
                  <span>Рейтинг: {supplier.rating}</span>
                </Link>
              )) : <div className="empty-note">Для этого материала пока не указаны поставщики. Можно указать любой внешний источник вручную.</div>}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
