import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function Modal({
  isOpen = false,
  onClose,
  title = 'Confirmation',
  description = '',
  icon: CustomIcon = null,
  iconBg,
  iconColor,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  confirmLoading = false,
  confirmDisabled = false,
  confirmIcon: ConfirmIcon = null,
  onConfirm,
  footer,
  maxWidth = 'max-w-md',
  children,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Surface */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-[#111827] rounded-2xl border border-[#CBD5E1] dark:border-[#263244] shadow-xl overflow-hidden z-10 animate-in zoom-in-95 duration-150`}>
        <div className="p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                iconBg || 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60'
              } ${iconColor || 'text-amber-700 dark:text-amber-400'}`}>
                {CustomIcon ? <CustomIcon size={20} /> : <AlertTriangle size={20} />}
              </div>
              <div>
                <h3 id="modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#F8FAFC] leading-snug">
                  {title}
                </h3>
                {description && (
                  <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-[#94A3B8] leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#172033] transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>

          {children && <div className="mt-4">{children}</div>}

          {footer !== undefined ? (
            footer
          ) : (
            <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-[#E2E8F0] dark:border-[#263244]">
              <Button variant="secondary" size="sm" onClick={onClose}>
                {cancelLabel}
              </Button>
              {onConfirm && (
                <Button
                  variant={confirmVariant}
                  size="sm"
                  loading={confirmLoading}
                  disabled={confirmDisabled || confirmLoading}
                  icon={ConfirmIcon}
                  onClick={() => {
                    onConfirm();
                  }}
                >
                  {confirmLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
