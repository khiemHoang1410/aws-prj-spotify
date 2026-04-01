import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { getReports, resolveReport, resolveAndRemoveSong } from '../../services/AdminService';
import { REPORT_STATUS } from '../../constants/enums';
import useAdminTable from '../../hooks/useAdminTable';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminSearchFilter from '../../components/admin/AdminSearchFilter';

const STATUS_BADGE = {
  [REPORT_STATUS.PENDING]: 'bg-yellow-900/50 text-yellow-300',
  [REPORT_STATUS.RESOLVED]: 'bg-green-900/50 text-green-300',
};

export default function AdminReports() {
  const dispatch = useDispatch();
  const table = useAdminTable(getReports, {});

  const handleResolve = async (report) => {
    try {
      await resolveReport(report.id);
      table.updateItem(report.id, { status: REPORT_STATUS.RESOLVED });
      dispatch(showToast({ message: 'Báo cáo đã được giải quyết', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi giải quyết báo cáo', type: 'error' }));
    }
  };

  const handleRemove = async (report) => {
    try {
      await resolveAndRemoveSong(report.id);
      table.updateItem(report.id, { status: REPORT_STATUS.RESOLVED });
      dispatch(showToast({ message: `Đã gỡ bài hát "${report.songTitle}"`, type: 'warning' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi gỡ bài hát', type: 'error' }));
    }
  };

  // Client-side search by songTitle or reporter
  const [searchText, setSearchText] = React.useState('');
  const filteredItems = useMemo(() => {
    if (!searchText) return table.items;
    const q = searchText.toLowerCase();
    return table.items.filter(
      (r) =>
        (r.songTitle || '').toLowerCase().includes(q) ||
        (r.reporter || '').toLowerCase().includes(q)
    );
  }, [table.items, searchText]);

  const columns = [
    { key: 'songTitle', label: 'Bài hát', sortable: true },
    { key: 'reporter', label: 'Người báo cáo' },
    { key: 'reason', label: 'Lý do' },
    { key: 'submittedAt', label: 'Ngày', sortable: true },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[row.status] || 'bg-neutral-700 text-neutral-300'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (row) =>
        row.status === REPORT_STATUS.PENDING ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleResolve(row)}
              className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-500 transition"
            >
              Giải quyết
            </button>
            <button
              onClick={() => handleRemove(row)}
              className="px-3 py-1 text-xs font-medium text-red-400 border border-red-800 rounded hover:bg-red-900/30 transition"
            >
              Gỡ bài
            </button>
          </div>
        ) : null,
    },
  ];

  const filters = [
    {
      key: 'status',
      label: 'Tất cả trạng thái',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'resolved', label: 'Resolved' },
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Báo cáo bài hát</h1>

      <AdminSearchFilter
        searchPlaceholder="Tìm theo bài hát hoặc người báo cáo..."
        filters={filters}
        onChange={({ search, ...rest }) => {
          setSearchText(search || '');
          table.setParams(rest);
        }}
      />

      <AdminTable
        columns={columns}
        rows={filteredItems}
        loading={table.loading}
        error={table.error}
        emptyMessage="Không có báo cáo nào"
        onRetry={table.reload}
        sort={table.sort}
      />

      <AdminPagination
        currentPage={table.currentPage}
        hasNext={table.pagination.hasNext}
        hasPrev={table.pagination.hasPrev}
        onNext={table.pagination.goNext}
        onPrev={table.pagination.goPrev}
      />
    </div>
  );
}
