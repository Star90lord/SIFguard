import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

export default function UploadDropzone({ onFilesSelect, className = '' }) {
  const fileInputRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover' || e.type === 'dragenter') {
      setIsDragOver(true);
    } else if (e.type === 'dragleave') {
      setIsDragOver(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelect(filesArray);
    }
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelect(filesArray);
      // Reset input value so the same files can be re-selected if removed
      e.target.value = '';
    }
  }

  return (
    <div
      onDragOver={handleDrag}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative border-2 border-dashed rounded-xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-150 select-none ${
        isDragOver
          ? 'border-blue-600 bg-blue-50/50 scale-[0.995]'
          : 'border-slate-300 hover:border-slate-400 bg-white shadow-2xs'
      } ${className}`}
      role="button"
      tabIndex={0}
      aria-label="Upload multiple safety report documents"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-600 mb-3.5">
        <Upload size={22} className="text-slate-700" />
      </div>

      <h4 className="text-sm font-semibold text-slate-900 mb-1">
        Drop multiple safety reports here
      </h4>
      <p className="text-xs text-slate-500 max-w-sm mx-auto mb-3">
        or{' '}
        <span className="text-blue-600 font-semibold underline underline-offset-2">
          browse files
        </span>{' '}
        from your computer
      </p>

      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] font-medium text-slate-500">
        <span>PDF, DOCX, TXT</span>
        <span>•</span>
        <span>Multiple files supported</span>
      </div>
    </div>
  );
}
