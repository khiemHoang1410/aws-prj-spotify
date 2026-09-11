import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Globe, Play, FileText, Bell, Trash2, RotateCcw } from 'lucide-react';
import { updateSetting, resetSettings } from '../store/settingsSlice';
import { showToast } from '../store/uiSlice';
import { clearEntries } from '../store/historySlice';
import { clearPlayHistory } from '../services/HistoryService';
import { useTranslation } from '../utils/i18n';

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-green-500' : 'bg-neutral-600'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

function SelectOption({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-neutral-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const settings = useSelector((state) => state.settings);
  const historyEntries = useSelector((state) => state.history?.entries || []);
  const [activeSection, setActiveSection] = useState('language');

  const navItems = [
    { id: 'language', label: t('tabLanguage'), icon: Globe },
    { id: 'playback', label: t('tabPlayback'), icon: Play },
    { id: 'lyrics', label: t('tabLyrics'), icon: FileText },
    { id: 'notifications', label: t('tabNotifications'), icon: Bell },
    { id: 'storage', label: t('tabStorage'), icon: Trash2 },
  ];

  const set = (key, value) => {
    dispatch(updateSetting({ key, value }));
    dispatch(showToast({ message: t('savedSuccess'), type: 'success' }));
  };

  const handleReset = () => {
    dispatch(resetSettings());
    dispatch(showToast({ message: t('restoredSuccess'), type: 'info' }));
  };

  const handleClearHistory = async () => {
    if (historyEntries.length === 0) {
      dispatch(showToast({ message: t('clearHistoryEmpty'), type: 'info' }));
      return;
    }
    if (window.confirm(t('confirmClear'))) {
      try {
        await clearPlayHistory();
      } catch {
        // silent fallback if network issue
      }
      dispatch(clearEntries());
      try {
        localStorage.removeItem('spotify_play_history');
      } catch {
        // ignore
      }
      dispatch(showToast({ message: t('clearHistorySuccess'), type: 'success' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-white">{t('settingsTitle')}</h1>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition"
        >
          <RotateCcw size={14} /> {t('restoreDefaults')}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sticky sidebar nav */}
        <nav className="w-52 flex-shrink-0">
          <ul className="space-y-1 sticky top-24">
            {navItems.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <button
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    activeSection === id ? 'bg-white/10 text-white font-semibold' : 'text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-2">

          {/* 1. Ngôn ngữ (Language) */}
          {activeSection === 'language' && (
            <Section title={t('tabLanguage')}>
              <SettingRow label={t('langDisplay')} description={t('langDisplayDesc')}>
                <SelectOption
                  value={settings.language}
                  onChange={(v) => set('language', v)}
                  options={[
                    { value: 'vi', label: 'Tiếng Việt' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </SettingRow>
            </Section>
          )}

          {/* 2. Phát lại (Playback) */}
          {activeSection === 'playback' && (
            <Section title={t('tabPlayback')}>
              <SettingRow label={t('autoplayTitle')} description={t('autoplayDesc')}>
                <ToggleSwitch checked={settings.autoplay} onChange={(v) => set('autoplay', v)} />
              </SettingRow>
            </Section>
          )}

          {/* 3. Lời bài hát (Lyrics) */}
          {activeSection === 'lyrics' && (
            <Section title={t('tabLyrics')}>
              <SettingRow label={t('lyricsTitle')} description={t('lyricsDesc')}>
                <ToggleSwitch checked={settings.showLyrics} onChange={(v) => set('showLyrics', v)} />
              </SettingRow>
            </Section>
          )}

          {/* 4. Thông báo (Notifications) */}
          {activeSection === 'notifications' && (
            <Section title={t('tabNotifications')}>
              <SettingRow label={t('notifTitle')} description={t('notifDesc')}>
                <ToggleSwitch checked={settings.notifications} onChange={(v) => set('notifications', v)} />
              </SettingRow>
            </Section>
          )}

          {/* 5. Dữ liệu & Bộ nhớ (Data & Storage) */}
          {activeSection === 'storage' && (
            <Section title={t('tabStorage')}>
              <SettingRow
                label={t('clearHistoryTitle')}
                description={`${t('clearHistoryDesc')} (${historyEntries.length} bài hát)`}
              >
                <button
                  onClick={handleClearHistory}
                  className="px-4 py-1.5 bg-red-600/80 hover:bg-red-600 active:scale-95 text-white text-xs font-semibold rounded-full transition"
                >
                  {t('clearHistoryBtn')}
                </button>
              </SettingRow>
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-neutral-800/50 rounded-xl p-5">
      <h2 className="text-base font-bold text-white mb-4">{title}</h2>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-neutral-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}
