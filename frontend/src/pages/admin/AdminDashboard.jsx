import React, { useState, useEffect, useCallback } from 'react';
import { Music, BadgeCheck, Flag, Users, Disc3, Mic2, RefreshCw, TrendingUp } from 'lucide-react';
import { getStats } from '../../services/AdminService';

const STAT_CARDS = [
  {
    key: 'totalSongs',
    label: 'Tổng bài hát',
    icon: Music,
    color: 'text-blue-400',
    subKey: 'newSongsLast7Days',
    subLabel: '+{n} tuần này',
  },
  {
    key: 'totalAlbums',
    label: 'Tổng albums',
    icon: Disc3,
    color: 'text-cyan-400',
  },
  {
    key: 'verifiedArtists',
    label: 'Nghệ sĩ xác minh',
    icon: BadgeCheck,
    color: 'text-green-400',
    subKey: 'totalArtists',
    subLabel: '/{n} tổng',
  },
  {
    key: 'totalUsers',
    label: 'Tổng người dùng',
    icon: Users,
    color: 'text-purple-400',
    subKey: 'newUsersLast7Days',
    subLabel: '+{n} tuần này',
  },
  {
    key: 'pendingReports',
    label: 'Báo cáo chờ xử lý',
    icon: Flag,
    color: 'text-yellow-400',
    subKey: 'newReportsLast7Days',
    subLabel: '+{n} tuần này',
  },
  {
    key: 'pendingArtistRequests',
    label: 'Yêu cầu nghệ sĩ',
    icon: Mic2,
    color: 'text-orange-400',
  },
];

function StatCard({ cardDef, stats }) {
  const { key, label, icon: Icon, color, subKey, subLabel } = cardDef;
  const value = stats?.[key];
  const subValue = subKey ? stats?.[subKey] : null;

  return (
    <div className="bg-neutral-800 rounded-xl p-5 flex items-center gap-4">
      <div className={color}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">
          {value !== undefined ? value.toLocaleString() : '—'}
        </p>
        <p className="text-sm text-neutral-400">{label}</p>
        {subKey && subValue !== undefined && subValue !== null && (
          <p className="text-xs text-neutral-500 mt-0.5">
            {subLabel.replace('{n}', subValue.toLocaleString())}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStats();
      setStats(data);
    } catch (err) {
      setError(err?.message || 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-neutral-400">
        <p className="text-red-400">{error}</p>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg transition"
        >
          <RefreshCw size={14} /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {STAT_CARDS.map((card) =>
          loading ? (
            <div key={card.key} className="bg-neutral-800 rounded-xl p-5 flex items-center gap-4">
              <div className="h-7 w-7 bg-neutral-700 rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-16 bg-neutral-700 rounded animate-pulse" />
                <div className="h-4 w-24 bg-neutral-700 rounded animate-pulse" />
              </div>
            </div>
          ) : (
            <StatCard key={card.key} cardDef={card} stats={stats} />
          )
        )}
      </div>

      {/* Top content */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Songs */}
        <div className="bg-neutral-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Top bài hát</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-neutral-700 rounded animate-pulse" />
              ))}
            </div>
          ) : stats?.topSongs?.length ? (
            <ol className="space-y-2">
              {stats.topSongs.map((song, i) => (
                <li key={song.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-neutral-500 w-5 shrink-0">{i + 1}.</span>
                    <span className="text-white truncate">{song.title}</span>
                    <span className="text-neutral-500 truncate hidden sm:block">— {song.artistName}</span>
                  </span>
                  <span className="text-neutral-400 shrink-0 ml-2">{(song.playCount ?? 0).toLocaleString()}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-neutral-500 text-sm">Chưa có dữ liệu</p>
          )}
        </div>

        {/* Top Artists */}
        <div className="bg-neutral-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-purple-400" />
            <h2 className="text-sm font-semibold text-white">Top nghệ sĩ</h2>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 bg-neutral-700 rounded animate-pulse" />
              ))}
            </div>
          ) : stats?.topArtists?.length ? (
            <ol className="space-y-2">
              {stats.topArtists.map((artist, i) => (
                <li key={artist.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="text-neutral-500 w-5 shrink-0">{i + 1}.</span>
                    <span className="text-white truncate">{artist.name}</span>
                    {artist.isVerified && (
                      <BadgeCheck size={12} className="text-green-400 shrink-0" />
                    )}
                  </span>
                  <span className="text-neutral-400 shrink-0 ml-2">
                    {(artist.followerCount ?? 0).toLocaleString()} followers
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-neutral-500 text-sm">Chưa có dữ liệu</p>
          )}
        </div>
      </div>
    </div>
  );
}
