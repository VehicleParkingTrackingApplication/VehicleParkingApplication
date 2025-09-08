import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { putAuthApi } from '../../services/api';

interface FtpServerConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  secureOptions: string;
}

interface FtpServerEditPopupProps {
  isOpen: boolean;
  onClose: () => void;
  areaId: string;
  currentFtpServer?: string;
  onSuccess: () => void;
}

export function FtpServerEditPopup({
  isOpen,
  onClose,
  areaId,
  currentFtpServer,
  onSuccess
}: FtpServerEditPopupProps) {
  const [formData, setFormData] = useState<FtpServerConfig>({
    host: '',
    port: 21,
    user: '',
    password: '',
    secure: false,
    secureOptions: 'implicit'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Parse current FTP server string if provided
  useEffect(() => {
    if (currentFtpServer && isOpen) {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(currentFtpServer);
        setFormData({
          host: parsed.host || '',
          port: parsed.port || 21,
          user: parsed.user || '',
          password: parsed.password || '',
          secure: parsed.secure || false,
          secureOptions: parsed.secureOptions || 'implicit'
        });
      } catch {
        // If not JSON, treat as simple string (host only)
        setFormData(prev => ({
          ...prev,
          host: currentFtpServer
        }));
      }
    }
  }, [currentFtpServer, isOpen]);

  const handleInputChange = (field: keyof FtpServerConfig, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate required fields
      if (!formData.host.trim()) {
        throw new Error('Host is required');
      }
      if (!formData.user.trim()) {
        throw new Error('Username is required');
      }
      if (!formData.password.trim()) {
        throw new Error('Password is required');
      }

      // Create FTP server configuration object
      const ftpConfig = {
        host: formData.host.trim(),
        port: formData.port,
        user: formData.user.trim(),
        password: formData.password.trim(),
        secure: formData.secure,
        secureOptions: formData.secureOptions
      };

      // Convert to JSON string for storage
      const ftpServerString = JSON.stringify(ftpConfig);

      // Send to API
      const response = await putAuthApi(`parking/area/${areaId}/ftp-server`, undefined, JSON.stringify({
        ftpServer: ftpServerString
      }));

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to update FTP server: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('Error updating FTP server:', err);
      setError(err instanceof Error ? err.message : 'Failed to update FTP server');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-800 border-neutral-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Edit FTP Server Configuration</DialogTitle>
          <DialogDescription className="text-gray-400">
            Configure the FTP server settings for this parking area.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="host" className="text-sm font-medium text-gray-300">
                Host *
              </label>
              <Input
                id="host"
                type="text"
                value={formData.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
                placeholder="ftp.example.com"
                className="bg-neutral-700 border-neutral-600 text-white placeholder-gray-400"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="port" className="text-sm font-medium text-gray-300">
                Port
              </label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) => handleInputChange('port', parseInt(e.target.value) || 21)}
                placeholder="21"
                min="1"
                max="65535"
                className="bg-neutral-700 border-neutral-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="user" className="text-sm font-medium text-gray-300">
              Username *
            </label>
            <Input
              id="user"
              type="text"
              value={formData.user}
              onChange={(e) => handleInputChange('user', e.target.value)}
              placeholder="ftp_user"
              className="bg-neutral-700 border-neutral-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Password *
            </label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="••••••••"
              className="bg-neutral-700 border-neutral-600 text-white placeholder-gray-400"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="secure"
              checked={formData.secure}
              onCheckedChange={(checked) => handleInputChange('secure', checked === true)}
              className="border-neutral-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
            />
            <label htmlFor="secure" className="text-sm font-medium text-gray-300">
              Use secure connection (FTPS)
            </label>
          </div>

          {formData.secure && (
            <div className="space-y-2">
              <label htmlFor="secureOptions" className="text-sm font-medium text-gray-300">
                Secure Options
              </label>
              <Select
                value={formData.secureOptions}
                onValueChange={(value) => handleInputChange('secureOptions', value)}
              >
                <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                  <SelectValue placeholder="Select secure option" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-700 border-neutral-600">
                  <SelectItem value="implicit" className="text-white hover:bg-neutral-600">
                    Implicit (FTPS)
                  </SelectItem>
                  <SelectItem value="explicit" className="text-white hover:bg-neutral-600">
                    Explicit (FTPES)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {loading ? 'Saving...' : 'Save Configuration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}