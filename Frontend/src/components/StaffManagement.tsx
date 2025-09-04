import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Card, CardContent } from './ui/card';
import { Eye, EyeOff, Edit, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import StaffAccountPopUp from './StaffAccountPopUp';
import { listStaff, deleteStaff, updateStaff } from '../services/backend';
import type { Staff, UpdateStaffData } from '../services/backend';

export default function StaffManagement() {
  const [open, setOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [updateForm, setUpdateForm] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    businessId: '',
    password: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [allStaff, setAllStaff] = useState<Staff[]>([]); // Store all staff data
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [search, setSearch] = useState('');

  // Load staff list on component mount
  useEffect(() => {
    loadStaffList();
  }, []);

  const loadStaffList = async () => {
    try {
      setLoading(true);
      const response = await listStaff();
      if (response) {
        setAllStaff(response.staff); // Store all staff data
        setStaffList(response.staff); // Initially show all staff
      }
    } catch (error) {
      console.error('Error loading staff:', error);
      setMessage({ type: 'error', text: 'Failed to load staff list' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!search.trim()) {
      // If search is empty, show all staff
      setStaffList(allStaff);
      return;
    }
    
    // Filter staff based on search term
    const filteredStaff = allStaff.filter(staff => 
      staff.username.toLowerCase().includes(search.toLowerCase()) ||
      staff.firstName?.toLowerCase().includes(search.toLowerCase()) ||
      staff.lastName?.toLowerCase().includes(search.toLowerCase()) ||
      staff.email?.toLowerCase().includes(search.toLowerCase()) ||
      staff.role.toLowerCase().includes(search.toLowerCase())
    );
    
    setStaffList(filteredStaff);
  };

  const handleClearSearch = () => {
    setSearch('');
    setStaffList(allStaff); // Show all staff when clearing search
  };

  const handleSuccess = (successMessage: string) => {
    setMessage({ type: 'success', text: successMessage });
    setOpen(false);
    // Reload staff list after successful creation
    loadStaffList();
    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleError = (errorMessage: string) => {
    setMessage({ type: 'error', text: errorMessage });
    // Clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  };

  const togglePasswordVisibility = (staffId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [staffId]: !prev[staffId]
    }));
  };

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (window.confirm(`Are you sure you want to delete ${staffName}?`)) {
      try {
        await deleteStaff(staffId);
        setMessage({ type: 'success', text: 'Staff member deleted successfully' });
        loadStaffList(); // Reload the list
      } catch (error) {
        console.error('Error deleting staff:', error);
        setMessage({ type: 'error', text: 'Failed to delete staff member' });
      }
    }
  };

  const handleUpdateStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setUpdateForm({
      username: staff.username || '',
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      email: staff.email || '',
      businessId: staff.businessId || '',
      password: '' // Initialize password field
    });
    setUpdateOpen(true);
  };

  const handleUpdateFormChange = (field: string, value: string) => {
    setUpdateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveUpdate = async () => {
    if (!selectedStaff) return;

    try {
      const updateData: UpdateStaffData = {
        userId: selectedStaff._id,
        ...updateForm
      };

      await updateStaff(updateData);
      setMessage({ type: 'success', text: 'Staff member updated successfully' });
      setUpdateOpen(false);
      setSelectedStaff(null);
      loadStaffList(); // Reload the list
    } catch (error) {
      console.error('Error updating staff:', error);
      setMessage({ type: 'error', text: 'Failed to update staff member' });
    }
  };

  const handleCloseUpdate = () => {
    setUpdateOpen(false);
    setSelectedStaff(null);
    setUpdateForm({
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      businessId: '',
      password: ''
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <Card className="w-full bg-gray-700 border-gray-600">
          <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
              <div>
                <h1 className="text-2xl font-semibold">Staff Management</h1>
                <p className="text-sm text-gray-300">Streamlined, secure, and consistent with your workspace</p>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    Create Staff Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900/95 text-white border-gray-700">
                  <StaffAccountPopUp 
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </DialogContent>
              </Dialog>
            </div>

            {message && (
              <div className={`px-4 py-2 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-red-600 text-white'
              }`}>
                {message.text}
              </div>
            )}

            <section className="bg-gray-800 rounded-lg border border-gray-600 p-4 md:p-6 shadow-md">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <form onSubmit={handleSearch} className="flex gap-2 w-full">
                  <Input
                    type="text"
                    placeholder="Search staff by username, name, email, or role..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white flex-1"
                  />
                  <Button type="submit" variant="outline" className="border-gray-500 text-gray-200 hover:bg-gray-900">
                    Search
                  </Button>
                  {search && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleClearSearch}
                      className="border-gray-500 text-gray-200 hover:bg-gray-900"
                    >
                      Clear
                    </Button>
                  )}
                </form>
                <div className="text-sm text-gray-200 w-full md:w-auto text-center md:text-right">
                  Showing {staffList.length} staff members
                </div>
              </div>
            </section>

            <div className="bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
              {loading ? (
                <div className="p-8 text-center">
                  <div className="text-gray-400">Loading staff list...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-600">
                      <TableHead className="text-white">Index</TableHead>
                      <TableHead className="text-white">Username</TableHead>
                      <TableHead className="text-white">Full Name</TableHead>
                      <TableHead className="text-white">Password</TableHead>
                      <TableHead className="text-white">Role</TableHead>
                      <TableHead className="text-white">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-400 py-8">
                          No staff members found
                        </TableCell>
                      </TableRow>
                    ) : (
                      staffList.map((staff, index) => (
                        <TableRow key={staff._id} className="border-gray-700 hover:bg-gray-900/40">
                          <TableCell className="text-white">{index + 1}</TableCell>
                          <TableCell className="text-white">{staff.username}</TableCell>
                          <TableCell className="text-white">{`${staff.firstName || ''} ${staff.lastName || ''}`.trim() || 'N/A'}</TableCell>
                          <TableCell className="text-white">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono">
                                {showPasswords[staff._id] ? 'password123' : '••••••••'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePasswordVisibility(staff._id)}
                                className="text-gray-300 hover:text-white"
                              >
                                {showPasswords[staff._id] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-white">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              staff.role === 'admin' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-blue-600 text-white'
                            }`}>
                              {staff.role}
                            </span>
                          </TableCell>
                          <TableCell className="text-white">
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStaff(staff)}
                                className="text-blue-400 border-blue-400 hover:bg-blue-400 hover:text-white"
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Update
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteStaff(staff._id, staff.username)}
                                className="text-red-400 border-red-400 hover:bg-red-400 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={updateOpen} onOpenChange={setUpdateOpen}>
        <DialogContent className="bg-gray-900/95 text-white border-gray-700 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Update Staff Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="update-username">Username</Label>
              <Input
                id="update-username"
                value={updateForm.username}
                onChange={(e) => handleUpdateFormChange('username', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-firstName">First Name</Label>
              <Input
                id="update-firstName"
                value={updateForm.firstName}
                onChange={(e) => handleUpdateFormChange('firstName', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-lastName">Last Name</Label>
              <Input
                id="update-lastName"
                value={updateForm.lastName}
                onChange={(e) => handleUpdateFormChange('lastName', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-email">Email</Label>
              <Input
                id="update-email"
                type="email"
                value={updateForm.email}
                onChange={(e) => handleUpdateFormChange('email', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-businessId">Business ID</Label>
              <Input
                id="update-businessId"
                value={updateForm.businessId}
                onChange={(e) => handleUpdateFormChange('businessId', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="update-password">Password</Label>
              <Input
                id="update-password"
                type="password"
                value={updateForm.password}
                onChange={(e) => handleUpdateFormChange('password', e.target.value)}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={handleCloseUpdate}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveUpdate}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


