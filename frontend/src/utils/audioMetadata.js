/**
 * audioMetadata.js — Extract duration from MP3 file using Web Audio API
 * Fallback gracefully to null if parsing fails (user must input manually)
 */

/**
 * Parse MP3 duration using Web Audio API
 * @param {File} file - Audio file (MP3, WAV, etc.)
 * @returns {Promise<number|null>} Duration in seconds, or null if parse fails
 */
export const parseMp3Duration = async (file) => {
  if (!file) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // Tạo AudioContext để decode audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const arrayBuffer = e.target.result;
        
        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Lấy duration (tính bằng giây)
        const durationSeconds = Math.round(audioBuffer.duration);
        
        resolve(durationSeconds);
      } catch (err) {
        console.warn('Failed to parse audio metadata:', err.message);
        // Fallback: user must input manually
        resolve(null);
      }
    };

    reader.onerror = () => {
      console.warn('FileReader error when reading audio file');
      resolve(null);
    };

    // Start reading file as ArrayBuffer
    reader.readAsArrayBuffer(file);
  });
};
