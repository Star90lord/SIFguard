import React, { useState, useEffect } from 'react';
import { X, Building2, Check, Pencil } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

export default function EditSiteModal({ isOpen, onClose, site, onUpdateSite }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Rig Site');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && site) {
      setName(site.name || '');
      setCode(site.code || '');
      setLocation(site.location || 'Assam');
      setType(site.type || 'Rig Site');
      setStatus(site.status || 'Active');
      setError('');
      setIsSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, site]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a valid operational facility name.');
      return;
    }
    if (!code.trim()) {
      setError('Please provide an operational site code (e.g. RSB-002).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onUpdateSite({
        id: site.id,
        name: name.trim(),
        code: code.trim(),
        location: location.trim() || 'Assam',
        type,
        status,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update site configuration.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen || !site) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/45 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-[#111827] rounded-xl border border-[#D1D5DB] dark:border-[#263244] shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-[#263244]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <Pencil size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">Edit Operational Site</h3>
                <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                  Update configuration and facility metadata for <span className="font-semibold text-slate-700 dark:text-slate-200">{site.name}</span>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#172033] transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Site Name"
                  placeholder="e.g. Rig Site B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <Input
                  label="Site Code"
                  placeholder="e.g. RSB-002"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </div>

              <div>
                <Input
                  label="Location"
                  placeholder="e.g. Assam"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                />
              </div>

              <div>
                <Select
                  label="Site Type"
                  value={type}
                  onChange={(val) => setType(typeof val === 'object' && val?.target ? val.target.value : val)}
                  options={[
                    { value: 'Rig Site', label: 'Rig Site' },
                    { value: 'Processing Unit', label: 'Processing Unit' },
                    { value: 'Warehouse', label: 'Warehouse' },
                    { value: 'Workshop', label: 'Workshop' },
                    { value: 'Tank Farm', label: 'Tank Farm' },
                    { value: 'Pipeline Hub', label: 'Pipeline Hub' },
                  ]}
                />
              </div>

              <div>
                <Select
                  label="Operational Status"
                  value={status}
                  onChange={(val) => setStatus(typeof val === 'object' && val?.target ? val.target.value : val)}
                  options={[
                    { value: 'Active', label: 'Active (Online)' },
                    { value: 'Maintenance', label: 'Maintenance Mode' },
                    { value: 'Offline', label: 'Offline' },
                    { value: 'Standby', label: 'Standby / Warm Stack' },
                  ]}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#263244]">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={Check} loading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
