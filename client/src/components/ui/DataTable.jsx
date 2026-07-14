import { classNames } from './classNames';

export default function DataTable({
  columns = [],
  rows = [],
  getRowKey,
  emptyState,
  className = '',
}) {
  if (rows.length === 0 && emptyState) {
    return emptyState;
  }

  return (
    <div className="overflow-x-auto">
      <table className={classNames('mc-data-table', className)}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key || column.header}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={getRowKey ? getRowKey(row, rowIndex) : row.id || row._id || rowIndex}>
              {columns.map((column) => (
                <td key={column.key || column.header}>
                  {column.render ? column.render(row, rowIndex) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
