import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { inputParkingArea, type CreateAreaPayload } from '@/services/parking';

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

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-neutral-900 text-white border-neutral-700">
        <DialogHeader>
          <DialogTitle>Create New Area</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900/60 text-red-200 border border-red-700 rounded px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity</Label>
            <Input id="capacity" type="number" min={1} value={form.capacity} onChange={(e) => handleChange('capacity', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <textarea id="location" value={form.location} onChange={(e) => handleChange('location', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white w-full min-h-[80px] rounded-md px-3 py-2" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="policy">Policy (optional)</Label>
            <textarea id="policy" value={form.policy} onChange={(e) => handleChange('policy', e.target.value)} className="bg-neutral-800 border-neutral-700 text-white w-full min-h-[80px] rounded-md px-3 py-2" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" disabled={submitting} onClick={onClose} className="border-neutral-700 text-gray-300">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
              {submitting ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


