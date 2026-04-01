import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { loginSuccess } from '../store/authSlice';
import { login } from '../services/AuthService';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      dispatch(loginSuccess(user));
      const nextPath = location.state?.from?.pathname || '/';
      navigate(nextPath, { replace: true });
    } catch (err) {
      setError(err?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#121212] border border-[#282828] rounded-xl p-8">
        <h1 className="text-3xl font-bold text-white text-center mb-8">Đăng nhập vào Spotify</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-white block mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition"
              placeholder="Email của bạn"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-white block mb-2">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition"
              placeholder="Mật khẩu"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-green-500 text-black font-bold p-3 rounded-full hover:scale-105 transition disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-[#b3b3b3] mt-6 text-sm">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-white font-semibold hover:text-green-400 transition">
            Đăng ký
          </Link>
        </p>
      </div>
    </div>
  );
}
