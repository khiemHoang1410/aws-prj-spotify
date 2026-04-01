import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { getUsers, banUser, unbanUser, changeUserRole } from '../../services/AdminService';
import { ROLES } from '../../constants/enums';
import useAdminTable from '../../hooks/useAdminTable';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import AdminSearchFilter from '../../components/admin/AdminSearchFilter';
import AdminUserDetail from './AdminUserDetail';

const ROLE_BADGE = {
  listener: 'bg-blue-900/50 text-blue-300',
  artist: 'bg-purple-900/50 text-purple-300',
  admin: 'bg-red-900/50 text-red-300',
};

export default function AdminUsers() {
  const dispatch = useDispatch();
  const [selectedUser, setSelectedUser] = useState(null);
  const table = useAdminTable(getUsers, {});

  const handleBan = async (user) => {
    try {
      await banUser(user.id);
      table.updateItem(user.id, { isBanned: true });
      dispatch(showToast({ message: `Đã ban ${user.displayName}`, type: 'warning' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi ban user', type: 'error' }));
    }
  };

  const handleUnban = async (user) => {
    try {
      await unbanUser(user.id);
      table.updateItem(user.id, { isBanned: false });
      dispatch(showToast({ message: `Đã unban ${user.displayName}`, type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi unban user', type: 'error' }));
    }
  };

  const handleRoleChange = async (user, newRole) => {
    try {
      await changeUserRole(user.id, newRole);
      table.updateItem(user.id, { role: newRole });
      dispatch(showToast({ message: `Đã đổi role ${user.displayName} thành ${newRole}`, type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi đổi role', type: 'error' }));
    }
  };

  const columns = [
    { key: 'displayName', label: 'Tên', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[row.role] || 'bg-neutral-700'}`}>
          {row.role}
        </span>
      ),
    },
    {
      key: 'isBanned',
      label: 'Trạng thái',
      render: (row) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.isBanned ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
          {row.isBanned ? 'Banned' : 'Active'}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Ngày tạo', sortable: true },
    {
      key: 'actions',
      label: 'Hành động',
      render: (row) => (
        <div className="flex gap-2">
          {row.role !== ROLES.ADMIN && (
            <>
              {row.isBanned ? (
                <button
                  onClick={() => handleUnban(row)}
                  className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-500 transition"
                >
                  Unban
                </button>
              ) : (
                <button
                  onClick={() => handleBan(row)}
                  className="px-3 py-1 text-xs font-medium text-red-400 border border-red-800 rounded hover:bg-red-900/30 transition"
                >
                  Ban
                </button>
              )}
              <select
                value={row.role}
                onChange={(e) => handleRoleChange(row, e.target.value)}
                className="px-2 py-1 text-xs bg-neutral-700 border border-neutral-600 rounded text-white focus:outline-none"
              >
                <option value="listener">Listener</option>
                <option value="artist">Artist</option>
              </select>
              <button
                onClick={() => setSelectedUser(row)}
                className="px-3 py-1 text-xs font-medium text-blue-400 border border-blue-800 rounded hover:bg-blue-900/30 transition"
              >
                Chi tiết
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: 'role',
      label: 'Tất cả roles',
      options: [
        { value: 'listener', label: 'Listener' },
        { value: 'artist', label: 'Artist' },
        { value: 'admin', label: 'Admin' },
      ],
    },
    {
      key: 'status',
      label: 'Tất cả trạng thái',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'banned', label: 'Banned' },
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Quản lý người dùng</h1>

      <AdminSearchFilter
        searchPlaceholder="Tìm theo tên hoặc email..."
        filters={filters}
        onChange={table.setParams}
      />

      <AdminTable
        columns={columns}
        rows={table.items}
        loading={table.loading}
        error={table.error}
        emptyMessage="Không có user nào"
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

      {selectedUser && (
        <AdminUserDetail user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
    </div>
  );
}
