import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { fetchAuthApi, putAuthApi } from '../services/api';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
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
        setCompany(me?.company || '');
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
      const res = await putAuthApi('account/update-name', {}, JSON.stringify({ firstName, lastName, company }));
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

  if (loading) return <div className="text-black p-8">Loading...</div>;

  return (
    <div className="flex flex-col min-h-screen text-white relative overflow-hidden" style={{ backgroundColor: '#2361c6' }}>
      {/* Animated Background Glass Effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></motion.div>
        <motion.div animate={{ x: [0, -40, 0], y: [0, 20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-2xl transform -translate-x-40 translate-y-40"></motion.div>
      </div>

      {/* Navigation Bar */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 py-4 absolute top-0 left-0 right-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-lg bg-white/5 rounded-2xl px-6 py-2 border border-white/10 shadow-xl">
          <div className="flex items-center">
            <img src="/assets/Logo.png" alt="MoniPark" className="w-24 h-24 object-contain" />
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10 hover:text-yellow-400 flex items-center gap-2" 
              onClick={() => navigate('/')}
            >
              <ArrowLeft size={16} />
              Back to Home
            </Button>
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium" 
              onClick={() => navigate('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Main Complete Profile Content */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10 pt-32 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <Card className="w-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-2xl font-semibold text-center">Wait a minute! Complete Your Profile</h2>
              {error && <div className="text-red-300 text-sm text-center bg-red-500/20 p-3 rounded-lg border border-red-500/30">{error}</div>}
              <form onSubmit={handleSave} className="space-y-4">
                <Input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-black/20 border-white/20 text-white placeholder-gray-400" />
                <Input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-black/20 border-white/20 text-white placeholder-gray-400" />
                <Input placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} className="bg-black/20 border-white/20 text-white placeholder-gray-400" />
                <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-black" disabled={saving}>
                  {saving ? 'Saving...' : 'Save and Continue'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
