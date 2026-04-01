import React, { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { getArtistRequests, approveArtistTick, rejectArtistTick } from '../../services/AdminService';
import { VERIFY_STATUS } from '../../constants/enums';
import useAdminTable from '../../hooks/useAdminTable';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminSearchFilter from '../../components/admin/AdminSearchFilter';

const STATUS_BADGE = {
  [VERIFY_STATUS.PENDING]: 'bg-yellow-900/50 text-yellow-300',
  [VERIFY_STATUS.APPROVED]: 'bg-green-900/50 text-green-300',
  [VERIFY_STATUS.REJECTED]: 'bg-red-900/50 text-red-300',
};

export default function AdminArtistRequests() {
  const dispatch = useDispatch();
  const table = useAdminTable(getArtistRequests, {});

  const handleApprove = async (req) => {
    try {
      await approveArtistTick(req.id);
      table.updateItem(req.id, { status: VERIFY_STATUS.APPROVED });
      dispatch(showToast({ message: `Đã duyệt nghệ sĩ ${req.stageName || req.name}`, type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi duyệt', type: 'error' }));
    }
  };

  const handleReject = async (req) => {
    try {
      await rejectArtistTick(req.id);
      table.updateItem(req.id, { status: VERIFY_STATUS.REJECTED });
      dispatch(showToast({ message: `Đã từ chối yêu cầu của ${req.stageName || req.name}`, type: 'warning' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi từ chối', type: 'error' }));
    }
  };

  // Client-side search filter by stageName
  const [searchText, setSearchText] = React.useState('');
  const filteredItems = useMemo(() => {
    if (!searchText) return table.items;
    const q = searchText.toLowerCase();
    return table.items.filter((r) =>
      (r.name || r.stageName || '').toLowerCase().includes(q)
    );
  }, [table.items, searchText]);

  const columns = [
    { key: 'name', label: 'Tên', sortable: true },
    { key: 'genre', label: 'Genre' },
    {
      key: 'link',
      label: 'Link',
      render: (row) =>
        row.link ? (
          <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block max-w-[160px]">
            {row.link}
          </a>
        ) : '—',
    },
    { key: 'submittedAt', label: 'Ngày gửi', sortable: true },
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
        row.status === VERIFY_STATUS.PENDING ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleApprove(row)}
              className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-500 transition"
            >
              Duyệt
            </button>
            <button
              onClick={() => handleReject(row)}
              className="px-3 py-1 text-xs font-medium text-red-400 border border-red-800 rounded hover:bg-red-900/30 transition"
            >
              Từ chối
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
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Yêu cầu xác minh nghệ sĩ</h1>

      <AdminSearchFilter
        searchPlaceholder="Tìm theo tên nghệ sĩ..."
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
        emptyMessage="Không có yêu cầu nào"
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
