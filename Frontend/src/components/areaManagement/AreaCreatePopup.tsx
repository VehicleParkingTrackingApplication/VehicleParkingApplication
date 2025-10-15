import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { inputParkingArea, type CreateAreaPayload } from '@/services/parkingApi';

interface AreaCreatePopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

export default function AreaCreatePopup({ open, onClose, onSuccess }: AreaCreatePopupProps) {
  const [form, setForm] = useState<CreateAreaPayload>({
    name: '',
    capacity: 1,
    location: '',
    policy: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof CreateAreaPayload, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: field === 'capacity' ? Number(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.location.trim() || !form.capacity || form.capacity < 1) {
      setError('Name, location and a capacity ≥ 1 are required.');
      return;
    }
    try {
      setSubmitting(true);
      await inputParkingArea({
        name: form.name.trim(),
        location: form.location.trim(),
        capacity: form.capacity,
        policy: form.policy?.trim() || undefined
      });
      onSuccess('Area created successfully');
      onClose();
      setForm({ name: '', capacity: 1, location: '', policy: '' });
    } catch (err: any) {
      setError(err?.message || 'Failed to create area');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ left: '16rem' }}>
      {/* Blurry background overlay - only covers the main content area */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup content */}
      <div className="relative bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Create New Area</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-gray-700">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity" className="text-gray-700">Capacity</Label>
            <Input id="capacity" type="number" min={1} value={form.capacity} onChange={(e) => handleChange('capacity', e.target.value)} className="bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="text-gray-700">Location</Label>
            <textarea id="location" value={form.location} onChange={(e) => handleChange('location', e.target.value)} className="bg-white border-gray-300 text-gray-900 w-full min-h-[80px] rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy" className="text-gray-700">Policy (optional)</Label>
            <textarea id="policy" value={form.policy} onChange={(e) => handleChange('policy', e.target.value)} className="bg-white border-gray-300 text-gray-900 w-full min-h-[80px] rounded-md px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={submitting} onClick={onClose} className="border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


