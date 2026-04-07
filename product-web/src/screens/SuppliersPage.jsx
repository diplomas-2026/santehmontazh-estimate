import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { TableShell } from './shared/TableShell';

export function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    api('/api/suppliers').then(setSuppliers).catch(() => setSuppliers([]));
  }, []);

  return (
    <TableShell
      title="Поставщики"
      subtitle="Справочник контрагентов, каналов связи, отзывов и связанных материалов."
      premium
      premiumMessage="С подпиской вы открываете сравнение предложений, рейтинг поставщиков и рекомендации по выбору."
      columns={['Компания', 'Контакт', 'Телефон', 'Email', 'Рейтинг', 'Карточка']}
      rows={suppliers.map((supplier) => [
        <Link key={`supplier-name-${supplier.id}`} className="detail-link" to={`/suppliers/${supplier.id}`}>{supplier.name}</Link>,
        supplier.contactPerson,
        supplier.phone,
        supplier.email,
        supplier.rating,
        <Link key={`supplier-open-${supplier.id}`} className="primary-button" to={`/suppliers/${supplier.id}`}>Открыть</Link>,
      ])}
    />
  );
}
