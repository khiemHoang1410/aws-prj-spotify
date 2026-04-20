import { useRouteError, useNavigate } from 'react-router-dom';

export default function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();

  console.error('[RouteError] status:', error?.status, '| statusText:', error?.statusText, '| message:', error?.message, '| full:', error);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#121212] text-center px-4">
      <div className="text-5xl mb-4">😵</div>
      <h2 className="text-xl font-bold text-white mb-2">Có lỗi xảy ra</h2>
      <p className="text-neutral-400 text-sm mb-6 max-w-md">
        {error?.message || error?.statusText || 'Đã xảy ra lỗi không mong muốn.'}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 border border-neutral-600 text-neutral-300 font-semibold rounded-full hover:border-white hover:text-white transition"
        >
          Quay lại
        </button>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="px-6 py-2 bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition"
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
}
