import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { formatRuDate } from '../i18n/date';
import { useAuth } from '../modules/auth/AuthContext';

const emptyReviewForm = { rating: 5, comment: '' };

function reviewFormFromReview(review) {
  return review
    ? { rating: String(review.rating), comment: review.comment }
    : { rating: 5, comment: '' };
}

function renderStars(rating) {
  return Array.from({ length: 5 }, (_, index) => (index < rating ? '★' : '☆')).join('');
}

export function SupplierDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [supplier, setSupplier] = useState(null);
  const [form, setForm] = useState(null);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isAdmin = user.role === 'ADMIN';
  const averageRating = useMemo(() => {
    if (!supplier?.reviews?.length) {
      return null;
    }
    const total = supplier.reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    return (total / supplier.reviews.length).toFixed(1);
  }, [supplier]);
  const ownReview = useMemo(
    () => supplier?.reviews?.find((review) => review.currentUser) ?? null,
    [supplier],
  );

  useEffect(() => {
    api(`/api/suppliers/${id}`).then((response) => {
      setSupplier(response);
      setReviewForm(reviewFormFromReview(response.reviews.find((review) => review.currentUser)));
      setForm({
        name: response.name,
        contactPerson: response.contactPerson,
        phone: response.phone,
        email: response.email,
        address: response.address,
        websiteUrl: response.websiteUrl ?? '',
        telegram: response.telegram ?? '',
        rating: String(response.rating),
        active: response.active,
      });
    }).catch(() => setSupplier(null));
  }, [id]);

  async function saveSupplier(event) {
    event.preventDefault();
    try {
      const updated = await api(`/api/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          rating: Number(form.rating),
        }),
      });
      const detail = await api(`/api/suppliers/${id}`);
      setSupplier(detail);
      setForm({
        name: updated.name,
        contactPerson: updated.contactPerson,
        phone: updated.phone,
        email: updated.email,
        address: updated.address,
        websiteUrl: updated.websiteUrl ?? '',
        telegram: updated.telegram ?? '',
        rating: String(updated.rating),
        active: updated.active,
      });
      setError('');
      setSuccess('Карточка поставщика обновлена.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  async function addReview(event) {
    event.preventDefault();
    try {
      const reviews = await api(`/api/suppliers/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating: Number(reviewForm.rating),
          comment: reviewForm.comment,
        }),
      });
      setSupplier((current) => ({ ...current, reviews }));
      setReviewForm(reviewFormFromReview(reviews.find((review) => review.currentUser)));
      setError('');
      setSuccess(ownReview ? 'Ваш отзыв о поставщике обновлен.' : 'Ваш отзыв о поставщике сохранен.');
    } catch (submissionError) {
      setError(submissionError.message);
      setSuccess('');
    }
  }

  if (!supplier || !form) {
    return <div className="page-card">Загрузка поставщика...</div>;
  }

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Карточка поставщика</p>
          <h2>{supplier.name}</h2>
          <p className="muted">
            {supplier.contactPerson} • {averageRating ? `${averageRating}/5 по отзывам` : `Рейтинг ${supplier.rating}`}
          </p>
        </div>
        <div className="action-row">
          <Link className="ghost-button" to="/suppliers">К списку поставщиков</Link>
        </div>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {success ? <div className="success-box">{success}</div> : null}

      <div className="detail-grid">
        <article className="page-card">
          <p className="eyebrow">Контакты</p>
          <h3>Как связаться с поставщиком</h3>
          <div className="contact-list">
            <span><strong>Контакт:</strong> {supplier.contactPerson}</span>
            <span><strong>Телефон:</strong> {supplier.phone}</span>
            <span><strong>Email:</strong> {supplier.email}</span>
            <span><strong>Адрес:</strong> {supplier.address}</span>
            <span>
              <strong>Сайт:</strong>{' '}
              {supplier.websiteUrl ? <a className="detail-link" href={supplier.websiteUrl} target="_blank" rel="noreferrer">{supplier.websiteUrl}</a> : 'Не указан'}
            </span>
            <span>
              <strong>Telegram:</strong>{' '}
              {supplier.telegram ? (
                <a className="detail-link" href={`https://t.me/${supplier.telegram.replace(/^@/, '')}`} target="_blank" rel="noreferrer">
                  {supplier.telegram}
                </a>
              ) : 'Не указан'}
            </span>
          </div>
          <div className="detail-meta">
            <span className="tag">Рейтинг: {supplier.rating}</span>
            <span className="tag">{supplier.active ? 'Активный партнер' : 'Скрыт из активной работы'}</span>
            <span className="tag">
              {averageRating ? `Средняя оценка: ${averageRating} ${renderStars(Math.round(Number(averageRating)))}` : 'Пока без отзывов'}
            </span>
          </div>
        </article>

        <article className="page-card">
          <p className="eyebrow">Материалы</p>
          <h3>С какими материалами поставщик уже работал</h3>
          <p className="muted">
            Здесь показываются материалы, по которым поставщик уже давал предложения в закупках. Это помогает быстро понять его рабочую историю в системе.
          </p>
          <div className="linked-grid">
            {supplier.materials.length ? supplier.materials.map((material) => (
              <Link key={material.id} className="linked-card" to={`/materials/${material.id}`}>
                <strong>{material.name}</strong>
                <span>{material.sku}</span>
                <span>{material.unit}</span>
                <span>{formatCurrency(material.defaultPrice)}</span>
              </Link>
            )) : <div className="empty-note">Список появится после того, как поставщик даст предложения по конкретным материалам в закупках.</div>}
          </div>
        </article>
      </div>

      <div className="detail-grid">
        <article className="page-card">
          <p className="eyebrow">Отзывы</p>
          <h3>Как команда оценивает поставщика</h3>
          <p className="muted">
            Один пользователь может оставить только один отзыв и потом редактировать его.
          </p>
          <div className="review-form-card">
            <div className="review-form-head">
              <div>
                <strong>{ownReview ? 'Редактирование вашего отзыва' : 'Оставьте отзыв о поставщике'}</strong>
                <p className="muted">
                  Оцените скорость ответа, качество коммуникации, соблюдение сроков и удобство совместной работы.
                </p>
              </div>
              {ownReview ? <span className="review-pill">Можно редактировать</span> : null}
            </div>
            <form className="purchase-comment-form" onSubmit={addReview}>
              <select value={reviewForm.rating} onChange={(event) => setReviewForm((current) => ({ ...current, rating: event.target.value }))}>
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{renderStars(value)} · {value} из 5</option>
                ))}
              </select>
              <textarea
                rows={3}
                value={reviewForm.comment}
                onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                placeholder="Опишите скорость ответа, качество коммуникации, соблюдение сроков и удобство работы"
                required
              />
              <button type="submit" className="ghost-button">{ownReview ? 'Обновить отзыв' : 'Сохранить отзыв'}</button>
            </form>
          </div>
          <div className="review-grid">
            {supplier.reviews.length ? supplier.reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-card-top">
                  <div>
                    <div className="review-card-header">
                      <strong>{review.authorName}</strong>
                      {review.currentUser ? <span className="review-pill">Ваш отзыв</span> : null}
                    </div>
                    <div className="review-stars" aria-label={`Оценка ${review.rating} из 5`}>
                      <span>{renderStars(review.rating)}</span>
                      <strong>{review.rating}/5</strong>
                    </div>
                  </div>
                  <span className="review-date">{formatRuDate(review.createdAt)}</span>
                </div>
                <p className="review-card-body">{review.comment}</p>
              </div>
            )) : <div className="empty-note">Пока отзывов о поставщике нет.</div>}
          </div>
        </article>

        {isAdmin ? (
          <form className="page-card form-grid" onSubmit={saveSupplier}>
            <div>
              <p className="eyebrow">Управление поставщиком</p>
              <h3>Редактирование доступно администратору</h3>
            </div>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Название поставщика" />
            <input value={form.contactPerson} onChange={(event) => setForm((current) => ({ ...current, contactPerson: event.target.value }))} placeholder="Контактное лицо" />
            <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Телефон" />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" />
            <input value={form.websiteUrl} onChange={(event) => setForm((current) => ({ ...current, websiteUrl: event.target.value }))} placeholder="Сайт" />
            <input value={form.telegram} onChange={(event) => setForm((current) => ({ ...current, telegram: event.target.value }))} placeholder="Telegram" />
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(event) => setForm((current) => ({ ...current, rating: event.target.value }))} placeholder="Рейтинг" />
            <textarea rows={4} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Адрес" />
            <label className="checkbox-row">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
              <span>Поставщик активен</span>
            </label>
            <button type="submit" className="primary-button">Сохранить поставщика</button>
          </form>
        ) : null}
      </div>
    </section>
  );
}
