import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { getCategories } from '../../services/CategoryService';
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/CategoryAdminService';

const EMPTY_FORM = { id: '', name: '', color: '', imageUrl: '' };

export default function AdminCategories() {
  const dispatch = useDispatch();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // modal: null | 'create' | 'edit'
  const [modal, setModal] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError(err?.message || 'Không thể tải danh sách thể loại');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setSelectedRow(null);
    setModal('create');
  };

  const openEdit = (row) => {
    setForm({
      id: row.id || '',
      name: row.name || '',
      color: row.color || '',
      imageUrl: row.img || '',
    });
    setSelectedRow(row);
    setModal('edit');
  };

  const closeModal = () => {
    setModal(null);
    setSelectedRow(null);
    setForm(EMPTY_FORM);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createCategory({
        id: form.id.trim(),
        name: form.name.trim(),
        color: form.color.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
      });
      closeModal();
      await fetchCategories();
      dispatch(showToast({ message: 'Đã tạo thể loại', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi tạo thể loại', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateCategory(selectedRow.id, {
        name: form.name.trim(),
        color: form.color.trim(),
        imageUrl: form.imageUrl.trim() || undefined,
      });
      closeModal();
      await fetchCategories();
      dispatch(showToast({ message: 'Đã cập nhật thể loại', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi cập nhật thể loại', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Xóa thể loại "${row.name}"?`)) return;
    try {
      await deleteCategory(row.id);
      setCategories((prev) => prev.filter((c) => c.id !== row.id));
      dispatch(showToast({ message: `Đã xóa "${row.name}"`, type: 'warning' }));
    } catch (err) {
      if (err?.status === 409) {
        dispatch(showToast({ message: 'Không thể xóa thể loại đang có bài hát', type: 'error' }));
      } else {
        dispatch(showToast({ message: err?.message || 'Lỗi khi xóa thể loại', type: 'error' }));
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Thể loại</h1>
        <button
          onClick={openCreate}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 transition"
        >
          + Tạo thể loại
        </button>
      </div>

      {loading && (
        <p className="text-neutral-400 text-sm">Đang tải...</p>
      )}

      {error && !loading && (
        <div className="text-red-400 text-sm mb-4">
          {error}{' '}
          <button onClick={fetchCategories} className="underline hover:text-red-300">
            Thử lại
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-800 text-neutral-400 uppercase text-xs">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Màu</th>
                <th className="px-4 py-3">Số bài</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-500">
                    Không có thể loại nào
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="bg-neutral-900 hover:bg-neutral-800/50 transition">
                    <td className="px-4 py-3 text-white font-medium">{cat.name}</td>
                    <td className="px-4 py-3">
                      <div
                        className={`w-8 h-8 rounded ${cat.color}`}
                        title={cat.color}
                      />
                    </td>
                    <td className="px-4 py-3 text-neutral-300">{cat.songCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="px-3 py-1 text-xs font-medium text-blue-400 border border-blue-800 rounded hover:bg-blue-900/30 transition"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(cat)}
                          className="px-3 py-1 text-xs font-medium text-red-400 border border-red-800 rounded hover:bg-red-900/30 transition"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4">
              {modal === 'create' ? 'Tạo thể loại mới' : `Sửa "${selectedRow?.name}"`}
            </h2>

            <form onSubmit={modal === 'create' ? handleCreate : handleEdit} className="space-y-4">
              {modal === 'create' && (
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">
                    Slug (ID) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    value={form.id}
                    onChange={handleFormChange}
                    required
                    placeholder="vpop"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Tên <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                  placeholder="V-Pop"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  Màu (Tailwind class) <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="color"
                    value={form.color}
                    onChange={handleFormChange}
                    required
                    placeholder="bg-red-500"
                    className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                  />
                  {form.color && (
                    <div className={`w-8 h-8 rounded flex-shrink-0 ${form.color}`} />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">
                  URL ảnh (tuỳ chọn)
                </label>
                <input
                  type="url"
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={handleFormChange}
                  placeholder="https://..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50 transition"
                >
                  {submitting ? 'Đang lưu...' : modal === 'create' ? 'Tạo' : 'Lưu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
