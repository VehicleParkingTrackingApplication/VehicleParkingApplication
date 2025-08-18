import { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';

interface StaffAccountPopUpProps {
  onCreate?: (payload: { username: string; password: string }) => void;
}

export default function StaffAccountPopUp({ onCreate }: StaffAccountPopUpProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleCreate = () => {
    const payload = { username, password };
    console.log('Create staff account payload:', payload);
    onCreate?.(payload);
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
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white">
          Create
        </Button>
      </div>
    </div>
  );
}


