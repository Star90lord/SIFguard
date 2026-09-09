import React, { useState, useEffect } from 'react';
import { X, Building2, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';

export default function AddSiteModal({ isOpen, onClose, onAddSite }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Rig Site');
  const [status, setStatus] = useState('Active');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setCode('');
      setLocation('Assam');
      setType('Rig Site');
      setStatus('Active');
      setError('');
      setIsSubmitting(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Automatically suggest a clean code when name changes
  function handleNameChange(val) {
    setName(val);
    if (!code || code.startsWith('RS-') || code.startsWith('SITE-')) {
      const parts = val.trim().split(/\s+/);
      const acronym = parts.map((p) => p[0]).join('').toUpperCase().slice(0, 4);
      if (acronym.length >= 2) {
        setCode(`${acronym}-00${Math.floor(Math.random() * 8 + 3)}`);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a valid operational site name.');
      return;
    }
    if (!code.trim()) {
      setError('Please provide a unique site code (e.g. RSC-003).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onAddSite({
        name: name.trim(),
        code: code.trim(),
        location: location.trim() || 'Assam',
        type,
        status,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register site record.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/45 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="min-h-full flex items-center justify-center p-4">
        <div className="relative bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Add Operational Site</h3>
                <p className="text-xs text-slate-500 mt-0.5">Register a new facility for safety telemetry monitoring.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Site Name"
                  placeholder="e.g. Rig Site C"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div>
                <Input
                  label="Site Code"
                  placeholder="e.g. RSC-003"
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
                    { value: 'Standby', label: 'Standby / Warm Stack' },
                  ]}
                />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" icon={Plus} loading={isSubmitting}>
                Add Site
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
