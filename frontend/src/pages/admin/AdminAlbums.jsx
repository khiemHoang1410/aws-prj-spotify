import React from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { getAlbums, deleteAlbum } from '../../services/AdminService';
import useAdminTable from '../../hooks/useAdminTable';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminSearchFilter from '../../components/admin/AdminSearchFilter';
import { formatDate, formatDateTime } from '../../utils/formatDate';

export default function AdminAlbums() {
  const dispatch = useDispatch();
  const table = useAdminTable(getAlbums, {});

  const handleDelete = async (album) => {
    try {
      await deleteAlbum(album.id);
      table.removeItem(album.id);
      dispatch(showToast({ message: `Đã xóa album "${album.title}"`, type: 'warning' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi xóa album', type: 'error' }));
    }
  };

  const columns = [
    { key: 'title', label: 'Tên album', sortable: true },
    { key: 'artistName', label: 'Nghệ sĩ', sortable: true },
    { key: 'releaseDate', label: 'Ngày phát hành', sortable: true, render: (row) => formatDate(row.releaseDate) },
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
      <h1 className="text-xl font-bold text-white mb-6">Quản lý albums</h1>

      <AdminSearchFilter
        searchPlaceholder="Tìm theo tên album..."
        filters={[]}
        onChange={table.setParams}
      />

      <AdminTable
        columns={columns}
        rows={table.items}
        loading={table.loading}
        error={table.error}
        emptyMessage="Không có album nào"
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
