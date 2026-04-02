import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * EditorialPlaylistForm — modal form for creating or editing an editorial playlist.
 *
 * Props:
 * - initialValues: { name, description, coverUrl } — pre-fills fields in edit mode
 * - onSubmit(data): called with { name, description, coverUrl } on valid submit
 * - onClose(): called when the modal should be dismissed
 */
export default function EditorialPlaylistForm({ initialValues = {}, onSubmit, onClose }) {
  const [name, setName] = useState(initialValues.name || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [coverUrl, setCoverUrl] = useState(initialValues.coverUrl || '');
  const [nameError, setNameError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Re-populate when initialValues changes (e.g. switching between edit targets)
  useEffect(() => {
    setName(initialValues.name || '');
    setDescription(initialValues.description || '');
    setCoverUrl(initialValues.coverUrl || '');
    setNameError('');
  }, [initialValues]);

  const validateName = (value) => {
    if (!value.trim()) return 'Tên không được để trống';
    if (value.length > 255) return 'Tên không được vượt quá 255 ký tự';
    return '';
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setNameError(validateName(val));
  };

  const isValid = !validateName(name);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateName(name);
    if (error) {
      setNameError(error);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        coverUrl: coverUrl.trim() || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const isEditMode = Boolean(initialValues.name);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg mx-4 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-700">
          <h2 className="text-lg font-semibold text-white">
            {isEditMode ? 'Chỉnh sửa playlist' : 'Tạo playlist mới'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-700 transition"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-6 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Tên playlist <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Nhập tên playlist..."
                maxLength={300}
                className={`w-full px-3 py-2 rounded-lg bg-neutral-800 border text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 transition ${
                  nameError
                    ? 'border-red-500 focus:ring-red-500/40'
                    : 'border-neutral-600 focus:ring-green-500/40 focus:border-green-500'
                }`}
              />
              {nameError && (
                <p className="mt-1.5 text-xs text-red-400">{nameError}</p>
              )}
              <p className="mt-1 text-xs text-neutral-500 text-right">{name.length}/255</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Mô tả <span className="text-neutral-500 font-normal">(tùy chọn)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả playlist..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-600 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition resize-none"
              />
            </div>

            {/* Cover URL */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                URL ảnh bìa <span className="text-neutral-500 font-normal">(tùy chọn)</span>
              </label>
              <input
                type="url"
                value={coverUrl}
                onChange={(e) => setCoverUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-600 text-white placeholder-neutral-500 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 transition"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-neutral-300 bg-neutral-800 border border-neutral-600 rounded-lg hover:bg-neutral-700 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {submitting ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Tạo playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
