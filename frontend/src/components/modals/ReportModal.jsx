import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { closeReportModal, showToast } from '../../store/uiSlice';
import { reportSong } from '../../services/SongService';
import { REPORT_REASON } from '../../constants/enums';

const REASON_OPTIONS = [
  REPORT_REASON.INAPPROPRIATE,
  REPORT_REASON.COPYRIGHT,
  REPORT_REASON.SPAM,
  REPORT_REASON.OTHER,
];

export default function ReportModal() {
  const dispatch = useDispatch();
  const { reportTargetSong } = useSelector((state) => state.ui);

  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason || !reportTargetSong) return;
    setIsLoading(true);
    try {
      await reportSong(reportTargetSong.song_id, reason, description);
      dispatch(showToast({ message: 'Báo cáo đã được gửi. Cảm ơn bạn!', type: 'success' }));
      dispatch(closeReportModal());
    } finally {
      setIsLoading(false);
    }
  };

  if (!reportTargetSong) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="w-full max-w-md bg-neutral-900 rounded-xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Báo cáo bài hát</h2>
            <p className="text-sm text-neutral-400 truncate">{reportTargetSong.title}</p>
          </div>
          <button
            onClick={() => dispatch(closeReportModal())}
            className="text-neutral-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Select reason */}
        <label className="block text-sm text-neutral-300 mb-1">Lý do báo cáo</label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 mb-4 text-sm outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="">-- Chọn lý do --</option>
          {REASON_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Description */}
        <label className="block text-sm text-neutral-300 mb-1">Mô tả thêm (tuỳ chọn)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 mb-4 text-sm outline-none resize-none focus:ring-1 focus:ring-green-500"
          placeholder="Thêm mô tả nếu cần..."
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => dispatch(closeReportModal())}
            className="px-4 py-2 text-sm text-neutral-300 hover:text-white transition rounded-full"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={!reason || isLoading}
            className="px-5 py-2 text-sm font-semibold bg-green-500 text-black rounded-full hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
}
