import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { fetchAuthApi, putAuthApi } from '../services/api';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchAuthApi('auth/me');
        if (!res.ok) throw new Error('Failed to fetch current user');
        const me = await res.json();
        if (me?.profileCompleted) {
          navigate('/dashboard', { replace: true });
          return;
        }
        setFirstName(me?.firstName || '');
        setLastName(me?.lastName || '');
        setLoading(false);
      } catch (e) {
        setError('Unable to load profile. Please sign in again.');
        setLoading(false);
      }
    };
    load();
  }, [navigate]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      setError('First name and last name are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await putAuthApi('account/update-name', {}, JSON.stringify({ firstName, lastName, phoneNumber, address }));
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to save profile' }));
        throw new Error(err.message || 'Failed to save profile');
      }
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white p-8">Loading...</div>;

  return (
    <div className="flex min-h-screen items-center justify-center p-6"style={{ background: 'linear-gradient(to bottom right, #677ae5, #6f60c0)' }}>
      
      <Card className="w-full max-w-lg bg-white/10 backdrop-blur-xl border border-white/20 text-white">
        <CardContent className="pt-6 space-y-4">
          <h2 className="text-2xl font-semibold text-center">Wait a minute! Complete Your Profile</h2>
          {error && <div className="text-red-300 text-sm text-center bg-red-500/20 p-3 rounded-lg border border-red-500/30">{error}</div>}
          <form onSubmit={handleSave} className="space-y-4">
            <Input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-black/20 border-white/20 text-white placeholder-gray-400" />
            <Input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-black/20 border-white/20 text-white placeholder-gray-400" />
            <Input placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="bg-black/20 border-white/20 text-white placeholder-gray-400" />
            <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-black/20 border-white/20 text-white placeholder-gray-400" />
            <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" disabled={saving}>
              {saving ? 'Saving...' : 'Save and Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
