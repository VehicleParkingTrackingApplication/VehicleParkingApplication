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
import { checkFtpServerStatus, saveFtpServer } from '../../services/parkingApi';

interface FtpServerConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  secure: boolean;
  secureOptions: string;
  rejectUnauthorized: boolean;
  selectedFolder?: string;
}

interface FolderInfo {
  name: string;
  size: number;
  modifiedAt: string;
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
    secureOptions: 'implicit',
    rejectUnauthorized: false,
    selectedFolder: ''
  });
  const [loading, setLoading] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [availableFolders, setAvailableFolders] = useState<FolderInfo[]>([]);

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
          secureOptions: parsed.secureOptions || 'implicit',
          rejectUnauthorized: parsed.rejectUnauthorized || false,
          selectedFolder: parsed.selectedFolder || ''
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
    setConnectionStatus(null); // Clear connection status when form changes
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
        secureOptions: formData.secure ? {
          rejectUnauthorized: formData.rejectUnauthorized
        } : undefined,
        selectedFolder: formData.selectedFolder || undefined
      };

      // Convert to JSON string for storage
      // const ftpServerString = JSON.stringify(ftpConfig);

      // Send to API
      const response = await saveFtpServer(areaId, ftpConfig);

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        const errorText = await response.text();
        throw new Error(`Failed to save FTP server: ${response.status} ${errorText}`);
      }
    } catch (err) {
      console.error('Error save FTP server:', err);
      setError(err instanceof Error ? err.message : 'Failed to save FTP server');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckConnection = async () => {
    setCheckingConnection(true);
    setError('');
    setConnectionStatus(null);

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
        secureOptions: formData.secure ? {
          rejectUnauthorized: formData.rejectUnauthorized
        } : undefined,
        selectedFolder: formData.selectedFolder || undefined
      };

      // Send to API
      const response = await checkFtpServerStatus(areaId, ftpConfig);
      if (response.success) {
        setConnectionStatus({
          success: true,
          message: response.data.message || 'Connection successful!'
        });
        
        // Set available folders if they exist in the response
        if (response.data.availableFolders && Array.isArray(response.data.availableFolders)) {
          setAvailableFolders(response.data.availableFolders);
        } else {
          setAvailableFolders([]);
        }
      } else {
        const errorText = await response.text();
        setConnectionStatus({
          success: false,
          message: `Connection failed: ${response.status} ${errorText}`
        });
        setAvailableFolders([]);
      }
    } catch (err) {
      console.error('Error checking FTP connection:', err);
      setConnectionStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Failed to check connection'
      });
      setAvailableFolders([]);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleClose = () => {
    if (!loading && !checkingConnection) {
      setError('');
      setConnectionStatus(null);
      setAvailableFolders([]);
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

          {connectionStatus && (
            <div className={`rounded-lg p-3 text-sm ${
              connectionStatus.success 
                ? 'bg-green-900 border border-green-700 text-green-200' 
                : 'bg-red-900 border border-red-700 text-red-200'
            }`}>
              {connectionStatus.message}
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

          {availableFolders.length > 0 && (
            <div className="space-y-2">
              <label htmlFor="folder" className="text-sm font-medium text-gray-300">
                Select Folder
              </label>
              <Select
                value={formData.selectedFolder || ''}
                onValueChange={(value) => handleInputChange('selectedFolder', value)}
              >
                <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                  <SelectValue placeholder="Choose a folder..." />
                </SelectTrigger>
                <SelectContent className="bg-neutral-700 border-neutral-600">
                  {availableFolders.map((folder) => (
                    <SelectItem 
                      key={folder.name} 
                      value={folder.name}
                      className="text-white hover:bg-neutral-600"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{folder.name}</span>
                        <span className="text-xs text-gray-400">
                          Modified: {new Date(folder.modifiedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <div className="space-y-4">
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
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rejectUnauthorized"
                  checked={formData.rejectUnauthorized}
                  onCheckedChange={(checked) => handleInputChange('rejectUnauthorized', checked === true)}
                  className="border-neutral-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label htmlFor="rejectUnauthorized" className="text-sm font-medium text-gray-300">
                  Reject unauthorized certificates
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading || checkingConnection}
              className="bg-neutral-700 border-neutral-600 text-white hover:bg-neutral-600"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCheckConnection}
              disabled={loading || checkingConnection || !formData.host.trim() || !formData.user.trim() || !formData.password.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              {checkingConnection ? 'Checking...' : 'Check Connection'}
            </Button>
            <Button
              type="submit"
              disabled={loading || checkingConnection}
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