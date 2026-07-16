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
    <div className="max-h-full overflow-x-auto">
      <table className={classNames('mc-data-table', className)}>
        <thead className="sticky top-0 z-10">
          <tr className="h-9">
            {columns.map((column) => (
              <th key={column.key || column.header} className="whitespace-nowrap py-2">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const isSelected = Boolean(row?.selected || row?.isSelected);

            return (
              <tr
                key={getRowKey ? getRowKey(row, rowIndex) : row.id || row._id || rowIndex}
                className={classNames(
                  'h-10 transition-colors hover:bg-slate-900/60',
                  isSelected && 'bg-cyan-950/20 ring-1 ring-inset ring-cyan-500/25',
                )}
                data-selected={isSelected || undefined}
              >
                {columns.map((column) => (
                  <td key={column.key || column.header} className="py-2">
                    {column.render ? column.render(row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
