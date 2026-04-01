import React from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, RefreshCw } from 'lucide-react';

/**
 * AdminTable — generic table shell for all admin pages
 *
 * Props:
 * - columns: [{ key, label, sortable?, render? }]
 * - rows: array of data objects
 * - loading: bool
 * - error: string | null
 * - emptyMessage: string
 * - onRetry: fn
 * - sort: { column, direction, toggle }
 * - selection: { selectedIds, toggleRow, toggleAll, allSelected } | null
 */
export default function AdminTable({
  columns = [],
  rows = [],
  loading = false,
  error = null,
  emptyMessage = 'Không có dữ liệu',
  onRetry,
  sort,
  selection,
}) {
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-neutral-400 gap-3">
        <p className="text-red-400">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition"
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        )}
      </div>
    );
  }

  const SortIcon = ({ col }) => {
    if (!sort) return null;
    if (sort.column !== col) return <ChevronsUpDown size={13} className="text-neutral-500" />;
    return sort.direction === 'asc'
      ? <ChevronUp size={13} className="text-white" />
      : <ChevronDown size={13} className="text-white" />;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-neutral-400 border-b border-neutral-700">
          <tr>
            {selection && (
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selection.allSelected}
                  onChange={selection.toggleAll}
                  className="accent-green-500 cursor-pointer"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 ${col.sortable && sort ? 'cursor-pointer select-none hover:text-white' : ''}`}
                onClick={col.sortable && sort ? () => sort.toggle(col.key) : undefined}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && <SortIcon col={col.key} />}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-800">
                  {selection && <td className="px-4 py-3"><div className="h-4 w-4 bg-neutral-700 rounded animate-pulse" /></td>}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 bg-neutral-700 rounded animate-pulse" style={{ width: `${60 + Math.random() * 30}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.length === 0
            ? (
                <tr>
                  <td colSpan={columns.length + (selection ? 1 : 0)} className="px-4 py-12 text-center text-neutral-500">
                    {emptyMessage}
                  </td>
                </tr>
              )
            : rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-800 text-neutral-200 hover:bg-neutral-800/40 transition">
                  {selection && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selection.selectedIds.has(row.id)}
                        onChange={() => selection.toggleRow(row.id)}
                        className="accent-green-500 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row) : (row[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
