import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { formatRuDate } from '../i18n/date';
import { translatePurchaseStatus } from '../i18n/enums';

const emptyPurchaseForm = {
  supplierName: '',
  comment: '',
};

const emptyItemDraft = {
  plannedQuantity: '',
  plannedPrice: '',
  actualQuantity: '',
  actualPrice: '',
  comment: '',
};

const emptyOfferDraft = {
  supplierId: '',
  offeredPrice: '',
  deliveryDays: '',
  comment: '',
};

const lifecycleActions = {
  DRAFT: [
    {
      action: 'submit',
      label: 'Отправить на согласование',
      className: 'primary-button',
      message: 'Закупка отправлена на согласование.',
    },
  ],
  SUBMITTED: [
    {
      action: 'approve',
      label: 'Утвердить закупку',
      className: 'primary-button',
      message: 'Закупка утверждена.',
    },
    {
      action: 'return-for-revision',
      label: 'Вернуть на доработку',
      className: 'ghost-button',
      body: { message: 'Нужно скорректировать выбор поставщика' },
      message: 'Закупка возвращена на доработку.',
    },
  ],
  APPROVED: [
    {
      action: 'order',
      label: 'Оформить заказ',
      className: 'primary-button',
      message: 'Заказ оформлен.',
    },
  ],
  ORDERED: [
    {
      action: 'receive',
      label: 'Отметить получение',
      className: 'primary-button',
      message: 'Закупка отмечена как полученная.',
    },
  ],
  RETURNED_FOR_REVISION: [
    {
      action: 'submit',
      label: 'Повторно отправить на согласование',
      className: 'primary-button',
      message: 'Закупка повторно отправлена на согласование.',
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

function buildOfferDrafts(items = []) {
  return Object.fromEntries(items.map((item) => [item.id, { ...emptyOfferDraft }]));
}

function getLifecycleActions(status) {
  return lifecycleActions[status] ?? [];
}

function getCurrentStepLabel(status) {
  return translatePurchaseStatus(status);
}

export function PurchaseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseForm, setPurchaseForm] = useState(emptyPurchaseForm);
  const [itemDrafts, setItemDrafts] = useState({});
  const [offerDrafts, setOfferDrafts] = useState({});
  const [commentMessage, setCommentMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [purchaseResponse, suppliersResponse] = await Promise.all([
          api(`/api/purchases/${id}`),
          api('/api/suppliers').catch(() => []),
        ]);

        if (!active) {
          return;
        }

        setPurchase(purchaseResponse);
        setSuppliers(suppliersResponse);
        setError('');
      } catch {
        if (active) {
          setPurchase(null);
          setSuppliers([]);
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
      comment: purchase.comment ?? '',
    });
    setCommentMessage('');
    setItemDrafts(buildItemDrafts(purchase.items ?? []));
    setOfferDrafts(buildOfferDrafts(purchase.items ?? []));
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

  async function addOffer(itemId) {
    const draft = offerDrafts[itemId];
    try {
      await api(`/api/purchase-items/${itemId}/offers`, {
        method: 'POST',
        body: JSON.stringify({
          supplierId: Number(draft.supplierId),
          offeredPrice: Number(draft.offeredPrice),
          deliveryDays: Number(draft.deliveryDays),
          comment: draft.comment,
        }),
      });
      await reloadPurchase('Предложение поставщика добавлено.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function selectOffer(itemId, offerId) {
    try {
      await api(`/api/purchase-items/${itemId}/offers/${offerId}/select`, {
        method: 'POST',
      });
      await reloadPurchase('Предложение поставщика выбрано.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function changeStatus(action, body, message) {
    try {
      const response = await api(`/api/purchases/${id}/${action}`, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
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
      setSuccess('Комментарий добавлен.');
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
  const selectedOffers = new Map(
    (purchase.items ?? []).map((item) => [item.id, (item.offers ?? []).find((offer) => offer.selected) ?? null]),
  );

  return (
    <section className="page-section purchase-workbench">
      <div className="page-header">
        <div>
          <p className="eyebrow">Рабочая карточка закупки</p>
          <h2>{purchase.estimateName}</h2>
          <p className="muted">
            {purchase.projectName} • {getCurrentStepLabel(purchase.status)}
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

      <div className="detail-grid">
        <article className="page-card">
          <p className="eyebrow">Сводка</p>
          <h3>Что уже собрано по закупке</h3>
          <div className="detail-meta">
            <span className="tag">Объект: {purchase.projectName}</span>
            <span className="tag">Смета: {purchase.estimateName}</span>
            <span className="tag">Поставщик: {purchase.supplierName || 'не выбран'}</span>
            <span className="tag">Создана: {formatRuDate(purchase.createdAt)}</span>
            <span className="tag">Обновлена: {formatRuDate(purchase.updatedAt)}</span>
            <span className="tag">План: {formatCurrency(purchase.plannedTotal)}</span>
            <span className="tag">Факт: {formatCurrency(purchase.actualTotal)}</span>
            <span className="tag">Отклонение: {formatCurrency(purchase.deviation)}</span>
          </div>
          <p className="muted">
            {purchase.comment || 'Комментарий к закупке еще не добавлен. Здесь удобно фиксировать рабочие заметки и причины изменений.'}
          </p>
        </article>

        <article className="page-card">
          <p className="eyebrow">Статус и действия</p>
          <h3>Жизненный цикл закупки</h3>
          <div className="tag-row">
            <span className={`tag${purchase.status === 'DRAFT' ? ' tag-active' : ''}`}>Черновик</span>
            <span className={`tag${purchase.status === 'SUBMITTED' ? ' tag-active' : ''}`}>На согласовании</span>
            <span className={`tag${purchase.status === 'APPROVED' ? ' tag-active' : ''}`}>Утверждена</span>
            <span className={`tag${purchase.status === 'ORDERED' ? ' tag-active' : ''}`}>Заказ оформлен</span>
            <span className={`tag${purchase.status === 'RECEIVED' ? ' tag-active' : ''}`}>Получена</span>
          </div>
          <p className="muted">
            Текущий статус: <strong>{translatePurchaseStatus(purchase.status)}</strong>.
          </p>
          <div className="action-row">
            {currentActions.length ? currentActions.map((action) => (
              <button
                key={action.action}
                type="button"
                className={action.className}
                onClick={() => changeStatus(action.action, action.body, action.message)}
              >
                {action.label}
              </button>
            )) : <span className="tag">Новых действий сейчас нет</span>}
          </div>
        </article>
      </div>

      <form className="page-card form-grid purchase-form-card" onSubmit={savePurchase}>
        <div>
          <p className="eyebrow">Карточка закупки</p>
          <h3>Поставщик и комментарий</h3>
          <p className="muted">
            Здесь можно изменить базового поставщика закупки и оставить пояснение для команды.
          </p>
        </div>
        <input
          value={purchaseForm.supplierName}
          onChange={(event) => setPurchaseForm((current) => ({ ...current, supplierName: event.target.value }))}
          placeholder="Название поставщика"
          required
        />
        <textarea
          rows={3}
          value={purchaseForm.comment}
          onChange={(event) => setPurchaseForm((current) => ({ ...current, comment: event.target.value }))}
          placeholder="Комментарий к закупке"
          required
        />
        <button type="submit" className="primary-button">
          Сохранить карточку закупки
        </button>
      </form>

      <article className="page-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Позиции закупки</p>
            <h3>Что именно ведем по этой закупке</h3>
          </div>
          <strong>{formatCurrency(purchase.plannedTotal)}</strong>
        </div>

        <div className="stack-list">
          {(purchase.items ?? []).length ? purchase.items.map((item) => {
            const selectedOffer = selectedOffers.get(item.id);

            return (
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
                      {item.comment || 'Комментарий к позиции не задан. Его можно добавить в карточке ниже.'}
                    </p>
                  </div>
                  <div className="purchase-item-badge">
                    {selectedOffer ? (
                      <>
                        <span className="tag tag-success">Выбрано</span>
                        <strong>{selectedOffer.supplierName}</strong>
                        <span className="muted">
                          {formatCurrency(selectedOffer.offeredPrice)} • {selectedOffer.deliveryDays} дн.
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="tag">Выбор не сделан</span>
                        <span className="muted">Подберите предложение поставщика для этой позиции.</span>
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
                    required
                  />
                  <div className="action-row">
                    <button type="submit" className="ghost-button">
                      Сохранить позицию
                    </button>
                  </div>
                </form>

                <div className="purchase-offers-section">
                  <div className="row-between">
                    <div>
                      <p className="eyebrow">Предложения поставщиков</p>
                      <h4>Выбор лучшего варианта</h4>
                    </div>
                    <span className="tag">
                    {(item.offers ?? []).length ? `Предложений: ${(item.offers ?? []).length}` : 'Предложений пока нет'}
                  </span>
                </div>

                <div className="purchase-offer-grid">
                    {(item.offers ?? []).length ? (item.offers ?? []).map((offer) => (
                      <article key={offer.id} className={`purchase-offer-card${offer.selected ? ' selected' : ''}`}>
                        <div className="row-between">
                          <strong>{offer.supplierName}</strong>
                          {offer.selected ? <span className="tag tag-success">Выбрано</span> : null}
                        </div>
                        <p className="muted">
                          {formatCurrency(offer.offeredPrice)} • {offer.deliveryDays} дн.
                        </p>
                        <p className="muted">{offer.comment}</p>
                        {!offer.selected ? (
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => selectOffer(item.id, offer.id)}
                          >
                            Выбрать предложение
                          </button>
                        ) : null}
                      </article>
                    )) : (
                      <div className="empty-note">Пока нет предложений по этой позиции.</div>
                    )}
                  </div>

                  <form
                    className="purchase-offer-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      addOffer(item.id);
                    }}
                  >
                    <select
                      value={offerDrafts[item.id]?.supplierId ?? ''}
                      onChange={(event) => setOfferDrafts((current) => ({
                        ...current,
                        [item.id]: {
                          ...(current[item.id] ?? { ...emptyOfferDraft }),
                          supplierId: event.target.value,
                        },
                      }))}
                      required
                    >
                      <option value="">Выберите поставщика</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={offerDrafts[item.id]?.offeredPrice ?? ''}
                      onChange={(event) => setOfferDrafts((current) => ({
                        ...current,
                        [item.id]: {
                          ...(current[item.id] ?? { ...emptyOfferDraft }),
                          offeredPrice: event.target.value,
                        },
                      }))}
                      placeholder="Цена предложения"
                      required
                    />
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={offerDrafts[item.id]?.deliveryDays ?? ''}
                      onChange={(event) => setOfferDrafts((current) => ({
                        ...current,
                        [item.id]: {
                          ...(current[item.id] ?? { ...emptyOfferDraft }),
                          deliveryDays: event.target.value,
                        },
                      }))}
                      placeholder="Срок поставки, дней"
                      required
                    />
                    <input
                      value={offerDrafts[item.id]?.comment ?? ''}
                      onChange={(event) => setOfferDrafts((current) => ({
                        ...current,
                        [item.id]: {
                          ...(current[item.id] ?? { ...emptyOfferDraft }),
                          comment: event.target.value,
                        },
                      }))}
                      placeholder="Комментарий к предложению"
                      required
                    />
                    <button type="submit" className="primary-button">
                      Добавить предложение
                    </button>
                  </form>
                </div>
              </article>
            );
          }) : <p className="muted">В этой закупке пока нет позиций.</p>}
        </div>
      </article>

      <article className="page-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Комментарии</p>
            <h3>История согласования и замечания</h3>
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
          )) : <p className="muted">Комментариев пока нет.</p>}
        </div>

        <form className="purchase-comment-form" onSubmit={addComment}>
          <textarea
            rows={3}
            value={commentMessage}
            onChange={(event) => setCommentMessage(event.target.value)}
            placeholder="Оставьте комментарий для команды или зафиксируйте замечание"
            required
          />
          <div className="action-row">
            <button type="submit" className="ghost-button">
              Добавить комментарий
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
