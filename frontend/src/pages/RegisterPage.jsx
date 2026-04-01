import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { loginSuccess } from '../store/authSlice';
import { register, confirmRegister, login } from '../services/AuthService';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [pendingEmail, setPendingEmail] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const isConfirmStep = !!pendingEmail;

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isConfirmStep) {
        try {
          await confirmRegister(pendingEmail, confirmCode);
        } catch (err) {
          if (!err?.message?.includes('CONFIRMED')) throw err;
        }
        const user = await login(pendingEmail, formData.password);
        dispatch(loginSuccess(user));
        navigate('/', { replace: true });
        return;
      }

      await register(formData.username, formData.email, formData.password);
      setPendingEmail(formData.email);
    } catch (err) {
      setError(err?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#121212] border border-[#282828] rounded-xl p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          {isConfirmStep ? 'Xác nhận email' : 'Đăng ký nhận nhạc miễn phí'}
        </h1>

        {isConfirmStep && (
          <p className="text-[#b3b3b3] text-sm text-center mb-4">
            Mã xác nhận đã được gửi đến <span className="text-white">{pendingEmail}</span>
          </p>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isConfirmStep ? (
            <div>
              <label className="text-sm font-semibold text-white block mb-2">Mã xác nhận (OTP)</label>
              <input
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                required
                maxLength={6}
                className="w-full bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-semibold text-white block mb-2">Tên hiển thị</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition"
                  placeholder="Nhập tên của bạn"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white block mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition"
                  placeholder="Email của bạn"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-white block mb-2">Mật khẩu</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition"
                  placeholder="Mật khẩu"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-green-500 text-black font-bold p-3 rounded-full hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Đang xử lý...' : isConfirmStep ? 'Xác nhận' : 'Đăng ký'}
          </button>
        </form>

        {!isConfirmStep && (
          <p className="text-center text-[#b3b3b3] mt-6 text-sm">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-white font-semibold hover:text-green-400 transition">
              Đăng nhập
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
