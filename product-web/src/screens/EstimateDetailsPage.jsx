import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
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
  const [purchase, setPurchase] = useState(null);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function load() {
    api(`/api/estimates/${id}`).then(setEstimate).catch(() => setEstimate(null));
    api('/api/materials').then(setMaterials).catch(() => setMaterials([]));
    api('/api/purchases')
      .then((items) => setPurchase(items.find((item) => String(item.estimateId) === String(id)) ?? null))
      .catch(() => setPurchase(null));
  }

  useEffect(() => {
    load();
  }, [id]);

  const selectedMaterial = useMemo(
    () => materials.find((material) => String(material.id) === String(itemForm.materialId)) ?? null,
    [materials, itemForm.materialId],
  );

  useEffect(() => {
    if (!selectedMaterial || itemForm.unitPrice) {
      return;
    }
    setItemForm((current) => ({ ...current, unitPrice: String(selectedMaterial.defaultPrice ?? '') }));
  }, [selectedMaterial, itemForm.unitPrice]);

  const canEdit = ['ADMIN', 'ESTIMATOR'].includes(user.role) && estimate?.status === 'DRAFT';
  const canCreatePurchase = ['ADMIN', 'ESTIMATOR', 'PURCHASER'].includes(user.role) && estimate?.items?.length > 0 && !purchase;

  async function addItem(event) {
    event.preventDefault();
    try {
      const updated = await api(`/api/estimates/${id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          materialId: Number(itemForm.materialId),
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

  async function createPurchase() {
    try {
      const createdPurchase = await api(`/api/purchases/from-estimate/${id}`, { method: 'POST' });
      setPurchase(createdPurchase);
      setSuccess('Закупка создана по этой смете. Теперь снабжение может продолжить работу.');
      setError('');
      load();
    } catch (submissionError) {
      setError(submissionError.message);
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
          <button type="button" className="ghost-button" onClick={() => navigate(`/projects/${estimate.projectId}`)}>
            К объекту
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <article className="page-card">
          <p className="eyebrow">Что входит в смету</p>
          <h3>Описание расчета</h3>
          <p>{estimate.notes}</p>
          <div className="detail-meta">
            <span className="tag">Сумма: {formatCurrency(estimate.total)}</span>
            <span className="tag">Автор: {estimate.createdByName}</span>
            <span className="tag">Позиции: {estimate.items.length}</span>
          </div>
        </article>

        <article className="page-card">
          <p className="eyebrow">Переход в закупку</p>
          <h3>Что делает система дальше</h3>
          <p className="muted">
            После передачи в закупку из позиций этой сметы создается черновик закупки. Снабженец продолжит работу уже
            в закупочном модуле: выберет поставщиков, согласует и доведет покупку до факта.
          </p>
          <div className="action-row">
            {purchase ? (
              <>
                <div className="success-box">Закупка уже создана по этой смете.</div>
                <button type="button" className="primary-button" onClick={() => navigate('/purchases')}>
                  Открыть закупки
                </button>
              </>
            ) : (
              <button type="button" className="primary-button" disabled={!canCreatePurchase} onClick={createPurchase}>
                Создать закупку по смете
              </button>
            )}
          </div>
          {!purchase && estimate.items.length === 0 ? (
            <p className="muted">Сначала добавьте хотя бы одну позицию сметы.</p>
          ) : null}
        </article>
      </div>

      {canEdit ? (
        <form className="page-card form-grid" onSubmit={addItem}>
          <div>
            <p className="eyebrow">Новая позиция</p>
            <h3>Добавить строку в смету</h3>
            <p className="muted">
              Здесь вы добавляете конкретный пункт расчета: материал, работу, количество, цену и пояснение.
            </p>
          </div>
          <select
            value={itemForm.materialId}
            onChange={(event) => setItemForm((current) => ({ ...current, materialId: event.target.value }))}
          >
            <option value="">Выберите материал</option>
            {materials.map((material) => (
              <option key={material.id} value={material.id}>
                {material.name} • {material.unit} • {formatCurrency(material.defaultPrice)}
              </option>
            ))}
          </select>
          <input
            value={itemForm.workName}
            onChange={(event) => setItemForm((current) => ({ ...current, workName: event.target.value }))}
            placeholder="Например: Монтаж гарнитура"
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={itemForm.quantity}
            onChange={(event) => setItemForm((current) => ({ ...current, quantity: event.target.value }))}
            placeholder="Количество"
          />
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={itemForm.unitPrice}
            onChange={(event) => setItemForm((current) => ({ ...current, unitPrice: event.target.value }))}
            placeholder="Цена за единицу"
          />
          <input
            value={itemForm.comment}
            onChange={(event) => setItemForm((current) => ({ ...current, comment: event.target.value }))}
            placeholder="Комментарий к позиции"
          />
          {error ? <div className="error-box">{error}</div> : null}
          {success ? <div className="success-box">{success}</div> : null}
          <button type="submit" className="primary-button">Добавить позицию</button>
        </form>
      ) : null}

      <article className="page-card">
        <div className="row-between">
          <div>
            <p className="eyebrow">Позиции сметы</p>
            <h3>Состав расчета</h3>
          </div>
          <strong>{formatCurrency(estimate.total)}</strong>
        </div>

        <div className="stack-list">
          {estimate.items.length ? estimate.items.map((item) => (
            <div key={item.id} className="detail-list-item">
              <div>
                <strong>{item.workName}</strong>
                <p className="muted">{item.materialName} • {item.quantity} {item.unit} • {formatCurrency(item.unitPrice)}</p>
                <p className="muted">{item.comment}</p>
              </div>
              <div className="detail-actions">
                <strong>{formatCurrency(item.lineTotal)}</strong>
                {canEdit ? (
                  <button type="button" className="ghost-button" onClick={() => deleteItem(item.id)}>
                    Удалить
                  </button>
                ) : null}
              </div>
            </div>
          )) : <p className="muted">В этой смете пока нет позиций.</p>}
        </div>
      </article>
    </section>
  );
}
