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
      subtitle="Справочник контрагентов и закупочных партнеров"
      columns={['Компания', 'Контакт', 'Телефон', 'Email', 'Рейтинг']}
      rows={suppliers.map((supplier) => [
        supplier.name,
        supplier.contactPerson,
        supplier.phone,
        supplier.email,
        supplier.rating,
      ])}
    />
  );
}
