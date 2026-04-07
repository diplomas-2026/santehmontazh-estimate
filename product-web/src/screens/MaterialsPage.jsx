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
      subtitle="Каталог материалов для расчета сметы"
      columns={['Наименование', 'Артикул', 'Категория', 'Ед.', 'Базовая цена']}
      rows={materials.map((material) => [
        material.name,
        material.sku,
        material.categoryName,
        material.unit,
        formatCurrency(material.defaultPrice),
      ])}
    />
  );
}
