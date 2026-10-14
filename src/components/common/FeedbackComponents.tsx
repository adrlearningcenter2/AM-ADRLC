import React, { ReactNode } from 'react';
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Inbox,
  X,
  AlertOctagon
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/* 1. PageSkeleton                                                            */
/* -------------------------------------------------------------------------- */
export const PageSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-4 animate-pulse p-2 sm:p-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-48 sm:w-64 bg-stone-200 rounded-lg" />
          <div className="h-3.5 w-32 bg-stone-200 rounded-md" />
        </div>
        <div className="h-9 w-24 bg-stone-200 rounded-xl" />
      </div>

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pt-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
            <div className="flex justify-between">
              <div className="h-3 w-16 bg-stone-200 rounded" />
              <div className="h-5 w-5 bg-stone-200 rounded-md" />
            </div>
            <div className="h-7 w-20 bg-stone-300 rounded-lg" />
            <div className="h-2.5 w-full bg-stone-100 rounded" />
          </div>
        ))}
      </div>

      {/* Content list / card skeleton */}
      <div className="space-y-3 pt-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-40 sm:w-56 bg-stone-200 rounded" />
              <div className="h-5 w-16 bg-stone-200 rounded-full" />
            </div>
            <div className="h-3 w-3/4 bg-stone-100 rounded" />
            <div className="h-8 w-28 bg-stone-200 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. LoadingSpinner                                                          */
/* -------------------------------------------------------------------------- */
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}> = ({ size = 'md', label, className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2.5 text-stone-600 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-[#651D2A]`} />
      {label && <span className="text-xs font-medium text-stone-500">{label}</span>}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. ButtonLoading                                                           */
/* -------------------------------------------------------------------------- */
export const ButtonLoading: React.FC<{
  label?: string;
  className?: string;
}> = ({ label = 'Memproses...', className = '' }) => {
  return (
    <span className={`inline-flex items-center justify-center gap-2 ${className}`}>
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{label}</span>
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Standalone Toasts (SuccessToast, ErrorToast, WarningToast)              */
/* -------------------------------------------------------------------------- */
export const SuccessToast: React.FC<{ message: string; onClose?: () => void }> = ({
  message,
  onClose,
}) => (
  <div className="rounded-xl p-3.5 bg-emerald-900 text-white border border-emerald-700 flex items-center justify-between gap-3 shadow-lg text-xs">
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span>{message}</span>
    </div>
    {onClose && (
      <button onClick={onClose} className="p-1 hover:bg-emerald-800 rounded">
        <X className="w-3.5 h-3.5 text-white/70" />
      </button>
    )}
  </div>
);

export const ErrorToast: React.FC<{ message: string; onClose?: () => void }> = ({
  message,
  onClose,
}) => (
  <div className="rounded-xl p-3.5 bg-rose-950 text-white border border-rose-800 flex items-center justify-between gap-3 shadow-lg text-xs">
    <div className="flex items-center gap-2">
      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
      <span>{message}</span>
    </div>
    {onClose && (
      <button onClick={onClose} className="p-1 hover:bg-rose-900 rounded">
        <X className="w-3.5 h-3.5 text-white/70" />
      </button>
    )}
  </div>
);

export const WarningToast: React.FC<{ message: string; onClose?: () => void }> = ({
  message,
  onClose,
}) => (
  <div className="rounded-xl p-3.5 bg-amber-900 text-white border border-amber-700 flex items-center justify-between gap-3 shadow-lg text-xs">
    <div className="flex items-center gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <span>{message}</span>
    </div>
    {onClose && (
      <button onClick={onClose} className="p-1 hover:bg-amber-800 rounded">
        <X className="w-3.5 h-3.5 text-white/70" />
      </button>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* 5. ConfirmDialog                                                           */
/* -------------------------------------------------------------------------- */
export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Ya, Lanjutkan',
  cancelLabel = 'Batal',
  type = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[150] bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden"
      >
        <div className="p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                type === 'danger'
                  ? 'bg-rose-100 text-rose-700'
                  : type === 'warning'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-stone-100 text-[#651D2A]'
              }`}
            >
              {type === 'danger' ? (
                <AlertOctagon className="w-5 h-5" />
              ) : type === 'warning' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <h3 className="font-bold text-base text-stone-900 leading-snug">{title}</h3>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">{message}</p>
        </div>

        <div className="bg-stone-50 border-t border-stone-200 px-5 py-3.5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-200 border border-stone-300 transition-colors cursor-pointer touch-press disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer touch-press disabled:opacity-50 flex items-center gap-2 ${
              type === 'danger'
                ? 'bg-rose-700 hover:bg-rose-800'
                : type === 'warning'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-[#651D2A] hover:bg-[#4B141E]'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 6. MobileBottomSheet                                                       */
/* -------------------------------------------------------------------------- */
export const MobileBottomSheet: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[120] bg-stone-950/60 backdrop-blur-xs flex flex-col justify-end md:items-center md:justify-center p-0 md:p-4 animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full md:max-w-xl max-h-[88vh] bg-white rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom,16px)]">
        {/* Handle bar on mobile */}
        <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto mt-3 md:hidden" />

        <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-base text-stone-900">{title}</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[75vh] space-y-4">{children}</div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 7. EmptyState                                                              */
/* -------------------------------------------------------------------------- */
export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div
      className={`rounded-2xl border-2 border-dashed border-stone-200 bg-white/60 p-8 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 text-stone-400 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-sm sm:text-base text-stone-800">{title}</h3>
      {description && <p className="text-xs text-stone-500 mt-1 max-w-sm leading-relaxed">{description}</p>}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-[#651D2A] hover:bg-[#4B141E] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer touch-press"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 8. RetryState                                                              */
/* -------------------------------------------------------------------------- */
export const RetryState: React.FC<{
  title?: string;
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
}> = ({
  title = 'Gagal Memuat Data',
  message,
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-rose-200 bg-rose-50/70 p-6 text-center flex flex-col items-center justify-center max-w-md mx-auto my-6"
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-sm sm:text-base text-rose-950">{title}</h3>
      <p className="text-xs text-rose-800 mt-1.5 leading-relaxed">{message}</p>
      <button
        type="button"
        disabled={isRetrying}
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer touch-press disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>{isRetrying ? 'Menghubungkan Ulang...' : 'Coba Lagi'}</span>
      </button>
    </div>
  );
};
