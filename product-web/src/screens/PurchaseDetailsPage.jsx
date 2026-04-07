import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { formatRuDate } from '../i18n/date';
import { translatePurchaseStatus } from '../i18n/enums';

const emptyPurchaseForm = {
  supplierName: '',
  supplierUrl: '',
  comment: '',
};

const emptyItemDraft = {
  plannedQuantity: '',
  plannedPrice: '',
  actualQuantity: '',
  actualPrice: '',
  comment: '',
};

const lifecycleActions = {
  DRAFT: [
    {
      action: 'start',
      label: 'Начать закупку',
      className: 'primary-button',
      message: 'Закупка переведена в работу.',
    },
  ],
  IN_PROGRESS: [
    {
      action: 'complete',
      label: 'Завершить закупку',
      className: 'primary-button',
      message: 'Закупка завершена.',
    },
  ],
};

function buildItemDrafts(items = []) {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        plannedQuantity: String(item.plannedQuantity ?? ''),
        plannedPrice: String(item.plannedPrice ?? ''),
        actualQuantity: String(item.actualQuantity ?? ''),
        actualPrice: String(item.actualPrice ?? ''),
        comment: item.comment ?? '',
      },
    ]),
  );
}

function getLifecycleActions(status) {
  return lifecycleActions[status] ?? [];
}

