import React from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { getSongs, removeSong, bulkDeleteSongs } from '../../services/AdminService';
import useAdminTable from '../../hooks/useAdminTable';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminSearchFilter from '../../components/admin/AdminSearchFilter';
import AdminBulkToolbar from '../../components/admin/AdminBulkToolbar';
import { formatDateTime } from '../../utils/formatDate';

function formatDuration(seconds) {
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const GENRE_LABELS = {
  vpop: 'V-Pop', pop: 'Pop', kpop: 'K-Pop', ballad: 'Ballad',
  rap: 'Rap/Hip-Hop', indie: 'Indie', rnb: 'R&B', edm: 'EDM',
};

export default function AdminSongs() {
  const dispatch = useDispatch();
  const table = useAdminTable(getSongs, {});

  const handleDelete = async (song) => {
    try {
      await removeSong(song.id);
      table.removeItem(song.id);
      dispatch(showToast({ message: `Đã xóa "${song.title}"`, type: 'warning' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi xóa bài hát', type: 'error' }));
    }
  };

  const handleBulkDelete = async () => {
    const ids = [...table.selection.selectedIds];
    try {
      const result = await bulkDeleteSongs(ids);
      ids.forEach((id) => table.removeItem(id));
      table.selection.clearSelection();
      if (result.failed > 0) {
        dispatch(showToast({ message: `${result.succeeded} thành công, ${result.failed} thất bại`, type: 'warning' }));
      } else {
        dispatch(showToast({ message: `Đã xóa ${result.succeeded} bài hát`, type: 'success' }));
      }
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi bulk delete', type: 'error' }));
    }
  };

  const columns = [
    { key: 'title', label: 'Tên bài hát', sortable: true },
    { key: 'artistName', label: 'Nghệ sĩ', sortable: true },
    {
      key: 'genre',
      label: 'Thể loại',
      render: (row) => row.genre
        ? <span className="px-2 py-0.5 rounded-full text-xs bg-neutral-700 text-neutral-200">{GENRE_LABELS[row.genre] || row.genre}</span>
        : <span className="text-xs text-neutral-500 italic">Chưa có</span>,
    },
    { key: 'duration', label: 'Thời lượng', render: (row) => formatDuration(row.duration) },
    { key: 'playCount', label: 'Lượt nghe', sortable: true, render: (row) => (row.playCount ?? 0).toLocaleString() },
    { key: 'createdAt', label: 'Ngày tạo', sortable: true, render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      label: 'Hành động',
      render: (row) => (
        <button
          onClick={() => handleDelete(row)}
          className="px-3 py-1 text-xs font-medium text-red-400 border border-red-800 rounded hover:bg-red-900/30 transition"
        >
          Xóa
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Quản lý bài hát</h1>

      <AdminSearchFilter
        searchPlaceholder="Tìm theo tên bài hát..."
        filters={[]}
        onChange={table.setParams}
      />

      <AdminBulkToolbar
        count={table.selection.selectedIds.size}
        actions={[{ label: 'Xóa đã chọn', onClick: handleBulkDelete, variant: 'danger' }]}
        onClear={table.selection.clearSelection}
      />

      <AdminTable
        columns={columns}
        rows={table.items}
        loading={table.loading}
        error={table.error}
        emptyMessage="Không có bài hát nào"
        onRetry={table.reload}
        sort={table.sort}
        selection={table.selection}
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
