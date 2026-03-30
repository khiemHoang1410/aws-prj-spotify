import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { getArtistRequests, approveArtistTick, rejectArtistTick } from '../../services/AdminService';
import { VERIFY_STATUS } from '../../constants/enums';

const STATUS_BADGE = {
  [VERIFY_STATUS.PENDING]: 'bg-yellow-900/50 text-yellow-300',
  [VERIFY_STATUS.APPROVED]: 'bg-green-900/50 text-green-300',
  [VERIFY_STATUS.REJECTED]: 'bg-red-900/50 text-red-300',
};

export default function AdminArtistRequests() {
  const dispatch = useDispatch();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    getArtistRequests().then(setRequests);
  }, []);

  const handleApprove = async (req) => {
    try {
      await approveArtistTick(req.id);
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: VERIFY_STATUS.APPROVED } : r))
      );
      dispatch(showToast({ message: `Đã duyệt nghệ sĩ ${req.stageName || req.name}`, type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi duyệt', type: 'error' }));
    }
  };

  const handleReject = async (req) => {
    try {
      await rejectArtistTick(req.id);
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: VERIFY_STATUS.REJECTED } : r))
      );
      dispatch(showToast({ message: `Đã từ chối yêu cầu của ${req.stageName || req.name}`, type: 'warning' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi từ chối', type: 'error' }));
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Yêu cầu xác minh nghệ sĩ</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-neutral-400 border-b border-neutral-700">
            <tr>
              <th className="px-4 py-3">Tên</th>
              <th className="px-4 py-3">Genre</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Ngày gửi</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-b border-neutral-800 text-neutral-200">
                <td className="px-4 py-3 font-medium">{req.name}</td>
                <td className="px-4 py-3">{req.genre}</td>
                <td className="px-4 py-3">
                  <a href={req.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate block max-w-[160px]">
                    {req.link}
                  </a>
                </td>
                <td className="px-4 py-3 text-neutral-400">{req.submittedAt}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[req.status] || 'bg-neutral-700 text-neutral-300'}`}>
                    {req.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {req.status === VERIFY_STATUS.PENDING && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(req)}
                        className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-500 transition"
                      >
                        Duyệt
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        className="px-3 py-1 text-xs font-medium text-red-400 border border-red-800 rounded hover:bg-red-900/30 transition"
                      >
                        Từ chối
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
