import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, BadgeCheck, Flag } from 'lucide-react';
import { ROLES } from '../../constants/enums';
import AdminDashboard from './AdminDashboard';
import AdminArtistRequests from './AdminArtistRequests';
import AdminReports from './AdminReports';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'artist-requests', label: 'Yêu cầu nghệ sĩ', icon: BadgeCheck },
  { key: 'reports', label: 'Báo cáo', icon: Flag },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!user || user.role !== ROLES.ADMIN) {
      navigate('/');
    }
  }, [user, navigate]);

  if (!user || user.role !== ROLES.ADMIN) return null;

  return (
    <div className="flex h-full">
      {/* Sidebar admin */}
      <div className="w-48 bg-neutral-900 border-r border-neutral-800 flex-shrink-0 p-3">
        <h2 className="text-white font-bold text-sm mb-4 px-2">Admin Panel</h2>
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
                activeTab === key
                  ? 'bg-neutral-700 text-white font-medium'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'dashboard' && <AdminDashboard />}
        {activeTab === 'artist-requests' && <AdminArtistRequests />}
        {activeTab === 'reports' && <AdminReports />}
      </div>
    </div>
  );
}
