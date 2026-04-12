import { useDispatch } from 'react-redux';
import { Copy } from 'lucide-react';
import { showToast } from '../../store/uiSlice';
import LyricsMode from '../lyrics/LyricsMode';

export default function LyricsSection({ lyrics, currentTime, duration }) {
  const dispatch = useDispatch();

  const handleCopy = async () => {
    const text = lyrics.map((l) => l.text).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      dispatch(showToast({ message: 'Đã sao chép lời bài hát', type: 'success' }));
    } catch {
      dispatch(showToast({ message: 'Không thể sao chép', type: 'error' }));
    }
  };

  const canCopy = typeof navigator !== 'undefined' && !!navigator.clipboard && lyrics.length > 0;

  return (
    <div className="relative">
      {canCopy && (
        <div className="flex justify-end mb-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10"
          >
            <Copy size={13} />
            Sao chép lời bài hát
          </button>
        </div>
      )}
      <LyricsMode lyrics={lyrics} currentTime={currentTime} duration={duration} />
    </div>
  );
}
