import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Sparkles, X, Play, BookmarkPlus, Check, Loader2, RefreshCw, Music2, Flame, Coffee, CloudRain, Dumbbell } from 'lucide-react';
import { closeAiModal, showToast } from '../../store/uiSlice';
import { playWithContext } from '../../store/playerSlice';
import { openModal } from '../../store/authSlice';
import { generateAiPlaylist, saveAiPlaylist } from '../../services/AiService';

const SUGGESTIONS = [
  { icon: CloudRain, label: 'Đêm muộn tâm trạng ngắm mưa', prompt: 'Những bài hát buồn tâm trạng chia tay để nghe đêm muộn ngắm mưa' },
  { icon: Dumbbell, label: 'Bật mood năng lượng tập gym', prompt: 'Nhạc rap và pop sôi động cực cháy tiếp lửa năng lượng tập gym' },
  { icon: Coffee, label: 'Cà phê chiều chill chill', prompt: 'Giai điệu nhẹ nhàng êm ái thư giãn ngồi uống cà phê chiều' },
  { icon: Flame, label: 'Tuyển tập Sơn Tùng M-TP', prompt: 'Tuyển tập các ca khúc đỉnh nhất của Sơn Tùng M-TP' },
  { icon: Music2, label: 'Rap Việt sâu lắng ý nghĩa', prompt: 'Những bản nhạc rap Việt sâu lắng của Đen Vâu về cuộc sống' },
];

export default function AiPlaylistModal() {
  const dispatch = useDispatch();
  const { isAiModalOpen } = useSelector((state) => state.ui);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  if (!isAiModalOpen) return null;

  const handleClose = () => {
    dispatch(closeAiModal());
  };

  const handleGenerate = async (customPrompt) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse || textToUse.trim().length < 2) {
      dispatch(showToast({ message: 'Vui lòng nhập ít nhất 2 ký tự', type: 'error' }));
      return;
    }

    setIsLoading(true);
    setResult(null);
    setIsSaved(false);

    try {
      const res = await generateAiPlaylist(textToUse.trim());
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        dispatch(showToast({ message: res.error || 'Lỗi khi tạo playlist', type: 'error' }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayAll = () => {
    if (!result?.songs || result.songs.length === 0) return;
    dispatch(playWithContext({ song: result.songs[0], songs: result.songs }));
    dispatch(showToast({ message: `Đang phát "${result.name}"`, type: 'success' }));
    handleClose();
  };

  const handlePlaySong = (song) => {
    dispatch(playWithContext({ song, songs: result.songs }));
  };

  const handleSaveToLibrary = async () => {
    if (!isAuthenticated) {
      dispatch(openModal('login'));
      return;
    }

    if (!result) return;
    setIsSaving(true);
    try {
      const res = await saveAiPlaylist({
        name: result.name,
        description: result.description,
        coverUrl: result.coverUrl,
        songIds: result.songs.map((s) => s.song_id),
      });

      if (res.success) {
        setIsSaved(true);
        dispatch(showToast({ message: 'Đã lưu playlist vào Thư viện của bạn!', type: 'success' }));
      } else {
        dispatch(showToast({ message: res.error || 'Lỗi khi lưu playlist', type: 'error' }));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Aurora glowing wrapper */}
      <div className="relative w-full max-w-2xl bg-gradient-to-r from-purple-500/30 via-pink-500/20 to-emerald-400/30 p-[1.5px] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#121212] rounded-2xl p-6 sm:p-7 max-h-[85vh] overflow-y-auto custom-scrollbar">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="text-white animate-pulse" size={20} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white tracking-wide flex items-center gap-2">
                  Spotify AI Smart DJ
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    GenAI
                  </span>
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Mô tả tâm trạng, thể loại hoặc nghệ sĩ – AI sẽ tuyển chọn playlist ngay lập tức.
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="text-neutral-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form input section */}
          {!result && (
            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ví dụ: 'Tao vừa chia tay, muốn nghe nhạc buồn dưới mưa', 'Nhạc rap Việt cực bốc để tập gym'..."
                  rows={3}
                  disabled={isLoading}
                  className="w-full bg-neutral-900 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition resize-none"
                />
              </div>

              {/* Suggestions */}
              <div>
                <p className="text-xs font-semibold text-neutral-400 mb-2">Gợi ý nhanh:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setPrompt(item.prompt);
                          handleGenerate(item.prompt);
                        }}
                        disabled={isLoading}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-neutral-800/80 border border-white/10 hover:border-purple-400/50 hover:bg-purple-900/20 text-neutral-300 hover:text-white transition group"
                      >
                        <Icon size={13} className="text-purple-400 group-hover:scale-110 transition" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate button */}
              <button
                type="button"
                onClick={() => handleGenerate()}
                disabled={isLoading || !prompt.trim()}
                className="w-full mt-3 py-3 rounded-full font-bold text-sm text-white bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:opacity-95 active:scale-[0.99] transition shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>AI đang phân tích & tuyển chọn nhạc...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Tạo Playlist với AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Result view */}
          {result && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Header card */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-neutral-900/80 p-4 rounded-xl border border-white/10">
                <img
                  src={result.coverUrl}
                  alt={result.name}
                  className="w-28 h-28 rounded-lg object-cover shadow-lg flex-shrink-0"
                />
                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Mood: {result.mood}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Engine: {result.engineUsed === 'gemini' ? 'Gemini 2.0 Flash' : 'Smart Local NLP'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white truncate">{result.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                    {result.description}
                  </p>
                  <p className="text-[11px] text-neutral-500 mt-1 font-medium">
                    {result.songs?.length || 0} bài hát tuyển chọn
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePlayAll}
                  className="flex-1 py-2.5 rounded-full font-bold text-sm bg-green-500 text-black hover:bg-green-400 active:scale-95 transition flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
                >
                  <Play size={16} fill="currentColor" />
                  <span>Phát toàn bộ</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  disabled={isSaving || isSaved}
                  className={`flex-1 py-2.5 rounded-full font-bold text-sm border transition flex items-center justify-center gap-2 ${
                    isSaved
                      ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                      : 'border-white/20 text-white hover:border-white hover:bg-white/5 active:scale-95'
                  }`}
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isSaved ? (
                    <>
                      <Check size={16} />
                      <span>Đã lưu thư viện</span>
                    </>
                  ) : (
                    <>
                      <BookmarkPlus size={16} />
                      <span>Lưu vào Thư viện</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="p-2.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition"
                  title="Thử prompt khác"
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              {/* Songs preview table */}
              <div className="space-y-1 mt-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {result.songs?.map((song, i) => (
                  <div
                    key={song.song_id || i}
                    onClick={() => handlePlaySong(song)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs text-neutral-500 w-4 text-center group-hover:hidden">
                        {i + 1}
                      </span>
                      <Play
                        size={14}
                        fill="currentColor"
                        className="text-white hidden group-hover:block text-green-400 w-4"
                      />
                      <img
                        src={song.image_url || '/pictures/artworkDefault.png'}
                        alt={song.title}
                        className="w-9 h-9 rounded object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate group-hover:text-green-400 transition">
                          {song.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {song.artist_name}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-neutral-500">
                      {Math.floor((song.duration || 0) / 60)}:
                      {String((song.duration || 0) % 60).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
