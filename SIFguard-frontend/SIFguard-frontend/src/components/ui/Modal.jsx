import React, { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function Modal({
  isOpen = false,
  onClose,
  title = 'Confirmation',
  description = '',
  icon: CustomIcon = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
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
      <div className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-10 animate-in zoom-in-95 duration-150">
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0">
                {CustomIcon ? <CustomIcon size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div>
                <h3 id="modal-title" className="text-base font-bold text-slate-900 leading-snug">
                  {title}
                </h3>
                {description && (
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <X size={16} />
            </button>
          </div>

          {children && <div className="mt-4">{children}</div>}

          <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button variant="secondary" size="sm" onClick={onClose}>
              {cancelLabel}
            </Button>
            {onConfirm && (
              <Button
                variant={confirmVariant}
                size="sm"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
              >
                {confirmLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
