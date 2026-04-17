import { useDispatch, useSelector } from 'react-redux';
import { Copy, Minus, Plus, RotateCcw } from 'lucide-react';
import { showToast } from '../../store/uiSlice';
import { adjustLyricsOffset, resetLyricsOffset } from '../../store/playerSlice';
import LyricsMode from '../lyrics/LyricsMode';

export default function LyricsSection({ lyrics, currentTime, duration }) {
  const dispatch = useDispatch();
  const lyricsOffset = useSelector((s) => s.player.lyricsOffset);
  const hasTimestamps = Array.isArray(lyrics) && lyrics.some((l) => l.time > 0);

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
      <div className="flex items-center justify-end gap-2 mb-3 flex-wrap">
        {hasTimestamps && (
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <button onClick={() => dispatch(adjustLyricsOffset(-0.5))} className="p-1 rounded hover:bg-white/10 hover:text-white transition" title="Lời chậm hơn 0.5s"><Minus size={13} /></button>
            <button onClick={() => dispatch(resetLyricsOffset())} className="px-2 py-0.5 rounded hover:bg-white/10 hover:text-white transition min-w-[60px] text-center" title="Reset offset">
              {lyricsOffset === 0 ? 'Sync' : `${lyricsOffset > 0 ? '+' : ''}${lyricsOffset.toFixed(1)}s`}
            </button>
            <button onClick={() => dispatch(adjustLyricsOffset(0.5))} className="p-1 rounded hover:bg-white/10 hover:text-white transition" title="Lời nhanh hơn 0.5s"><Plus size={13} /></button>
            {lyricsOffset !== 0 && (
              <button onClick={() => dispatch(resetLyricsOffset())} className="p-1 rounded hover:bg-white/10 hover:text-white transition" title="Reset"><RotateCcw size={12} /></button>
            )}
          </div>
        )}
        {canCopy && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10"
          >
            <Copy size={13} />
            Sao chép lời bài hát
          </button>
        )}
      </div>
      <LyricsMode lyrics={lyrics} currentTime={currentTime} duration={duration} offset={lyricsOffset} />
    </div>
  );
}
