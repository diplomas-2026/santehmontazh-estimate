import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api';
import { translateProjectStatus } from '../i18n/enums';
import { TableShell } from './shared/TableShell';

export function ProjectsPage() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    api('/api/projects').then(setProjects).catch(() => setProjects([]));
  }, []);

  return (
    <TableShell
      title="Объекты"
      subtitle="Объекты становятся главной точкой входа: внутри каждого видны сметы и закупки"
      columns={['Название', 'Код', 'Адрес', 'Статус', 'Закупки', 'Карточка']}
      rows={projects.map((project) => [
        project.name,
        project.code,
        project.address,
        translateProjectStatus(project.status),
        project.purchaseTotal,
        <Link key={`project-${project.id}`} className="primary-button" to={`/projects/${project.id}`}>Открыть</Link>,
      ])}
    />
  );
}
