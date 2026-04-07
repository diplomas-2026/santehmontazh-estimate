import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../i18n/currency';
import { TableShell } from './shared/TableShell';

export function MaterialsPage() {
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    api('/api/materials').then(setMaterials).catch(() => setMaterials([]));
  }, []);

  return (
    <TableShell
      title="Материалы"
      subtitle="Каталог материалов с карточками, фотографиями, описанием, отзывами и связанными поставщиками."
      columns={['Материал', 'Артикул', 'Категория', 'Ед.', 'Базовая цена', 'Карточка']}
      rows={materials.map((material) => [
        <Link key={`material-name-${material.id}`} className="detail-link" to={`/materials/${material.id}`}>{material.name}</Link>,
        material.sku,
        material.categoryName,
        material.unit,
        formatCurrency(material.defaultPrice),
        <Link key={`material-open-${material.id}`} className="primary-button" to={`/materials/${material.id}`}>Открыть</Link>,
      ])}
    />
  );
}
