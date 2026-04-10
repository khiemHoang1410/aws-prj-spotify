import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { openModal, openForgotPasswordModal, closeForgotPasswordModal, setLoginPrefillEmail } from '../store/authSlice';
import { forgotPassword, confirmForgotPassword } from '../services/AuthService';

const SESSION_KEY = 'forgotPassword_email';

export const getPasswordChecklist = (password) => ({
  minLength: password.length >= 8,
  hasUpper: /[A-Z]/.test(password),
  hasLower: /[a-z]/.test(password),
  hasNumber: /[0-9]/.test(password),
  hasSpecial: /[^A-Za-z0-9]/.test(password),
});

const normalizeEmail = (email) => email.toLowerCase().trim();

export const useForgotPassword = () => {
  const dispatch = useDispatch();

  // Restore from sessionStorage on mount
  const savedEmail = typeof window !== 'undefined'
    ? sessionStorage.getItem(SESSION_KEY) ?? ''
    : '';

  const [step, setStep] = useState(savedEmail ? 'step2' : 'step1');
  const [email, setEmail] = useState(savedEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [passwordChecklist, setPasswordChecklist] = useState(getPasswordChecklist(''));

  const countdownRef = useRef(null);

  const clearError = useCallback(() => setError(null), []);

  const startCountdown = useCallback((seconds) => {
    setResendCountdown(seconds);
    setResendDisabled(true);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setResendDisabled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => clearInterval(countdownRef.current);
  }, []);

  const handleRequestOtp = useCallback(async (rawEmail) => {
    const normalized = normalizeEmail(rawEmail);
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(normalized);
      setEmail(normalized);
      sessionStorage.setItem(SESSION_KEY, normalized);
      setStep('step2');
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleConfirm = useCallback(async ({ code, newPassword, confirmPassword }) => {
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    const trimmedCode = code.trim();
    setLoading(true);
    setError(null);
    try {
      await confirmForgotPassword(email, trimmedCode, newPassword);
      sessionStorage.removeItem(SESSION_KEY);
      setStep('success');
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  }, [email]);

  const handleResend = useCallback(async () => {
    // Disable immediately to prevent race condition
    setResendDisabled(true);
    setError(null);
    try {
      await forgotPassword(email);
      startCountdown(60);
    } catch (err) {
      setError(err.message || 'Đã có lỗi xảy ra, vui lòng thử lại');
      startCountdown(60); // still lock for 60s on limit exceeded
    }
  }, [email, startCountdown]);

  const handleBack = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setStep('step1');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    dispatch(closeForgotPasswordModal());
  }, [dispatch]);

  const handleGoToLogin = useCallback((prefillEmail) => {
    sessionStorage.removeItem(SESSION_KEY);
    dispatch(closeForgotPasswordModal());
    dispatch(setLoginPrefillEmail(prefillEmail || email));
    dispatch(openModal('login'));
  }, [dispatch, email]);

  const updatePasswordChecklist = useCallback((password) => {
    setPasswordChecklist(getPasswordChecklist(password));
  }, []);

  return {
    step,
    email,
    loading,
    error,
    resendCountdown,
    resendDisabled,
    passwordChecklist,
    handleRequestOtp,
    handleConfirm,
    handleResend,
    handleBack,
    handleClose,
    handleGoToLogin,
    updatePasswordChecklist,
    clearError,
  };
};
