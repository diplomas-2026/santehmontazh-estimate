import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { translatePurchaseStatus } from '../i18n/enums';

const emptyItemDraft = {
  plannedQuantity: '',
  plannedPrice: '',
  actualQuantity: '',
  actualPrice: '',
  supplierName: '',
  supplierUrl: '',
  comment: '',
};

function buildItemDraft(item) {
  return {
    plannedQuantity: String(item?.plannedQuantity ?? ''),
    plannedPrice: String(item?.plannedPrice ?? ''),
    actualQuantity: String(item?.actualQuantity ?? ''),
    actualPrice: String(item?.actualPrice ?? ''),
    supplierName: item?.supplierName ?? '',
    supplierUrl: item?.supplierUrl ?? '',
    comment: item?.comment ?? '',
  };
}

export function PurchaseItemDetailsPage() {
  const { id, itemId } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [draft, setDraft] = useState(emptyItemDraft);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const response = await api(`/api/purchases/${id}`);
        if (!active) {
          return;
        }
        setPurchase(response);
        setError('');
      } catch {
        if (active) {
          setPurchase(null);
          setError('Не удалось загрузить позицию закупки.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [id]);

  const item = useMemo(
    () => purchase?.items?.find((entry) => String(entry.id) === String(itemId)) ?? null,
    [purchase, itemId],
  );

  useEffect(() => {
    if (item) {
      setDraft(buildItemDraft(item));
    }
  }, [item]);

  async function reload(message) {
    const response = await api(`/api/purchases/${id}`);
    setPurchase(response);
    const refreshedItem = response.items?.find((entry) => String(entry.id) === String(itemId));
    if (refreshedItem) {
      setDraft(buildItemDraft(refreshedItem));
    }
    setSuccess(message);
    setError('');
  }

  async function saveItem(event) {
    event.preventDefault();
    try {
      await api(`/api/purchase-items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({
          plannedQuantity: Number(draft.plannedQuantity),
          plannedPrice: Number(draft.plannedPrice),
          actualQuantity: Number(draft.actualQuantity),
          actualPrice: Number(draft.actualPrice),
          supplierName: draft.supplierName,
          supplierUrl: draft.supplierUrl,
          comment: draft.comment,
        }),
      });
      await reload('Позиция закупки обновлена.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  if (loading) {
    return <div className="page-card">Загрузка позиции закупки...</div>;
  }

  if (!purchase || !item) {
    return <div className="page-card">Позиция закупки не найдена.</div>;
  }

  const canEdit = purchase.status !== 'COMPLETED';

  return (
    <section className="page-section purchase-workbench">
      <div className="page-header">
        <div>
          <p className="eyebrow">Позиция закупки</p>
          <h2>{item.materialName}</h2>
          <p className="muted">
            {purchase.estimateName} • {translatePurchaseStatus(purchase.status)}
          </p>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => navigate(`/purchases/${id}`)}>
            К закупке
          </button>
          <button type="button" className="ghost-button" onClick={() => navigate(`/projects/${purchase.projectId}`)}>
            К объекту
          </button>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="success-box">{success}</div> : null}

      <div className="detail-grid detail-grid-single">
        <article className="page-card">
          <p className="eyebrow">Сводка по позиции</p>
          <h3>Что планировали и что получилось по факту</h3>
          <div className="detail-meta">
            <span className="tag">Единица: {item.unit}</span>
            <span className="tag">План: {item.plannedQuantity} {item.unit} по {formatCurrency(item.plannedPrice)}</span>
            <span className="tag">Факт: {item.actualQuantity} {item.unit} по {formatCurrency(item.actualPrice)}</span>
            <span className="tag">Итого по плану: {formatCurrency(item.plannedLineTotal)}</span>
            <span className="tag">Итого по факту: {formatCurrency(item.actualLineTotal)}</span>
            <span className="tag">Где купили: {item.supplierName || 'Не указано'}</span>
          </div>
          <p className="muted">
            {item.comment || 'Комментарий к позиции пока не добавлен.'}
          </p>
          {item.supplierUrl ? (
            <p className="muted">
              Ссылка:{' '}
              <a className="detail-link" href={item.supplierUrl} target="_blank" rel="noreferrer">
                {item.supplierUrl}
              </a>
            </p>
          ) : null}
        </article>

        <article className="page-card">
          <p className="eyebrow">Подсказки по поставщикам</p>
          <h3>У кого можно купить эту позицию</h3>
          <div className="linked-grid">
            {(item.supplierHints ?? []).length ? item.supplierHints.map((supplier) => (
              <Link key={supplier.supplierId} className="linked-card" to={`/suppliers/${supplier.supplierId}`}>
                <strong>{supplier.supplierName}</strong>
                <span>Рейтинг: {supplier.rating}</span>
                <span>{supplier.phone}</span>
                <span>{supplier.telegram || supplier.email || supplier.websiteUrl || 'Контакт не указан'}</span>
              </Link>
            )) : (
              <div className="empty-note">
                Для этой позиции пока нет подсказок по поставщикам. Это не блокирует закупку: место покупки можно указать прямо в карточке закупки.
              </div>
            )}
          </div>
        </article>
      </div>

      <form className="page-card purchase-item-editor" onSubmit={saveItem}>
        <div>
          <p className="eyebrow">Редактирование позиции</p>
          <h3>Обновите план, факт и источник покупки</h3>
          <p className="muted">
            Здесь вы фиксируете реальный результат закупки по конкретной позиции: сколько купили, по какой цене и где именно купили.
          </p>
        </div>
        <div className="purchase-item-fields">
          <label className="form-field">
            <span className="form-label">Плановое количество</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.plannedQuantity}
              onChange={(event) => setDraft((current) => ({ ...current, plannedQuantity: event.target.value }))}
              placeholder="Плановое количество"
              required
              disabled={!canEdit}
            />
          </label>
          <label className="form-field">
            <span className="form-label">Плановая цена</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.plannedPrice}
              onChange={(event) => setDraft((current) => ({ ...current, plannedPrice: event.target.value }))}
              placeholder="Плановая цена"
              required
              disabled={!canEdit}
            />
          </label>
          <label className="form-field">
            <span className="form-label">Фактическое количество</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.actualQuantity}
              onChange={(event) => setDraft((current) => ({ ...current, actualQuantity: event.target.value }))}
              placeholder="Фактическое количество"
              required
              disabled={!canEdit}
            />
          </label>
          <label className="form-field">
            <span className="form-label">Фактическая цена</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.actualPrice}
              onChange={(event) => setDraft((current) => ({ ...current, actualPrice: event.target.value }))}
              placeholder="Фактическая цена"
              required
              disabled={!canEdit}
            />
          </label>
        </div>
        <label className="form-field">
          <span className="form-label">Где купили</span>
          <input
            value={draft.supplierName}
            onChange={(event) => setDraft((current) => ({ ...current, supplierName: event.target.value }))}
            placeholder="Например: Леруа Мерлен или ООО ТеплоСнаб"
            disabled={!canEdit}
          />
        </label>
        <label className="form-field">
          <span className="form-label">Ссылка на место покупки</span>
          <input
            value={draft.supplierUrl}
            onChange={(event) => setDraft((current) => ({ ...current, supplierUrl: event.target.value }))}
            placeholder="Ссылка на поставщика, магазин или карточку товара"
            disabled={!canEdit}
          />
        </label>
        <label className="form-field">
          <span className="form-label">Комментарий к позиции</span>
          <textarea
            rows={3}
            value={draft.comment}
            onChange={(event) => setDraft((current) => ({ ...current, comment: event.target.value }))}
            placeholder="Комментарий к позиции"
            disabled={!canEdit}
          />
        </label>
        <div className="action-row">
          <button type="submit" className="primary-button" disabled={!canEdit}>
            Сохранить позицию
          </button>
        </div>
      </form>
    </section>
  );
}
