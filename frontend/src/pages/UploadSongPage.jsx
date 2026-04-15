import React, { useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Music, Upload, X, Video, ImagePlus, CheckCircle } from 'lucide-react';
import { showToast } from '../store/uiSlice';
import { uploadSong } from '../services/UploadService';
import { createNotification } from '../services/NotificationService';
import { getArtistByUserId } from '../services/ArtistService';
import { addNotification } from '../store/notificationSlice';
import { ROLES, CATEGORIES } from '../constants/enums';
import { parseMp3Duration } from '../utils/audioMetadata';
import EmptyState from '../components/ui/EmptyState';
import ErrorMessage from '../components/ui/ErrorMessage';

const MAX_COVERS = 5;
const STEPS = ['Thông tin', 'Ảnh bìa', 'Media', 'Xem lại'];

function formatDurationInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export default function UploadSongPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const coverDropRef = useRef(null);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [coverFiles, setCoverFiles] = useState([]);
  const [coverPreviews, setCoverPreviews] = useState([]);
  const [mvFile, setMvFile] = useState(null);
  const [mvPreview, setMvPreview] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [artistId, setArtistId] = useState(null);
  const [artistLoading, setArtistLoading] = useState(true);
  const [autoLyricsFetchedKey, setAutoLyricsFetchedKey] = useState('');

  // Lấy artistId từ BE khi mount — bắt buộc có trước khi cho upload
  React.useEffect(() => {
    if (!user) return;
    const userId = user.user_id || user.id;
    setArtistLoading(true);
    getArtistByUserId(userId)
      .then((artist) => {
        if (artist?.id) setArtistId(artist.id);
        else setUploadError('Không tìm thấy hồ sơ nghệ sĩ. Vui lòng liên hệ hỗ trợ.');
      })
      .catch(() => setUploadError('Không thể tải thông tin nghệ sĩ. Vui lòng thử lại.'))
      .finally(() => setArtistLoading(false));
  }, [user]);

  React.useEffect(() => {
    const artistName = String(user?.name || user?.username || '').trim();
    const songTitle = String(title || '').trim();
    if (!audioFile || !artistName || !songTitle) return;
    if (String(lyrics || '').trim()) return;

    const fetchKey = `${songTitle}__${artistName}__${audioFile?.name || ''}`;
    if (fetchKey === autoLyricsFetchedKey) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://lrclib.net/api/get?track_name=${encodeURIComponent(songTitle)}&artist_name=${encodeURIComponent(artistName)}`
        );
        if (!res.ok) return;
        const data = await res.json();
        const autoLyrics = data?.syncedLyrics || data?.plainLyrics || '';
        if (!autoLyrics) return;

        setLyrics((prev) => {
          if (String(prev || '').trim()) return prev;
          return autoLyrics;
        });
        dispatch(showToast({ message: 'Đã tự động điền lời bài hát', type: 'info' }));
        setAutoLyricsFetchedKey(fetchKey);
      } catch { /* ignore lyrics fetch error */ }
    }, 450);

    return () => clearTimeout(timer);
  }, [audioFile, title, user?.name, user?.username, lyrics, autoLyricsFetchedKey, dispatch]);

  if (!user || user.role !== ROLES.ARTIST) {
    return (
      <div className="flex items-center justify-center mt-20">
        <EmptyState
          icon={Music}
          title="Chỉ nghệ sĩ được xác minh"
          description="Bạn cần đăng ký và được xác minh là nghệ sĩ để sử dụng tính năng này."
          actionLabel="Đăng ký ngay"
          onAction={() => navigate('/artist-verify')}
        />
      </div>
    );
  }

  if (artistLoading) {
    return <div className="flex items-center justify-center mt-20 text-neutral-400 text-sm">Đang tải thông tin nghệ sĩ...</div>;
  }

  const addCoverFiles = (files) => {
    const remaining = MAX_COVERS - coverFiles.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    setCoverFiles((prev) => [...prev, ...toAdd]);
    setCoverPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeCover = (idx) => {
    setCoverFiles((prev) => prev.filter((_, i) => i !== idx));
    setCoverPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleCoverDrop = (e) => {
    e.preventDefault();
    addCoverFiles(e.dataTransfer.files);
  };

  const handleMvChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMvFile(file);
    setMvPreview(URL.createObjectURL(file));
  };

  const handleAudioFileChange = async (files) => {
    const file = files?.[0];
    if (!file) return;
    setAudioFile(file);
    setUploadError('');
    
    // Auto-detect duration from audio file
    try {
      const seconds = await parseMp3Duration(file);
      if (seconds && seconds > 0) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const formattedDuration = `${minutes}:${String(secs).padStart(2, '0')}`;
        setDuration(formattedDuration);
      }
    } catch (err) {
      console.warn('Audio duration parsing skipped, user must input manually', err);
    }
  };

  const handleDurationKeyDown = (e) => {
    if (e.key === 'Backspace') return;
    if (!/\d/.test(e.key)) e.preventDefault();
  };

  const canProceed = () => {
    if (step === 0) return title.trim() && audioFile && selectedCategories.length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setUploadError('');

    // Validate trước khi gọi API
    if (!title.trim()) { setUploadError('Vui lòng nhập tên bài hát.'); return; }
    if (!audioFile) { setUploadError('Vui lòng chọn file âm thanh.'); return; }
    if (selectedCategories.length === 0) { setUploadError('Vui lòng chọn ít nhất một thể loại.'); return; }
    if (!artistId) { setUploadError('Không tìm thấy hồ sơ nghệ sĩ. Vui lòng tải lại trang.'); return; }

    setIsLoading(true);
    try {
      const durationSeconds = duration
        ? duration.split(':').reduce((acc, val, i) => acc + (i === 0 ? parseInt(val) * 60 : parseInt(val)), 0)
        : 0;

      const formData = {
        title: title.trim(),
        artistId,
        audioFile,
        mvFile,
        coverFile: coverFiles[0] || null,
        lyrics,
        duration: durationSeconds,
        categories: selectedCategories,
      };
      await uploadSong(formData);
      dispatch(showToast({ message: 'Upload thành công!', type: 'success' }));
      try {
        const notif = await createNotification({
          type: 'new_song',
          message: `${user.name || user.username} vừa đăng bài hát mới: ${title.trim()}`,
          artist_name: user.name || user.username,
          song_title: title.trim(),
          image_url: coverPreviews[0] || '',
        });
        if (notif) dispatch(addNotification(notif));
      } catch { /* notification failure không block flow */ }
      setStep(0);
      setTitle('');
      setAudioFile(null);
      setCoverFiles([]);
      setCoverPreviews([]);
      setMvFile(null);
      setMvPreview('');
      setLyrics('');
      setDuration('');
      setSelectedCategories([]);
    } catch (err) {
      setUploadError(err?.message || 'Không thể upload bài hát. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 px-4">
      <h1 className="text-2xl font-bold text-white mb-6">Upload bài hát mới</h1>

      {/* Progress stepper */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition ${
                i < step ? 'bg-green-500 text-black' : i === step ? 'bg-white text-black' : 'bg-neutral-700 text-neutral-400'
              }`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              <span className={`text-xs mt-1 ${i === step ? 'text-white font-semibold' : 'text-neutral-500'}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 -mt-5 mx-1 ${i < step ? 'bg-green-500' : 'bg-neutral-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step 0: Thông tin */}
      {step === 0 && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Tên bài hát *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Nhập tên bài hát"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Tên nghệ sĩ</label>
              <input
                type="text"
                value={user.name || user.username}
                readOnly
                className="w-full bg-neutral-800/50 text-neutral-400 rounded-lg px-3 py-2 text-sm outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-neutral-300 mb-1">File audio *</label>
              <input
                type="file"
                accept="audio/*"
                onChange={(e) => handleAudioFileChange(e.target.files)}
                className="w-full bg-neutral-800 text-neutral-300 rounded-lg px-3 py-2 text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-500 file:text-black hover:file:bg-green-400"
              />
              {audioFile && <p className="text-xs text-neutral-400 mt-1">{audioFile.name}</p>}
            </div>
            <div>
              <label className="block text-sm text-neutral-300 mb-1">Thời lượng (MM:SS) - tự động phát hiện, có thể chỉnh sửa</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(formatDurationInput(e.target.value))}
                onKeyDown={handleDurationKeyDown}
                placeholder="03:45"
                maxLength={5}
                className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-1">Lời bài hát (tùy chọn)</label>
            <textarea
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={8}
              className="w-full bg-neutral-800 text-white rounded-lg px-3 py-2 text-sm font-mono outline-none resize-none focus:ring-1 focus:ring-green-500"
              placeholder={"00:00 Dòng đầu tiên\n00:05 Dòng tiếp theo"}
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-300 mb-2">Thể loại *</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(({ id, name }) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer bg-neutral-800 px-3 py-2 rounded-lg hover:bg-neutral-700 transition">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(id)}
                    onChange={(e) =>
                      setSelectedCategories((prev) =>
                        e.target.checked ? [...prev, id] : prev.filter((c) => c !== id)
                      )
                    }
                    className="accent-green-500"
                  />
                  <span className="text-sm text-white">{name}</span>
                </label>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedCategories.map((id) => (
                  <span key={id} className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                    {CATEGORIES.find((c) => c.id === id)?.name}
                    <button
                      type="button"
                      onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== id))}
                      className="hover:text-green-200"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 1: Ảnh bìa */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-neutral-400">Tối đa {MAX_COVERS} ảnh bìa. Ảnh đầu tiên sẽ là ảnh chính.</p>

          {/* Drag-drop zone */}
          <div
            ref={coverDropRef}
            onDrop={handleCoverDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => coverDropRef.current?.querySelector('input')?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              coverFiles.length >= MAX_COVERS
                ? 'border-neutral-700 opacity-50 pointer-events-none'
                : 'border-neutral-600 hover:border-green-500 hover:bg-green-500/5'
            }`}
          >
            <ImagePlus size={32} className="mx-auto mb-3 text-neutral-400" />
            <p className="text-sm text-neutral-300">Kéo thả ảnh vào đây hoặc click để chọn</p>
            <p className="text-xs text-neutral-500 mt-1">PNG, JPG, WEBP ({coverFiles.length}/{MAX_COVERS})</p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => addCoverFiles(e.target.files)}
            />
          </div>

          {/* Preview grid */}
          {coverPreviews.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {coverPreviews.map((src, i) => (
                <div key={i} className="relative group">
                  <img src={src} alt={`Cover ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                  {i === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-green-500 text-black px-1 rounded font-bold">Chính</span>
                  )}
                  <button
                    onClick={() => removeCover(i)}
                    className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Media (MV) */}
      {step === 2 && (
        <div className="space-y-4">
          <label className="block text-sm text-neutral-300 mb-1">Video MV (tùy chọn)</label>
          <div
            onClick={() => document.getElementById('mv-input')?.click()}
            className="border-2 border-dashed border-neutral-600 hover:border-green-500 hover:bg-green-500/5 rounded-xl p-8 text-center cursor-pointer transition"
          >
            <Video size={32} className="mx-auto mb-3 text-neutral-400" />
            <p className="text-sm text-neutral-300">{mvFile ? mvFile.name : 'Click để chọn file video'}</p>
            <p className="text-xs text-neutral-500 mt-1">MP4, MOV, WEBM (tối đa 500MB)</p>
            <input
              id="mv-input"
              type="file"
              accept="video/mp4,video/mov,video/webm"
              className="hidden"
              onChange={handleMvChange}
            />
          </div>
          {mvPreview && (
            <div className="relative">
              <video
                src={mvPreview}
                controls
                className="w-full rounded-xl max-h-64 object-contain bg-black"
              />
              <button
                onClick={() => { setMvFile(null); setMvPreview(''); }}
                className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 hover:bg-black transition"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Xem lại */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-neutral-800 rounded-xl p-4 space-y-3">
            <div className="flex gap-3">
              {coverPreviews[0] ? (
                <img src={coverPreviews[0]} alt="cover" className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-neutral-700 flex items-center justify-center">
                  <Music size={24} className="text-neutral-500" />
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-lg">{title || '(Chưa nhập)'}</p>
                <p className="text-neutral-400 text-sm">{user.name || user.username}</p>
                {duration && <p className="text-neutral-500 text-xs mt-1">{duration}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-neutral-700">
              <div>
                <span className="text-neutral-400">Audio: </span>
                <span className={audioFile ? 'text-green-400' : 'text-red-400'}>{audioFile ? audioFile.name : 'Chưa chọn'}</span>
              </div>
              <div>
                <span className="text-neutral-400">Ảnh bìa: </span>
                <span className={coverFiles.length ? 'text-green-400' : 'text-neutral-500'}>{coverFiles.length ? `${coverFiles.length} ảnh` : 'Không có'}</span>
              </div>
              <div>
                <span className="text-neutral-400">MV: </span>
                <span className={mvFile ? 'text-green-400' : 'text-neutral-500'}>{mvFile ? mvFile.name : 'Không có'}</span>
              </div>
              <div>
                <span className="text-neutral-400">Lời: </span>
                <span className={lyrics ? 'text-green-400' : 'text-neutral-500'}>{lyrics ? 'Có' : 'Không có'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-neutral-400">Thể loại: </span>
                <span className={selectedCategories.length ? 'text-green-400' : 'text-red-400'}>
                  {selectedCategories.length
                    ? selectedCategories.map((id) => CATEGORIES.find((c) => c.id === id)?.name).join(', ')
                    : 'Chưa chọn'}
                </span>
              </div>
            </div>
          </div>

          {uploadError && <ErrorMessage message={uploadError} onRetry={handleSubmit} />}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="px-5 py-2 text-sm text-neutral-300 hover:text-white transition disabled:opacity-0"
        >
          ← Quay lại
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canProceed()}
            className="px-6 py-2.5 bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Tiếp theo →
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading || !title.trim() || !audioFile}
            className="px-6 py-2.5 bg-green-500 text-black font-semibold rounded-full hover:bg-green-400 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
            {isLoading ? 'Đang upload...' : <><Upload size={16} /> Upload bài hát</>}
          </button>
        )}
      </div>
    </div>
  );
}
