import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, Eye, EyeOff, CheckCircle2, Circle, Check } from 'lucide-react';
import { useForgotPassword } from '../../hooks/useForgotPassword';

export default function ForgotPasswordModal() {
  const { forgotPasswordModalOpen } = useSelector((state) => state.auth);
  const {
    step, email, loading, error, resendCountdown, resendDisabled,
    passwordChecklist, handleRequestOtp, handleConfirm, handleResend,
    handleBack, handleClose, handleGoToLogin, updatePasswordChecklist, clearError,
  } = useForgotPassword();

  // Step 1 form state
  const [emailInput, setEmailInput] = useState('');

  // Step 2 form state
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Success auto-redirect countdown
  const [successCountdown, setSuccessCountdown] = useState(3);
  const successTimerRef = useRef(null);

  // Focus refs
  const emailRef = useRef(null);
  const otpRef = useRef(null);

  // Auto-focus email when modal opens (step1)
  useEffect(() => {
    if (forgotPasswordModalOpen && step === 'step1') {
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  }, [forgotPasswordModalOpen, step]);

  // Auto-focus OTP when transitioning to step2
  useEffect(() => {
    if (step === 'step2') {
      setTimeout(() => otpRef.current?.focus(), 50);
    }
  }, [step]);

  // Success state: auto-redirect after 3s
  useEffect(() => {
    if (step === 'success') {
      setSuccessCountdown(3);
      successTimerRef.current = setInterval(() => {
        setSuccessCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(successTimerRef.current);
            handleGoToLogin(email);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(successTimerRef.current);
  }, [step]);

  // Keyboard: close on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !loading) handleClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [loading, handleClose]);

  if (!forgotPasswordModalOpen) return null;

  const handleStep1Submit = (e) => {
    e.preventDefault();
    handleRequestOtp(emailInput);
  };

  const handleStep2Submit = (e) => {
    e.preventDefault();
    handleConfirm({ code: otp, newPassword, confirmPassword });
  };

  const handleBackClick = () => {
    handleBack();
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    updatePasswordChecklist('');
    setTimeout(() => emailRef.current?.focus(), 50);
  };

  const allPasswordValid =
    passwordChecklist.minLength &&
    passwordChecklist.hasUpper &&
    passwordChecklist.hasLower &&
    passwordChecklist.hasNumber &&
    passwordChecklist.hasSpecial;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) handleClose(); }}
    >
      <div className="bg-[#121212] w-full max-w-md rounded-xl p-8 relative shadow-2xl border border-[#282828]">

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/50 rounded-xl z-10 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-[#b3b3b3] hover:text-white disabled:opacity-40"
          onClick={handleClose}
          disabled={loading}
          aria-label="Đóng"
        >
          <X size={24} />
        </button>

        {/* ── SUCCESS STATE ── */}
        {step === 'success' && (
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Đặt lại mật khẩu thành công!</h2>
            <p className="text-[#b3b3b3] text-sm mb-6">
              Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <button
              onClick={() => { clearInterval(successTimerRef.current); handleGoToLogin(email); }}
              className="bg-green-500 text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition transform"
            >
              Đăng nhập ngay
            </button>
            <p className="text-[#b3b3b3] text-xs mt-3">
              Tự động chuyển hướng sau {successCountdown}s...
            </p>
          </div>
        )}

        {/* ── STEP 1: Enter email ── */}
        {step === 'step1' && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-2">Quên mật khẩu?</h2>
            <p className="text-[#b3b3b3] text-sm text-center mb-6">
              Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleStep1Submit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white">Email</label>
                <input
                  ref={emailRef}
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value.toLowerCase());
                    clearError();
                  }}
                  className="bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition"
                  placeholder="Email của bạn"
                  autoComplete="email"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-2 bg-green-500 text-black font-bold p-3 rounded-full hover:scale-105 transition transform disabled:opacity-50 disabled:hover:scale-100"
              >
                Gửi mã OTP
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={handleClose}
                className="text-[#b3b3b3] text-sm hover:text-white transition"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </>
        )}

        {/* ── STEP 2: Enter OTP + new password ── */}
        {step === 'step2' && (
          <>
            <h2 className="text-2xl font-bold text-white text-center mb-2">Đặt mật khẩu mới</h2>
            <p className="text-[#b3b3b3] text-sm text-center mb-6">
              Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP trong giây lát.
            </p>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-400 text-sm p-3 rounded mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleStep2Submit} className="flex flex-col gap-4">
              {/* OTP input */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white">Mã OTP</label>
                <input
                  ref={otpRef}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoComplete="one-time-code"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); clearError(); }}
                  className="bg-[#121212] border border-[#727272] text-white p-3 rounded hover:border-white focus:border-white focus:outline-none transition text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              {/* New password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      updatePasswordChecklist(e.target.value);
                      clearError();
                    }}
                    className="w-full bg-[#121212] border border-[#727272] text-white p-3 pr-10 rounded hover:border-white focus:border-white focus:outline-none transition"
                    placeholder="Mật khẩu mới"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password checklist */}
                {newPassword.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1">
                    {[
                      { key: 'minLength', label: 'Tối thiểu 8 ký tự' },
                      { key: 'hasUpper', label: 'Có chữ hoa (A-Z)' },
                      { key: 'hasLower', label: 'Có chữ thường (a-z)' },
                      { key: 'hasNumber', label: 'Có số (0-9)' },
                      { key: 'hasSpecial', label: 'Có ký tự đặc biệt (!@#$%...)' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center gap-2">
                        {passwordChecklist[key]
                          ? <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
                          : <Circle size={14} className="text-[#727272] flex-shrink-0" />
                        }
                        <span className={`text-xs ${passwordChecklist[key] ? 'text-green-400' : 'text-[#b3b3b3]'}`}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-white">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                    className="w-full bg-[#121212] border border-[#727272] text-white p-3 pr-10 rounded hover:border-white focus:border-white focus:outline-none transition"
                    placeholder="Nhập lại mật khẩu"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] hover:text-white"
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-xs">Mật khẩu xác nhận không khớp</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !allPasswordValid}
                className="mt-2 bg-green-500 text-black font-bold p-3 rounded-full hover:scale-105 transition transform disabled:opacity-50 disabled:hover:scale-100"
              >
                Đặt lại mật khẩu
              </button>
            </form>

            {/* Resend OTP */}
            <div className="mt-4 text-center">
              <span className="text-[#b3b3b3] text-sm">Không nhận được mã? </span>
              <button
                onClick={handleResend}
                disabled={resendDisabled || loading}
                className="text-sm text-white hover:text-green-400 transition disabled:text-[#727272] disabled:cursor-not-allowed"
              >
                {resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại mã'}
              </button>
            </div>

            <div className="mt-3 text-center">
              <button
                onClick={handleBackClick}
                disabled={loading}
                className="text-[#b3b3b3] text-sm hover:text-white transition disabled:opacity-40"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
