import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Share2, X, UserCheck, UserPlus } from 'lucide-react';
import { getBusinessUsers, shareReport, getReportShares, removeShare } from '../services/sharesApi';
import type { BusinessUser, ReportShare } from '../services/sharesApi';

interface ShareReportProps {
  reportId: string;
  isOwner: boolean;
}

export default function ShareReport({ reportId, isOwner }: ShareReportProps) {
  const [businessUsers, setBusinessUsers] = useState<BusinessUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [currentShares, setCurrentShares] = useState<ReportShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  // Load business users and current shares when component mounts
  useEffect(() => {
    console.log('ShareReport useEffect triggered:', { reportId, isOwner });
    if (isOwner) {
      loadBusinessUsers();
      loadCurrentShares();
    }
  }, [reportId, isOwner]);

  const loadBusinessUsers = async () => {
    try {
      console.log('Loading business users...');
      setIsLoading(true);
      const response = await getBusinessUsers();
      console.log('Business users response:', response);
      if (response.success) {
        setBusinessUsers(response.data);
      } else {
        setError(response.message);
      }
    } catch (err) {
      console.error('Error loading business users:', err);
      setError('Failed to load business users');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentShares = async () => {
    try {
      console.log('Loading current shares for report:', reportId);
      const response = await getReportShares(reportId);
      console.log('Current shares response:', response);
      if (response.success) {
        setCurrentShares(response.data);
      }
    } catch (err) {
      console.error('Failed to load current shares:', err);
    }
  };

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleUserSelect = (userId: string) => {
    // Don't process special values
    if (userId === 'loading' || userId === 'no-users') {
      return;
    }
    
    setSelectedUserId(userId);
    if (userId && !selectedUsers.includes(userId) && !isUserAlreadyShared(userId)) {
      setSelectedUsers(prev => [...prev, userId]);
    }
  };

  const isUserAlreadyShared = (userId: string) => {
    return currentShares.some(share => share.sharedWith._id === userId);
  };

  const handleShare = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setIsSharing(true);
      setError(null);
      setSuccess(null);

      const response = await shareReport({
        reportId,
        userIds: selectedUsers
      });

      if (response.success) {
        setSuccess(`Report shared with ${selectedUsers.length} user(s) successfully!`);
        setSelectedUsers([]);
        setSelectedUserId(''); // Clear the dropdown selection
        loadCurrentShares(); // Refresh the shares list
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to share report');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Are you sure you want to remove this share?')) return;

    try {
      const response = await removeShare(shareId);
      if (response.success) {
        setCurrentShares(prev => prev.filter(share => share._id !== shareId));
        setSuccess('Share removed successfully!');
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError('Failed to remove share');
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Filter out users who are already shared with
  const availableUsers = businessUsers.filter(user => !isUserAlreadyShared(user._id));

  if (!isOwner) {
    return null; // Only show share functionality to report owners
  }

  // Add loading state to prevent white screen
  if (isLoading && !businessUsers.length && !currentShares.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Share2 className="h-5 w-5" />
            Share Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-black py-4">Loading sharing options...</div>
        </CardContent>
      </Card>
    );
  }

  // Add error boundary to prevent white screen
  if (error && !businessUsers.length && !currentShares.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Share2 className="h-5 w-5" />
            Share Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-gray-900">
          <Share2 className="h-5 w-5" />
          Share Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {/* Error/Success messages */}
        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="text-green-500 text-sm bg-green-50 p-2 rounded">
            {success}
          </div>
        )}

        {/* Current shares */}
        {currentShares.length > 0 && (
          <div className="space-y-2 flex-1 min-h-0">
            <h4 className="font-medium text-sm text-gray-900">Currently shared with:</h4>
            <div className="space-y-2 overflow-y-auto flex-1">
              {currentShares.map((share) => (
                <div key={share._id} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-gray-200 text-gray-700 font-medium">
                        {getInitials(share.sharedWith.firstName, share.sharedWith.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {share.sharedWith.firstName} {share.sharedWith.lastName}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({share.sharedWith.username})
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <UserCheck className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">Shared</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(share.createdAt)}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveShare(share._id)}
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Share with new users */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-900">Share with users in your business:</h4>
          
          {/* User dropdown */}
          <div className="space-y-2">
            <Select value={selectedUserId} onValueChange={handleUserSelect}>
              <SelectTrigger className="w-full bg-gray-50 border-gray-300 text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-blue-400 focus:border-blue-400">
                <SelectValue placeholder="Select a user to share with..." />
              </SelectTrigger>
              <SelectContent>
                {isLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading users...
                  </SelectItem>
                ) : availableUsers.length === 0 ? (
                  <SelectItem value="no-users" disabled>
                    No available users to share with
                  </SelectItem>
                ) : (
                  availableUsers.map((user) => (
                    <SelectItem key={user._id} value={user._id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-200 text-gray-700 font-medium">
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {user.username} • {user.email}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Selected users list */}
          {selectedUsers.length > 0 && (
            <div className="space-y-2 flex-1 min-h-0">
              <h5 className="font-medium text-sm text-gray-900">Selected users:</h5>
              <div className="space-y-2 overflow-y-auto flex-1">
                {selectedUsers.map((userId) => {
                  const user = businessUsers.find(u => u._id === userId);
                  if (!user) return null;
                  
                  return (
                    <div key={userId} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gray-200 text-gray-700 font-medium">
                            {getInitials(user.firstName, user.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({user.username})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-blue-500" />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUserToggle(userId)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Share button */}
          {selectedUsers.length > 0 && (
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSharing ? (
                'Sharing...'
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share with {selectedUsers.length} user(s)
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