export function PurchaseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [itemDrafts, setItemDrafts] = useState({});
  const [commentMessage, setCommentMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const purchaseResponse = await api(`/api/purchases/${id}`);

        if (!active) {
          return;
        }

        setPurchase(purchaseResponse);
        setError('');
      } catch {
        if (active) {
          setPurchase(null);
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

  useEffect(() => {
    if (!purchase) {
      return;
    }

    setPurchaseForm({
      supplierName: purchase.supplierName ?? '',
      supplierUrl: purchase.supplierUrl ?? '',
      comment: purchase.comment ?? '',
    });
    setCommentMessage('');
    setItemDrafts(buildItemDrafts(purchase.items ?? []));
  }, [purchase]);

  async function reloadPurchase(message) {
    const response = await api(`/api/purchases/${id}`);
    setPurchase(response);
    if (message) {
      setSuccess(message);
    }
    setError('');
    return response;
  }

  async function savePurchase(event) {
    event.preventDefault();
    try {
      await api(`/api/purchases/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          estimateId: purchase.estimateId,
          supplierName: purchaseForm.supplierName,
          supplierUrl: purchaseForm.supplierUrl,
          comment: purchaseForm.comment,
        }),
      });
      await reloadPurchase('Карточка закупки обновлена.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function saveItem(itemId) {
    const draft = itemDrafts[itemId];
    try {
      const response = await api(`/api/purchase-items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify({
          plannedQuantity: Number(draft.plannedQuantity),
          plannedPrice: Number(draft.plannedPrice),
          actualQuantity: Number(draft.actualQuantity),
          actualPrice: Number(draft.actualPrice),
          comment: draft.comment,
        }),
      });
      setPurchase(response);
      setError('');
      setSuccess('Позиция закупки обновлена.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function changeStatus(action, message) {
    try {
      const response = await api(`/api/purchases/${id}/${action}`, {
        method: 'POST',
      });
      setPurchase(response);
      setError('');
      setSuccess(message);
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function addComment(event) {
    event.preventDefault();
    try {
      const comments = await api(`/api/purchases/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ message: commentMessage }),
      });
      setPurchase((current) => (current ? { ...current, comments } : current));
      setCommentMessage('');
      setError('');
      setSuccess('Заметка добавлена.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function openPrintView() {
    try {
      const text = await api(`/api/purchases/${id}/print`);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  if (loading) {
    return <div className="page-card">Загрузка закупки...</div>;
  }

  if (!purchase) {
    return <div className="page-card">Закупка не найдена.</div>;
  }

  const currentActions = getLifecycleActions(purchase.status);
  const canEdit = purchase.status !== 'COMPLETED';

  return (
    <section className="page-section purchase-workbench">
      <div className="page-header">
        <div>
          <p className="eyebrow">Рабочая карточка закупки</p>
          <h2>{purchase.estimateName}</h2>
          <p className="muted">
            {purchase.projectName} • {translatePurchaseStatus(purchase.status)}
          </p>
        </div>
        <div className="action-row">
          <button type="button" className="ghost-button" onClick={() => navigate(`/projects/${purchase.projectId}`)}>
            К объекту
          </button>
          <Link className="ghost-button" to="/purchases">
            К списку закупок
          </Link>
          <button type="button" className="primary-button" onClick={openPrintView}>
            Печать
          </button>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="success-box">{success}</div> : null}

      {!canEdit ? (
        <div className="page-card">
          <p className="eyebrow">Режим просмотра</p>
          <h3>Закупка уже завершена</h3>
          <p className="muted">
            После завершения закупка остается доступной для просмотра и печати, но больше не редактируется.
          </p>
        </div>
      ) : null}

      <div className="detail-grid detail-grid-single">
        <article className="page-card">
          <p className="eyebrow">Сводка</p>
          <h3>Что уже собрано по закупке</h3>
          <div className="detail-meta">
            <span className="tag">Объект: {purchase.projectName}</span>
            <span className="tag">Смета: {purchase.estimateName}</span>
            <span className="tag">Где купили: {purchase.supplierName || 'Не указано'}</span>
            <span className="tag">Создана: {formatRuDate(purchase.createdAt)}</span>
            <span className="tag">Обновлена: {formatRuDate(purchase.updatedAt)}</span>
            <span className="tag">План: {formatCurrency(purchase.plannedTotal)}</span>
            <span className="tag">Факт: {formatCurrency(purchase.actualTotal)}</span>
            <span className="tag">Отклонение: {formatCurrency(purchase.deviation)}</span>
          </div>
          <p className="muted">
            {purchase.comment || 'Здесь можно кратко зафиксировать, как проходит закупка и любые важные договоренности.'}
          </p>
          {purchase.supplierUrl ? (
            <p className="muted">
              Ссылка на место покупки:{' '}
              <a className="detail-link" href={purchase.supplierUrl} target="_blank" rel="noreferrer">
                {purchase.supplierUrl}
              </a>
            </p>
          ) : null}
        </article>

        <article className="page-card">
          <p className="eyebrow">Статус и действия</p>
          <h3>Текущий этап закупки</h3>
          <div className="tag-row">
            <span className={`tag${purchase.status === 'DRAFT' ? ' tag-active' : ''}`}>Черновик</span>
            <span className={`tag${purchase.status === 'IN_PROGRESS' ? ' tag-active' : ''}`}>В закупке</span>
            <span className={`tag${purchase.status === 'COMPLETED' ? ' tag-active' : ''}`}>Завершена</span>
          </div>
          <p className="muted">
            BASE_USER сам ведет закупку от начала до конца: выбирает, где купить, фиксирует факт и завершает процесс без согласования.
          </p>
          <div className="action-row">
            {currentActions.length ? currentActions.map((action) => (
              <button
                key={action.action}
                type="button"
                className={action.className}
                onClick={() => changeStatus(action.action, action.message)}
              >
                {action.label}
              </button>
            )) : <span className="tag">Новых действий сейчас нет</span>}
          </div>
        </article>
      </div>

      <form className="page-card form-grid purchase-form-card" onSubmit={savePurchase}>
        <div>
          <p className="eyebrow">Где купили</p>
          <h3>Зафиксируйте источник покупки</h3>
          <p className="muted">
            Это может быть поставщик из каталога, внешний магазин, маркетплейс или любой другой источник. Ссылка необязательна.
          </p>
        </div>
        <input
          value={purchaseForm.supplierName}
          onChange={(event) => setPurchaseForm((current) => ({ ...current, supplierName: event.target.value }))}
          placeholder="Например: ООО ТеплоСнаб или Леруа Мерлен"
          disabled={!canEdit}
        />
        <input
          value={purchaseForm.supplierUrl}
          onChange={(event) => setPurchaseForm((current) => ({ ...current, supplierUrl: event.target.value }))}
          placeholder="Ссылка на поставщика, магазин или карточку товара"
          disabled={!canEdit}
        />
        <textarea
          rows={3}
          value={purchaseForm.comment}
          onChange={(event) => setPurchaseForm((current) => ({ ...current, comment: event.target.value }))}
          placeholder="Краткий комментарий по закупке"
          disabled={!canEdit}
        />
        <button type="submit" className="primary-button" disabled={!canEdit}>
          Сохранить карточку закупки
        </button>
      </form>

      <article className="page-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Позиции закупки</p>
            <h3>Что именно покупаем по этой закупке</h3>
          </div>
          <strong>{formatCurrency(purchase.plannedTotal)}</strong>
        </div>

        <div className="stack-list">
          {(purchase.items ?? []).length ? purchase.items.map((item) => (
            <article key={item.id} className="purchase-item-card">
              <div className="purchase-item-head">
                <div>
                  <p className="eyebrow">Позиция</p>
                  <h4>{item.materialName}</h4>
                  <div className="detail-meta">
                    <span className="tag">
                      План: {item.plannedQuantity} {item.unit} по {formatCurrency(item.plannedPrice)}
                    </span>
                    <span className="tag">
                      Факт: {item.actualQuantity} {item.unit} по {formatCurrency(item.actualPrice)}
                    </span>
                    <span className="tag">Итого по плану: {formatCurrency(item.plannedLineTotal)}</span>
                    <span className="tag">Итого по факту: {formatCurrency(item.actualLineTotal)}</span>
                  </div>
                  <p className="muted">
                    {item.comment || 'Комментарий к позиции не задан.'}
                  </p>
                </div>
                <div className="purchase-item-badge">
                  {(item.supplierHints ?? []).length ? (
                    <>
                      <span className="tag tag-success">Есть подсказки</span>
                      <span className="muted">Можно посмотреть подходящих поставщиков ниже.</span>
                    </>
                  ) : (
                    <>
                      <span className="tag">Подсказок нет</span>
                      <span className="muted">Эту позицию можно купить у любого внешнего поставщика и просто зафиксировать факт в закупке.</span>
                    </>
                  )}
                </div>
              </div>

              <form
                className="purchase-item-editor"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveItem(item.id);
                }}
              >
                <div className="purchase-item-fields">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemDrafts[item.id]?.plannedQuantity ?? ''}
                    onChange={(event) => setItemDrafts((current) => ({
                      ...current,
                      [item.id]: {
                        ...(current[item.id] ?? { ...emptyItemDraft }),
                        plannedQuantity: event.target.value,
                      },
                    }))}
                    placeholder="Плановое количество"
                    required
                    disabled={!canEdit}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemDrafts[item.id]?.plannedPrice ?? ''}
                    onChange={(event) => setItemDrafts((current) => ({
                      ...current,
                      [item.id]: {
                        ...(current[item.id] ?? { ...emptyItemDraft }),
                        plannedPrice: event.target.value,
                      },
                    }))}
                    placeholder="Плановая цена"
                    required
                    disabled={!canEdit}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemDrafts[item.id]?.actualQuantity ?? ''}
                    onChange={(event) => setItemDrafts((current) => ({
                      ...current,
                      [item.id]: {
                        ...(current[item.id] ?? { ...emptyItemDraft }),
                        actualQuantity: event.target.value,
                      },
                    }))}
                    placeholder="Фактическое количество"
                    required
                    disabled={!canEdit}
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemDrafts[item.id]?.actualPrice ?? ''}
                    onChange={(event) => setItemDrafts((current) => ({
                      ...current,
                      [item.id]: {
                        ...(current[item.id] ?? { ...emptyItemDraft }),
                        actualPrice: event.target.value,
                      },
                    }))}
                    placeholder="Фактическая цена"
                    required
                    disabled={!canEdit}
                  />
                </div>
                <textarea
                  rows={2}
                  value={itemDrafts[item.id]?.comment ?? ''}
                  onChange={(event) => setItemDrafts((current) => ({
                    ...current,
                    [item.id]: {
                      ...(current[item.id] ?? { ...emptyItemDraft }),
                      comment: event.target.value,
                    },
                  }))}
                  placeholder="Комментарий к позиции"
                  disabled={!canEdit}
                />
                <div className="action-row">
                  <button type="submit" className="ghost-button" disabled={!canEdit}>
                    Сохранить позицию
                  </button>
                </div>
              </form>

              <div className="purchase-offers-section">
                <div className="row-between">
                  <div>
                    <p className="eyebrow">Подсказки по поставщикам</p>
                    <h4>У кого можно купить эту позицию</h4>
                  </div>
                  <span className="tag">
                    {(item.supplierHints ?? []).length ? `Подсказок: ${(item.supplierHints ?? []).length}` : 'Подсказок пока нет'}
                  </span>
                </div>

                <div className="linked-grid">
                  {(item.supplierHints ?? []).length ? (item.supplierHints ?? []).map((supplier) => (
                    <Link key={supplier.supplierId} className="linked-card" to={`/suppliers/${supplier.supplierId}`}>
                      <strong>{supplier.supplierName}</strong>
                      <span>Рейтинг: {supplier.rating}</span>
                      <span>{supplier.phone}</span>
                      <span>{supplier.telegram || supplier.email}</span>
                    </Link>
                  )) : (
                    <div className="empty-note">
                      Для этой позиции пока нет подсказок по поставщикам. Это не блокирует закупку: место покупки можно зафиксировать вручную в карточке закупки.
                    </div>
                  )}
                </div>
              </div>
            </article>
          )) : <p className="muted">В этой закупке пока нет позиций.</p>}
        </div>
      </article>

      <article className="page-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Рабочие заметки</p>
            <h3>История комментариев по закупке</h3>
          </div>
        </div>

        <div className="stack-list">
          {(purchase.comments ?? []).length ? (purchase.comments ?? []).map((comment) => (
            <article key={comment.id} className="purchase-comment-card">
              <div className="row-between">
                <strong>{comment.authorName}</strong>
                <span className="muted">{formatRuDate(comment.createdAt)}</span>
              </div>
              <p>{comment.message}</p>
            </article>
          )) : <p className="muted">Заметок пока нет.</p>}
        </div>

        <form className="purchase-comment-form" onSubmit={addComment}>
          <textarea
            rows={3}
            value={commentMessage}
            onChange={(event) => setCommentMessage(event.target.value)}
            placeholder="Оставьте заметку по закупке"
            required
          />
          <div className="action-row">
            <button type="submit" className="ghost-button">
              Добавить заметку
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
