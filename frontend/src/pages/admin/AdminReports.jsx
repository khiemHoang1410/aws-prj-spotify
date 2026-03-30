import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../store/uiSlice';
import { getReports, resolveReport, removeSong } from '../../services/AdminService';
import { REPORT_STATUS } from '../../constants/enums';

const STATUS_BADGE = {
  [REPORT_STATUS.PENDING]: 'bg-yellow-900/50 text-yellow-300',
  [REPORT_STATUS.RESOLVED]: 'bg-green-900/50 text-green-300',
};

export default function AdminReports() {
  const dispatch = useDispatch();
  const [reports, setReports] = useState([]);

  useEffect(() => {
    getReports().then(setReports);
  }, []);

  const handleResolve = async (report) => {
    try {
      await resolveReport(report.id);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: REPORT_STATUS.RESOLVED } : r))
      );
      dispatch(showToast({ message: 'Báo cáo đã được giải quyết', type: 'success' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi giải quyết báo cáo', type: 'error' }));
    }
  };

  const handleRemove = async (report) => {
    try {
      await removeSong(report.songId);
      setReports((prev) =>
        prev.map((r) => (r.id === report.id ? { ...r, status: REPORT_STATUS.RESOLVED } : r))
      );
      dispatch(showToast({ message: `Đã gỡ bài hát "${report.songTitle}"`, type: 'warning' }));
    } catch (err) {
      dispatch(showToast({ message: err?.message || 'Lỗi khi gỡ bài hát', type: 'error' }));
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Báo cáo bài hát</h1>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-neutral-400 border-b border-neutral-700">
            <tr>
              <th className="px-4 py-3">Bài hát</th>
              <th className="px-4 py-3">Người báo cáo</th>
              <th className="px-4 py-3">Lý do</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id} className="border-b border-neutral-800 text-neutral-200">
                <td className="px-4 py-3 font-medium">{report.songTitle}</td>
                <td className="px-4 py-3 text-neutral-400">{report.reporter}</td>
                <td className="px-4 py-3">{report.reason}</td>
                <td className="px-4 py-3 text-neutral-400">{report.submittedAt}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[report.status] || 'bg-neutral-700 text-neutral-300'}`}>
                    {report.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {report.status === REPORT_STATUS.PENDING && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResolve(report)}
                        className="px-3 py-1 text-xs font-medium bg-green-600 text-white rounded hover:bg-green-500 transition"
                      >
                        Giải quyết
                      </button>
                      <button
                        onClick={() => handleRemove(report)}
                        className="px-3 py-1 text-xs font-medium text-red-400 border border-red-800 rounded hover:bg-red-900/30 transition"
                      >
                        Gỡ bài
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
