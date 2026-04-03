import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { getUser } from '../../services/AdminService';

const ROLE_BADGE = {
  listener: 'bg-blue-900/50 text-blue-300',
  artist: 'bg-purple-900/50 text-purple-300',
  admin: 'bg-red-900/50 text-red-300',
};

export default function AdminUserDetail({ user, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getUser(user.id).then((data) => {
      setDetail(data);
      setLoading(false);
    });
  }, [user.id]);

  const retry = () => {
    setLoading(true);
    setDetail(null);
    getUser(user.id).then((data) => {
      setDetail(data);
      setLoading(false);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-bold text-white mb-4">Chi tiết người dùng</h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-5 bg-neutral-700 rounded animate-pulse" />
            ))}
          </div>
        ) : detail ? (
          <div className="space-y-3 text-sm">
            <Row label="ID" value={detail.id} mono />
            <Row label="Tên" value={detail.displayName} />
            <Row label="Email" value={detail.email} />
            <Row
              label="Role"
              value={
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[detail.role] || 'bg-neutral-700'}`}>
                  {detail.role}
                </span>
              }
            />
            <Row
              label="Trạng thái"
              value={
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${detail.isBanned ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'}`}>
                  {detail.isBanned ? 'Banned' : 'Active'}
                </span>
              }
            />
            {detail.artistName && <Row label="Artist Profile" value={detail.artistName} />}
            {detail.artistId && <Row label="Artist ID" value={detail.artistId} mono />}
            <Row label="Ngày tạo" value={detail.createdAt ? new Date(detail.createdAt).toLocaleString('vi-VN') : '—'} />
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-neutral-400 mb-3">Không tìm thấy thông tin user.</p>
            <button onClick={retry} className="px-3 py-1.5 text-xs bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition">
              Thử lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-neutral-400 shrink-0">{label}</span>
      <span className={`text-white text-right break-all ${mono ? 'font-mono text-xs' : ''}`}>{value ?? '—'}</span>
    </div>
  );
}
