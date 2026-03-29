import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Music, Mic2, BarChart3, BadgeCheck, Clock, CheckCircle, X } from 'lucide-react';
import { setVerifyStatus } from '../store/authSlice';
import { showToast } from '../store/uiSlice';
import { requestArtistVerify } from '../services/UserService';
import { VERIFY_STATUS, CATEGORIES } from '../constants/enums';
import ErrorMessage from '../components/ui/ErrorMessage';

const BENEFITS = [
  { icon: Music, text: 'Upload nhạc của bạn lên nền tảng' },
  { icon: Mic2, text: 'Trang nghệ sĩ riêng với hồ sơ chuyên nghiệp' },
  { icon: BarChart3, text: 'Thống kê lượt nghe nhạc chi tiết' },
  { icon: BadgeCheck, text: 'Tick xanh xác minh nghệ sĩ chính thức' },
];

export default function ArtistVerifyPage() {
  const dispatch = useDispatch();
  const { verifyStatus } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ artistName: '', bio: '', profileLink: '' });
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.artistName.trim() || !formData.bio.trim() || selectedGenres.length === 0) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestArtistVerify({
        stageName: formData.artistName,
        bio: formData.bio,
        photoUrl: formData.profileLink || null,
        genres: selectedGenres,
      });
      if (result.success) {
        dispatch(setVerifyStatus({ status: VERIFY_STATUS.PENDING }));
        dispatch(showToast({ message: 'Yêu cầu đã được gửi thành công!', type: 'success' }));
      } else {
        setError(result.message || 'Có lỗi xảy ra');
      }
    } catch {
      setError('Không thể gửi yêu cầu. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Pending state
  if (verifyStatus === VERIFY_STATUS.PENDING) {
    return (
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <div className="rounded-xl bg-yellow-900/30 border border-yellow-700/50 p-6 flex items-center gap-4">
          <Clock size={32} className="text-yellow-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-200">Đang chờ admin duyệt...</h3>
            <p className="text-sm text-yellow-300/70 mt-1">Yêu cầu xác minh nghệ sĩ của bạn đang được xem xét. Chúng tôi sẽ thông báo khi có kết quả.</p>
          </div>
        </div>
      </div>
    );
  }

  // Approved state
  if (verifyStatus === VERIFY_STATUS.APPROVED) {
    return (
      <div className="max-w-2xl mx-auto mt-12 px-4">
        <div className="rounded-xl bg-green-900/30 border border-green-700/50 p-6 flex items-center gap-4">
          <CheckCircle size={32} className="text-green-400 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-green-200">Tài khoản nghệ sĩ đã được xác minh</h3>
            <p className="text-sm text-green-300/70 mt-1">Bạn có thể bắt đầu upload nhạc và quản lý trang nghệ sĩ.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-8">Trở thành nghệ sĩ được xác minh</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Cột trái: Benefits */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Quyền lợi nghệ sĩ</h2>
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50">
              <Icon size={24} className="text-green-400 flex-shrink-0" />
              <span className="text-sm text-neutral-200">{text}</span>
            </div>
          ))}
        </div>

        {/* Cột phải: Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-300 mb-1">Tên nghệ sĩ *</label>
            <input
              type="text"
              name="artistName"
              value={formData.artistName}
              onChange={handleChange}
              className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
              placeholder="Tên nghệ sĩ của bạn"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">Bio *</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none resize-none focus:ring-1 focus:ring-green-500"
              placeholder="Giới thiệu ngắn về bạn..."
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-2">Genre nhạc chính *</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(({ id, name }) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer bg-neutral-800 px-3 py-2 rounded-lg hover:bg-neutral-700 transition">
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(id)}
                    onChange={(e) =>
                      setSelectedGenres((prev) =>
                        e.target.checked ? [...prev, id] : prev.filter((g) => g !== id)
                      )
                    }
                    className="accent-green-500"
                  />
                  <span className="text-sm text-white">{name}</span>
                </label>
              ))}
            </div>
            {selectedGenres.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedGenres.map((id) => (
                  <span key={id} className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                    {CATEGORIES.find((c) => c.id === id)?.name}
                    <button
                      type="button"
                      onClick={() => setSelectedGenres((prev) => prev.filter((g) => g !== id))}
                      className="hover:text-green-200"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">Link profile (Spotify/SoundCloud)</label>
            <input
              type="url"
              name="profileLink"
              value={formData.profileLink}
              onChange={handleChange}
              className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
              placeholder="https://..."
            />
          </div>

          {error && <ErrorMessage message={error} onRetry={handleSubmit} />}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-500 text-black font-semibold py-2.5 rounded-full hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            )}
            {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu xác minh'}
          </button>
        </form>
      </div>
    </div>
  );
}
