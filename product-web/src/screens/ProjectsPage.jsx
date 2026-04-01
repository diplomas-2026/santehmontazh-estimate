import { useEffect, useState } from 'react';
import { api } from '../api';
import { TableShell } from './shared/TableShell';

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api('/api/projects').then(setProjects).catch(() => setProjects([]));
  }, []);

  return (
    <TableShell
      title="Объекты"
      subtitle="Карточки объектов и текущие статусы работ"
      columns={['Название', 'Код', 'Адрес', 'Статус', 'Закупки']}
      rows={projects.map((project) => [
        project.name,
        project.code,
        project.address,
        project.status,
        project.purchaseTotal,
      ])}
    />
  );
}
