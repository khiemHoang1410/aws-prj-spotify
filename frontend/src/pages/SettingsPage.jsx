import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Globe, Music2, Play, FileText, Bell, Moon, RotateCcw } from 'lucide-react';
import { updateSetting, resetSettings } from '../store/settingsSlice';
import { showToast } from '../store/uiSlice';

const NAV_ITEMS = [
  { id: 'language', label: 'Ngôn ngữ', icon: Globe },
  { id: 'audio', label: 'Chất lượng âm thanh', icon: Music2 },
  { id: 'playback', label: 'Phát lại', icon: Play },
  { id: 'lyrics', label: 'Lời bài hát', icon: FileText },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'display', label: 'Giao diện', icon: Moon },
];

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
      className="bg-neutral-700 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-green-500"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

export default function SettingsPage() {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.settings);
  const [activeSection, setActiveSection] = useState('language');

  const set = (key, value) => dispatch(updateSetting({ key, value }));

  const handleReset = () => {
    dispatch(resetSettings());
    dispatch(showToast({ message: 'Đã khôi phục cài đặt mặc định', type: 'info' }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-white">Cài đặt</h1>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition"
        >
          <RotateCcw size={14} /> Khôi phục mặc định
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sticky sidebar nav */}
        <nav className="w-52 flex-shrink-0">
          <ul className="space-y-1 sticky top-24">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
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

          {activeSection === 'language' && (
            <Section title="Ngôn ngữ">
              <SettingRow label="Ngôn ngữ hiển thị" description="Chọn ngôn ngữ cho giao diện">
                <SelectOption
                  value={settings.language}
                  onChange={(v) => set('language', v)}
                  options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]}
                />
              </SettingRow>
            </Section>
          )}

          {activeSection === 'audio' && (
            <Section title="Chất lượng âm thanh">
              <SettingRow label="Chất lượng phát" description="Chất lượng stream nhạc">
                <SelectOption
                  value={settings.audioQuality}
                  onChange={(v) => set('audioQuality', v)}
                  options={[
                    { value: 'low', label: 'Thấp (96 kbps)' },
                    { value: 'normal', label: 'Bình thường (160 kbps)' },
                    { value: 'high', label: 'Cao (320 kbps)' },
                    { value: 'lossless', label: 'Không nén (FLAC)' },
                  ]}
                />
              </SettingRow>
            </Section>
          )}

          {activeSection === 'playback' && (
            <Section title="Phát lại">
              <SettingRow label="Tự động phát" description="Tự động phát bài tiếp theo khi kết thúc">
                <ToggleSwitch checked={settings.autoplay} onChange={(v) => set('autoplay', v)} />
              </SettingRow>
            </Section>
          )}

          {activeSection === 'lyrics' && (
            <Section title="Lời bài hát">
              <SettingRow label="Hiển thị lời bài hát" description="Hiển thị lời bài hát khi phát nhạc">
                <ToggleSwitch checked={settings.showLyrics} onChange={(v) => set('showLyrics', v)} />
              </SettingRow>
            </Section>
          )}

          {activeSection === 'notifications' && (
            <Section title="Thông báo">
              <SettingRow label="Bật thông báo" description="Nhận thông báo về bài hát mới và hoạt động">
                <ToggleSwitch checked={settings.notifications} onChange={(v) => set('notifications', v)} />
              </SettingRow>
            </Section>
          )}

          {activeSection === 'display' && (
            <Section title="Giao diện">
              <SettingRow label="Chế độ tối" description="Ngay lúc này chỉ hỗ trợ dark mode">
                <ToggleSwitch checked={settings.theme === 'dark'} onChange={(v) => set('theme', v ? 'dark' : 'light')} />
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
