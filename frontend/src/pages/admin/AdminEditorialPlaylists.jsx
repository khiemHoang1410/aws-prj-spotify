import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import {
  getEditorialPlaylists,
  createEditorialPlaylist,
  updateEditorialPlaylist,
  deleteEditorialPlaylist,
  publishEditorialPlaylist,
  unpublishEditorialPlaylist,
} from '../../services/AdminService';
import useAdminTable from '../../hooks/useAdminTable';
import AdminTable from '../../components/admin/AdminTable';
import AdminPagination from '../../components/admin/AdminPagination';
import EditorialPlaylistForm from '../../components/admin/EditorialPlaylistForm';
import EditorialSongManager from '../../components/admin/EditorialSongManager';

export default function AdminEditorialPlaylists() {
  const dispatch = useDispatch();
  const table = useAdminTable(getEditorialPlaylists, {});

  // modal: null | 'create' | 'edit' | 'songs'
  const [modal, setModal] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const handleCreate = async (data) => {
    try {
      await createEditorialPlaylist(data);
      setModal(null);
      table.reload();
      dispatch(showToast({ message: 'Đã tạo playlist', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi tạo playlist', type: 'error' }));
    }
  };

  const handleEdit = async (data) => {
    try {
      const updated = await updateEditorialPlaylist(selectedRow.id, data);
      table.updateItem(selectedRow.id, updated ?? data);
      setModal(null);
      setSelectedRow(null);
      dispatch(showToast({ message: 'Đã cập nhật playlist', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi cập nhật playlist', type: 'error' }));
    }
  };

  const handleTogglePublish = async (row) => {
    try {
      if (row.status === 'published') {
        await unpublishEditorialPlaylist(row.id);
        table.updateItem(row.id, { status: 'draft' });
        dispatch(showToast({ message: 'Đã chuyển về draft', type: 'success' }));
      } else {
        await publishEditorialPlaylist(row.id);
        table.updateItem(row.id, { status: 'published' });
        dispatch(showToast({ message: 'Đã publish playlist', type: 'success' }));
      }
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi thay đổi trạng thái', type: 'error' }));
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa playlist "${row.name}"?`)) return;
    try {
      await deleteEditorialPlaylist(row.id);
      table.removeItem(row.id);
      dispatch(showToast({ message: `Đã xóa "${row.name}"`, type: 'warning' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi xóa playlist', type: 'error' }));
    }
  };

  const columns = [
    { key: 'name', label: 'Tên playlist', sortable: true },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row) =>
        row.status === 'published' ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
            Published
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-600/50 text-neutral-400">
            Draft
          </span>
        ),
    },
    {
      key: 'songCount',
      label: 'Số bài',
      render: (row) => row.songCount ?? 0,
    },
    {
      key: 'createdAt',
      label: 'Ngày tạo',
      sortable: true,
      render: (row) => (row.createdAt ? row.createdAt.slice(0, 10) : '—'),
    },
    {
      key: 'actions',
      label: 'Hành động',
      render: (row) => (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => { setSelectedRow(row); setModal('edit'); }}
            className="px-3 py-1 text-xs font-medium text-blue-400 border border-blue-800 rounded hover:bg-blue-900/30 transition"
          >
            Sửa
          </button>
          <button
            onClick={() => handleTogglePublish(row)}
            className={`px-3 py-1 text-xs font-medium border rounded transition ${
              row.status === 'published'
                ? 'text-yellow-400 border-yellow-800 hover:bg-yellow-900/30'
                : 'text-green-400 border-green-800 hover:bg-green-900/30'
            }`}
          >
            {row.status === 'published' ? 'Unpublish' : 'Publish'}
          </button>
          <button
            onClick={() => { setSelectedRow(row); setModal('songs'); }}
            className="px-3 py-1 text-xs font-medium text-purple-400 border border-purple-800 rounded hover:bg-purple-900/30 transition"
          >
            Bài hát
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="px-3 py-1 text-xs font-medium text-red-400 border border-red-800 rounded hover:bg-red-900/30 transition"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Editorial Playlists</h1>
        <button
          onClick={() => { setSelectedRow(null); setModal('create'); }}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 transition"
        >
          + Tạo playlist
        </button>
      </div>

      <AdminTable
        columns={columns}
        rows={table.items}
        loading={table.loading}
        error={table.error}
        emptyMessage="Không có playlist nào"
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

      {(modal === 'create' || modal === 'edit') && (
        <EditorialPlaylistForm
          initialValues={modal === 'edit' ? selectedRow : {}}
          onSubmit={modal === 'edit' ? handleEdit : handleCreate}
          onClose={() => { setModal(null); setSelectedRow(null); }}
        />
      )}

      {modal === 'songs' && selectedRow && (
        <EditorialSongManager
          playlistId={selectedRow.id}
          onClose={() => { setModal(null); setSelectedRow(null); }}
        />
      )}
    </div>
  );
}
