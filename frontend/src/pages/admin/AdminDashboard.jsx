import React, { useState, useEffect } from 'react';
import { Music, BadgeCheck, Flag, Users } from 'lucide-react';
import { getStats } from '../../services/AdminService';

const STAT_CARDS = [
  { key: 'totalSongs', label: 'Tổng bài hát', icon: Music, color: 'text-blue-400' },
  { key: 'verifiedArtists', label: 'Nghệ sĩ xác minh', icon: BadgeCheck, color: 'text-green-400' },
  { key: 'pendingReports', label: 'Báo cáo chờ xử lý', icon: Flag, color: 'text-yellow-400' },
  { key: 'totalUsers', label: 'Tổng người dùng', icon: Users, color: 'text-purple-400' },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
          <div
            key={key}
            className="bg-neutral-800 rounded-xl p-5 flex items-center gap-4"
          >
            <div className={`${color}`}>
              <Icon size={28} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {stats ? stats[key] : '—'}
              </p>
              <p className="text-sm text-neutral-400">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
