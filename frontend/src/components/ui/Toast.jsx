import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { hideToast } from '../../store/uiSlice';
import { CheckCircle, Info, AlertTriangle, XCircle } from 'lucide-react';
import { TOAST_TYPE } from '../../constants/enums';

const TOAST_CONFIG = {
  [TOAST_TYPE.SUCCESS]: {
    icon: CheckCircle,
    className: 'bg-green-900/90 border-green-700 text-green-100',
  },
  [TOAST_TYPE.ERROR]: {
    icon: XCircle,
    className: 'bg-red-900/90 border-red-700 text-red-100',
  },
  [TOAST_TYPE.WARNING]: {
    icon: AlertTriangle,
    className: 'bg-yellow-900/90 border-yellow-700 text-yellow-100',
  },
  [TOAST_TYPE.INFO]: {
    icon: Info,
    className: 'bg-neutral-800/95 border-neutral-600 text-white',
  },
};

export default function Toast() {
  const dispatch = useDispatch();
  const { message, type, visible } = useSelector((state) => state.ui.toast);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => dispatch(hideToast()), 3000);
    return () => clearTimeout(timer);
  }, [visible, message, dispatch]);

  if (!visible) return null;

  const config = TOAST_CONFIG[type] || TOAST_CONFIG[TOAST_TYPE.INFO];
  const Icon = config.icon;

  return (
    <div
      className={`fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-lg border shadow-xl transition-all ${config.className}`}
    >
      <Icon size={18} className="flex-shrink-0" />
      <span className="text-sm font-medium whitespace-nowrap">{message}</span>
    </div>
  );
}
