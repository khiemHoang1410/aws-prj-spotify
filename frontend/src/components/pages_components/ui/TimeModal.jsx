// TimerModal.jsx
import "./TimeModal.css";

function TimerModal({ isOpen, onClose, onSetTimer }) {
  if (!isOpen) return null;

  const handleSave = () => {
    const hours = Number(document.querySelector('input[name="hours"]').value) || 0;
    const minutes = Number(document.querySelector('input[name="minutes"]').value) || 0;
    onSetTimer(hours, minutes);
  };

  return (
    <div className="timer-modal" onClick={(e) => e.stopPropagation()}>
      <div className="timer-modal-content">
        <h2>Hẹn Giờ Dừng Phát Nhạc</h2>
        <div className="timer-inputs">
          <input type="number" min="0" name="hours" placeholder="Giờ" defaultValue="00" /> Giờ :{" "}
          <input type="number" min="0" name="minutes" placeholder="Phút" defaultValue="00" /> Phút
        </div>
        <p>Chọn thời gian để dừng phát nhạc</p>
        <div className="timer-buttons">
          <button className="save-button" onClick={handleSave}>
            LƯU LẠI
          </button>
          <button className="cancel-button" onClick={onClose}>
            HỦY
          </button>
        </div>
      </div>
    </div>
  );
}

export default TimerModal;