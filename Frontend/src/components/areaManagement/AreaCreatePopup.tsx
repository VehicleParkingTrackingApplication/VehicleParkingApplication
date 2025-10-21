import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AreaCreatePopupProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (message?: string) => void;
}

export default function AreaCreatePopup({ open, onClose, onSuccess }: AreaCreatePopupProps) {
  const [ftpConfig, setFtpConfig] = useState({
    protocol: '',
    encryption: '',
    host: '',
    port: '',
    username: '',
    password: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleFtpChange = (field: keyof typeof ftpConfig, value: string) => {
    setFtpConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      // TODO: Implement FTP server creation logic
      onSuccess('FTP Server configured successfully');
      onClose();
      setFtpConfig({ protocol: '', encryption: '', host: '', port: '', username: '', password: '' });
    } catch (err: any) {
      setError(err?.message || 'Failed to configure FTP server');
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
          <h2 className="text-xl font-semibold text-gray-900">FTP Server Configuration</h2>
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
            <Label htmlFor="protocol" className="text-gray-700">Protocol</Label>
            <Select value={ftpConfig.protocol} onValueChange={(value) => handleFtpChange('protocol', value)}>
              <SelectTrigger className="bg-gray-100 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm">
                <SelectValue placeholder="Select Protocol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ftp">FTP</SelectItem>
                <SelectItem value="ftps">FTPS</SelectItem>
                <SelectItem value="sftp">SFTP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="encryption" className="text-gray-700">Encryption</Label>
            <Input 
              id="encryption" 
              value={ftpConfig.encryption} 
              onChange={(e) => handleFtpChange('encryption', e.target.value)} 
              placeholder="Enter Encryption details"
              className="bg-gray-100 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="host" className="text-gray-700">Host</Label>
            <Input 
              id="host" 
              value={ftpConfig.host} 
              onChange={(e) => handleFtpChange('host', e.target.value)} 
              placeholder="Enter Host details"
              className="bg-gray-100 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="port" className="text-gray-700">Port</Label>
            <Input 
              id="port" 
              value={ftpConfig.port} 
              onChange={(e) => handleFtpChange('port', e.target.value)} 
              placeholder="Enter Port details"
              className="bg-gray-100 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-700">Username</Label>
            <Input 
              id="username" 
              value={ftpConfig.username} 
              onChange={(e) => handleFtpChange('username', e.target.value)} 
              placeholder="Enter User Name"
              className="bg-gray-100 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                value={ftpConfig.password} 
                onChange={(e) => handleFtpChange('password', e.target.value)} 
                placeholder="Enter Password"
                className="bg-gray-100 border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 shadow-sm pr-10" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
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


