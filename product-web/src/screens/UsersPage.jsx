import { useEffect, useState } from 'react';
import { api } from '../api';
import { translateRole } from '../i18n/enums';
import { TableShell } from './shared/TableShell';

export function UsersPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api('/api/users').then(setUsers).catch(() => setUsers([]));
  }, []);

  return (
    <TableShell
      title="Пользователи"
      subtitle="Управление ролями и доступом"
      columns={['ФИО', 'Email', 'Роль']}
      rows={users.map((user) => [user.fullName, user.email, translateRole(user.role)])}
    />
  );
}
