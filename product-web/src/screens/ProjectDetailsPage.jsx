import { Link, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';
import { translateEstimateStatus, translateProjectStatus, translatePurchaseStatus } from '../i18n/enums';

export function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [estimates, setEstimates] = useState([]);
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    api(`/api/projects/${id}`).then(setProject).catch(() => setProject(null));
    api('/api/estimates')
      .then((items) => setEstimates(items.filter((item) => String(item.projectId) === String(id))))
      .catch(() => setEstimates([]));
    api('/api/purchases')
      .then((items) => setPurchases(items.filter((item) => String(item.projectId) === String(id))))
      .catch(() => setPurchases([]));
  }, [id]);

  const summary = useMemo(() => {
    return {
      estimates: estimates.length,
      purchases: purchases.length,
      planned: purchases.reduce((sum, item) => sum + Number(item.plannedTotal ?? 0), 0),
      actual: purchases.reduce((sum, item) => sum + Number(item.actualTotal ?? 0), 0),
    };
  }, [estimates, purchases]);

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
            <span className="tag">Старт: {project.plannedStartDate}</span>
            <span className="tag">Финиш: {project.plannedEndDate}</span>
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
              <strong>{summary.planned.toFixed(2)}</strong>
            </div>
            <div className="metric-card">
              <span>Факт</span>
              <strong>{summary.actual.toFixed(2)}</strong>
            </div>
          </div>
        </article>
      </div>

      <article className="page-card">
        <p className="eyebrow">Как работать с объектом</p>
        <h3>Основной сценарий</h3>
        <div className="tag-row">
          <span className="tag">1. Подготовить смету</span>
          <span className="tag">2. Проверить версии расчета</span>
          <span className="tag">3. Передать в закупку</span>
          <span className="tag">4. Согласовать закупку</span>
          <span className="tag">5. Сравнить план и факт</span>
        </div>
        <p className="muted">
          Для каждого объекта все должно происходить здесь: сначала формируется смета, затем на ее основе идет закупка,
          а после этого команда контролирует фактические затраты и отклонения.
        </p>
      </article>

      <div className="detail-grid">
        <article className="page-card">
          <div className="row-between">
            <div>
              <p className="eyebrow">Связанные сметы</p>
              <h3>Расчеты по объекту</h3>
            </div>
            <Link className="ghost-button" to="/estimates">Все сметы</Link>
          </div>

          <div className="stack-list">
            {estimates.length ? estimates.map((estimate) => (
              <div key={estimate.id} className="detail-list-item">
                <div>
                  <strong>{estimate.name}</strong>
                  <p className="muted">Версия {estimate.version} • {translateEstimateStatus(estimate.status)}</p>
                </div>
                <strong>{estimate.total}</strong>
              </div>
            )) : <p className="muted">По объекту пока нет смет.</p>}
          </div>
        </article>

        <article className="page-card">
          <div className="row-between">
            <div>
              <p className="eyebrow">Связанные закупки</p>
              <h3>Закупочный контур объекта</h3>
            </div>
            <Link className="ghost-button" to="/purchases">Все закупки</Link>
          </div>

          <div className="stack-list">
            {purchases.length ? purchases.map((purchase) => (
              <div key={purchase.id} className="detail-list-item">
                <div>
                  <strong>{purchase.estimateName}</strong>
                  <p className="muted">{translatePurchaseStatus(purchase.status)} • {purchase.supplierName}</p>
                </div>
                <div className="metric-inline">
                  <span>План: {purchase.plannedTotal}</span>
                  <span>Факт: {purchase.actualTotal}</span>
                </div>
              </div>
            )) : <p className="muted">По объекту пока нет закупок.</p>}
          </div>
        </article>
      </div>
    </section>
  );
}

