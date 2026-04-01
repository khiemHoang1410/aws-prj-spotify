import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

export default function VideoPlayer({ src }) {
  const videoRef = useRef(null);
  const { currentTime, globalSeekTime, isPlaying } = useSelector((state) => state.player);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    if (isPlaying) {
      node.play().catch(() => {});
      return;
    }
    node.pause();
  }, [isPlaying]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || globalSeekTime === null || !Number.isFinite(globalSeekTime)) return;
    node.currentTime = globalSeekTime;
  }, [globalSeekTime]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node || !Number.isFinite(currentTime)) return;
    if (Math.abs(node.currentTime - currentTime) > 1.5) {
      node.currentTime = currentTime;
    }
  }, [currentTime]);

  if (!src) return null;

  return (
    <video
      ref={videoRef}
      src={src}
      controls={false}
      muted={false}
      loop={false}
      playsInline
      className="w-full max-w-4xl max-h-[70vh] rounded-xl bg-black object-contain"
    />
  );
}
