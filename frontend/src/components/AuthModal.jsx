import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeModal, loginSuccess, openModal } from '../store/authSlice';
import { login, register } from '../services/AuthService';
import { X } from 'lucide-react';

export default function AuthModal() {
  const dispatch = useDispatch();
  const { isModalOpen, modalType } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isModalOpen) return null;

  const isLogin = modalType === 'login';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let userData;
      if (isLogin) {
        userData = await login(formData.email, formData.password);
      } else {
        userData = await register(formData.username, formData.email, formData.password);
      }
      // Bắn data lên Redux
      dispatch(loginSuccess(userData));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Lớp overlay làm tối màn hình nền
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      
      {/* Khối Modal chính */}
      <div className="bg-[#121212] w-full max-w-md rounded-xl p-8 relative shadow-2xl border border-[#282828]">
        
        {/* Nút đóng */}
        <button 
          className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white"
          onClick={() => dispatch(closeModal())}
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-white text-center mb-8">
          {isLogin ? 'Đăng nhập vào Spotify' : 'Đăng ký nhận nhạc miễn phí'}
        </h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 text-sm p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            <label className="text-sm font-bold text-white">Email hoặc tên người dùng</label>
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

          <button 
            type="submit" 
            disabled={loading}
            className="mt-4 bg-green-500 text-black font-bold p-3 rounded-full hover:scale-105 transition transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
          </button>
        </form>

        <div className="mt-8 text-center text-[#b3b3b3]">
          {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <span 
            className="text-white font-bold hover:underline cursor-pointer hover:text-green-500 transition"
            onClick={() => dispatch(openModal(isLogin ? 'register' : 'login'))}
          >
            {isLogin ? 'Đăng ký Spotify' : 'Đăng nhập tại đây'}
          </span>
        </div>

        {isLogin && (
          <p className="mt-4 text-center text-xs text-neutral-500">
            Test: user@test.com / artist@test.com / admin@test.com (mật khẩu tùy ý)
          </p>
        )}
      </div>
    </div>
  );
}