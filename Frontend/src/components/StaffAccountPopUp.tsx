import { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { createStaff } from '../services/backend';
import type { CreateStaffData } from '../services/backend';

interface StaffAccountPopUpProps {
  onCreate?: (payload: CreateStaffData) => void;
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export default function StaffAccountPopUp({ onCreate, onSuccess, onError }: StaffAccountPopUpProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!username || !password || !firstName || !lastName || !email) {
      onError?.('All fields are required');
      return;
    }

    const payload: CreateStaffData = { 
      username, 
      password, 
      firstName, 
      lastName, 
      email, 
      role 
    };

    console.log('Create staff account payload:', payload);
    
    // Call the callback if provided
    onCreate?.(payload);

    // Also call the backend service directly
    try {
      setIsLoading(true);
      const result = await createStaff(payload);
      if (result) {
        onSuccess?.(result.message);
        // Clear form
        setUsername('');
        setPassword('');
        setRole('staff');
        setFirstName('');
        setLastName('');
        setEmail('');
      }
    } catch (error) {
      console.error('Error creating staff:', error);
      onError?.(error instanceof Error ? error.message : 'Failed to create staff');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-xl font-semibold">Create staff account</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <Label htmlFor="staff-username" className="sm:text-right">Username:</Label>
          <Input
            id="staff-username"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="sm:col-span-2 bg-gray-700 border-gray-600"
            disabled={isLoading}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <Label htmlFor="staff-password" className="sm:text-right">Password:</Label>
          <Input
            id="staff-password"
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="sm:col-span-2 bg-gray-700 border-gray-600"
            disabled={isLoading}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <Label htmlFor="staff-role" className="sm:text-right">Role:</Label>
          <Input
            id="staff-role"
            placeholder="Enter role (admin, staff)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="sm:col-span-2 bg-gray-700 border-gray-600"
            disabled={isLoading}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <Label htmlFor="staff-firstName" className="sm:text-right">First Name:</Label>
          <Input
            id="staff-firstName"
            placeholder="Enter first name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="sm:col-span-2 bg-gray-700 border-gray-600"
            disabled={isLoading}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <Label htmlFor="staff-lastName" className="sm:text-right">Last Name:</Label>
          <Input
            id="staff-lastName"
            placeholder="Enter last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="sm:col-span-2 bg-gray-700 border-gray-600"
            disabled={isLoading}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
          <Label htmlFor="staff-email" className="sm:text-right">Email:</Label>
          <Input
            id="staff-email"
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="sm:col-span-2 bg-gray-700 border-gray-600"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button 
          onClick={handleCreate} 
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Creating...' : 'Create'}
        </Button>
      </div>
    </div>
  );
}


