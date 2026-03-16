import React from "react";
import "./LoginModal.css";

function LoginModal({ isOpen, onClose, onLoginRedirect, onSignupRedirect}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {/* Background Image */}
        <div className="modal-image">
          <img
            src="http://localhost:8000/static/images/modal.png"
            alt="Modal Background"
          />
        </div>

        {/* Modal Text and Buttons */}
        <div className="modal-text">
          <h2>Bắt đầu nghe bằng tài khoản Spotify Free</h2>
          <button className="login-Btn" onClick={onSignupRedirect}>
            Đăng ký miễn phí
          </button>
          <button className="signup-Btn" onClick={onSignupRedirect}>
            Tải ứng dụng
          </button>
          <p>
            Bạn đã có tài khoản?{" "}
            <span className="login-link" onClick={onLoginRedirect}>
              Đăng nhập
            </span>
          </p>
        </div>

      </div>
      
        {/* Close Button */}
        <button className="close-Btn" onClick={onClose}>
          Đóng
        </button>
    </div>
  );
}

export default LoginModal;