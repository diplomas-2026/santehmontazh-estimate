export function TableShell({ title, subtitle, columns, rows }) {
  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Рабочий раздел</p>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
        </div>
      </div>

      <div className="page-card table-card">
        <table>
          <thead>
            <tr>
              {columns.map((column) => <th key={column}>{column}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${title}-${index + 1}`}>
                {row.map((cell, cellIndex) => <td key={`${title}-${index + 1}-${cellIndex + 1}`}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
