import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, loginSuccess, openModal } from '../../store/authSlice';
import { login, register, confirmRegister } from '../../services/AuthService';
import { X } from 'lucide-react';

export default function AuthModal() {
  const dispatch = useDispatch();
  const { isModalOpen, modalType } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Bước confirm OTP sau khi register
  const [pendingEmail, setPendingEmail] = useState('');
  const [confirmCode, setConfirmCode] = useState('');

  if (!isModalOpen) return null;

  const isLogin = modalType === 'login';
  const isConfirm = !!pendingEmail;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isConfirm) {
        // Bước 2: xác nhận OTP
        try {
          await confirmRegister(pendingEmail, confirmCode);
        } catch (err) {
          // Nếu đã confirm rồi thì bỏ qua lỗi, login luôn
          if (!err.message?.includes('CONFIRMED')) throw err;
        }
        // Sau confirm tự động login
        const userData = await login(pendingEmail, formData.password);
        dispatch(loginSuccess(userData));
        setPendingEmail('');
      } else if (isLogin) {
        const userData = await login(formData.email, formData.password);
        dispatch(loginSuccess(userData));
      } else {
        // Bước 1: đăng ký → chờ OTP
        await register(formData.username, formData.email, formData.password);
        setPendingEmail(formData.email);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-[#121212] w-full max-w-md rounded-xl p-8 relative shadow-2xl border border-[#282828]">

        <button
          className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white"
          onClick={() => { dispatch(closeModal()); setPendingEmail(''); }}
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-white text-center mb-8">
          {isConfirm ? 'Xác nhận email' : isLogin ? 'Đăng nhập vào Spotify' : 'Đăng ký nhận nhạc miễn phí'}
        </h2>

        {isConfirm && (
          <p className="text-[#b3b3b3] text-sm text-center mb-4">
            Mã xác nhận đã được gửi đến <span className="text-white">{pendingEmail}</span>
          </p>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isConfirm ? (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-white">Mã xác nhận (OTP)</label>
              <input
                type="text" required maxLength={6}
                className="bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition text-center text-2xl tracking-widest"
                placeholder="000000"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
              />
            </div>
          ) : (
            <>
              {!isLogin && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-white">Tên hiển thị</label>
                  <input
                    type="text" name="username" required
                    className="bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition"
                    placeholder="Nhập tên của bạn"
                    onChange={handleChange}
                  />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white">Email</label>
                <input
                  type="email" name="email" required
                  className="bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition"
                  placeholder="Email của bạn"
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white">Mật khẩu</label>
                <input
                  type="password" name="password" required
                  className="bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition"
                  placeholder="Mật khẩu"
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 bg-green-500 text-black font-bold p-3 rounded-full hover:scale-105 transition transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Đang xử lý...' : isConfirm ? 'Xác nhận' : isLogin ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>

        {!isConfirm && (
          <div className="mt-8 text-center text-[#b3b3b3]">
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <span
              className="text-white font-bold hover:underline cursor-pointer hover:text-green-500 transition"
              onClick={() => { dispatch(openModal(isLogin ? 'register' : 'login')); setError(''); setPendingEmail(''); }}
            >
              {isLogin ? 'Đăng ký Spotify' : 'Đăng nhập tại đây'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
