import React from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { getArtists, verifyArtist } from '../../services/AdminService';
import useAdminTable from '../../hooks/useAdminTable';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminSearchFilter from '../../components/admin/AdminSearchFilter';
import { formatDateTime } from '../../utils/formatDate';

export default function AdminArtists() {
  const dispatch = useDispatch();
  const table = useAdminTable(getArtists, {});

  const handleVerifyToggle = async (artist) => {
    const newValue = !artist.isVerified;
    try {
      await verifyArtist(artist.id, newValue);
      table.updateItem(artist.id, { isVerified: newValue });
      dispatch(showToast({
        message: newValue ? `Đã xác minh ${artist.name}` : `Đã bỏ xác minh ${artist.name}`,
        type: newValue ? 'success' : 'warning',
      }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi cập nhật xác minh', type: 'error' }));
    }
  };

  const columns = [
    { key: 'name', label: 'Tên nghệ sĩ', sortable: true },
    {
      key: 'isVerified',
      label: 'Xác minh',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.isVerified ? 'bg-green-900/50 text-green-300' : 'bg-neutral-700 text-neutral-400'}`}>
          {row.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
        </span>
      ),
    },
    { key: 'userEmail', label: 'Email tài khoản' },
    { key: 'createdAt', label: 'Ngày tạo', sortable: true, render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'actions',
      label: 'Hành động',
      render: (row) => (
        <button
          onClick={() => handleVerifyToggle(row)}
          className={`px-3 py-1 text-xs font-medium rounded transition ${
            row.isVerified
              ? 'text-yellow-400 border border-yellow-800 hover:bg-yellow-900/30'
              : 'bg-green-600 text-white hover:bg-green-500'
          }`}
        >
          {row.isVerified ? 'Bỏ xác minh' : 'Xác minh'}
        </button>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Quản lý nghệ sĩ</h1>

      <AdminSearchFilter
        searchPlaceholder="Tìm theo tên nghệ sĩ..."
        filters={[]}
        onChange={table.setParams}
      />

      <AdminTable
        columns={columns}
        rows={table.items}
        loading={table.loading}
        error={table.error}
        emptyMessage="Không có nghệ sĩ nào"
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
