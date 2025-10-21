import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { fetchAuthApi, putAuthApi } from '../../services/api';
import { Mail, Shield, Building, Eye, EyeOff, Edit, Save, X, Lock } from 'lucide-react';

export default function AccountPage() {
    const [user, setUser] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        company: '',
        role: 'Administrator'
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [userPassword, setUserPassword] = useState('••••••••••');
  
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log('Fetching user data...');
                
                // Check if user is authenticated
                const token = localStorage.getItem('token');
                console.log('Token exists:', !!token);
                if (!token) {
                    setError('You are not logged in. Please log in to view your account details.');
                    setIsLoading(false);
                    return;
                }
                
                // Try using the auth interceptor first
                console.log('Calling fetchAuthApi with auth/me...');
                let response = await fetchAuthApi('auth/me');
                console.log('Auth response status:', response.status);
                console.log('Auth response ok:', response.ok);
                
                // If auth interceptor fails, try manual token approach
                if (!response.ok) {
                    console.log('Auth interceptor failed, trying manual token approach...');
                    const manualResponse = await fetch('http://localhost:1313/api/auth/me', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include'
                    });
                    
                    if (manualResponse.ok) {
                        response = manualResponse;
                        console.log('Manual token approach succeeded');
                    } else {
                        const errorText = await response.text();
                        console.log('Error response:', errorText);
                        if (response.status === 401) {
                            setError('Authentication failed. Please log in again.');
                        } else if (response.status === 404) {
                            setError('Backend endpoint not found. The backend may need environment variables to be configured.');
                        } else {
                            setError(`Failed to fetch user data. Server responded with ${response.status}. Please try again.`);
                        }
                        setIsLoading(false);
                        return;
                    }
                }
                
                const userData = await response.json();
                console.log('User data received:', userData);
                
                if (userData && userData.username) {
                    setUser({
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        email: userData.email || '',
                        username: userData.username || '',
                        company: userData.company || '',
                        role: userData.role || 'Administrator'
                    });
                    // Store password for display (in real app, this would be fetched securely)
                    setUserPassword(userData.password || '••••••••••');
                    console.log('User state updated:', {
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        email: userData.email || '',
                        username: userData.username || '',
                        phoneNumber: userData.phoneNumber || '',
                        address: userData.address || ''
                    });
                    setError(''); // Clear any previous errors
                } else {
                    setError('Failed to fetch user data. Please log in again or check your authentication. If the problem persists, the backend may need environment variables to be configured.');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                console.error('Error details:', errorMessage);
                
                // Check if it's a network error
                if (errorMessage.includes('fetch')) {
                    setError('Cannot connect to server. Please make sure the backend is running.');
                } else {
                    setError('Network error. Please try again.');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, []);
    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setUser(prevUser => ({
            ...prevUser,
            [id]: value
        }));
    };
    const handleUpdate = async () => {
        setIsLoading(true);
        setError('');

        try {
            // Update user name using the proper endpoint
            const nameResponse = await putAuthApi('account/update-name', {}, JSON.stringify({
                firstName: user.firstName,
                lastName: user.lastName,
                company: user.company
            }));
            
            if (!nameResponse.ok) {
                const errorData = await nameResponse.json();
                setError(errorData.message || 'Failed to update name.');
                return;
            }

            // If we get here, the update was successful
            setError(''); // Clear any previous errors
            setIsEditing(false); // Exit edit mode
            alert('Account updated successfully!');
            
        } catch (err) {
            console.error('Update error:', err);
            setError('Update failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !user.email) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)' }}>
                <div className="text-black text-xl">Loading...</div>
            </div>
        );
    }

    const getInitials = () => {
        return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    };

    const handlePasswordToggle = async () => {
        if (!showPassword) {
            // Fetch the actual password when showing it
            try {
                const response = await fetchAuthApi('account/password');
                if (response.ok) {
                    const data = await response.json();
                    setUserPassword(data.password || '••••••••••');
                } else {
                    // If password fetch fails, show a placeholder
                    setUserPassword('••••••••••');
                }
            } catch (error) {
                console.error('Failed to fetch password:', error);
                setUserPassword('••••••••••');
            }
        }
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen text-slate-900 relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #f0f8ff, #e6f3ff)' }}>
            {/* Background decorative elements */}
            <div 
                className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
                style={{ transform: 'translate(50%, -50%)' }}
            ></div>
            <div 
                className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
                style={{ transform: 'translate(-50%, 50%)' }}
            ></div>
            <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8 w-full max-w-6xl mx-auto">
                <header className="text-center mb-6 mt-5">
                    <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-lg text-blue-600">My Account</h1>
                </header>
                {/* Profile Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-blue-600 border-4 border-white/80 shadow-lg mb-4">
                        <span className="text-4xl font-bold text-white drop-shadow-sm">{getInitials()}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-slate-700 text-lg">{user.email}</p>
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <div className="bg-purple-600 px-3 py-1 rounded-full text-white text-sm font-medium">
                            {user.role}
                        </div>
                        <div className="bg-green-600 px-3 py-1 rounded-full text-white text-sm font-medium">
                            Active
                        </div>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="backdrop-blur-md bg-white/70 border-slate-300 shadow-2xl">
                    <CardHeader className="px-6 pt-6 pb-4 border-b border-slate-300">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-slate-900">Personal Information</h3>
                            <div className="flex gap-2">
                                {!isEditing ? (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Edit size={16} className="mr-2" />
                                        Edit Profile
                                    </Button>
                                ) : (
                                    <>
                                        <Button
                                            onClick={handleUpdate}
                                            disabled={isLoading}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Save size={16} className="mr-2" />
                                            {isLoading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                        <Button
                                            onClick={() => setIsEditing(false)}
                                            variant="outline"
                                            className="border-slate-300 text-slate-700 hover:bg-slate-100"
                                        >
                                            <X size={16} className="mr-2" />
                                            Cancel
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {error && (
                            <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <p className="text-red-700 text-sm">{error}</p>
                            </div>
                        )}
                        
                        <form onSubmit={handleUpdate} className="space-y-6">
                            {/* Personal Information Section */}
                            <div className="space-y-6">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    {/* First Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName" className="text-slate-900 text-sm font-medium">
                                            First Name
                                        </Label>
                                        {isEditing ? (
                                            <Input 
                                                id="firstName" 
                                                value={user.firstName} 
                                                onChange={handleUserChange} 
                                                className="bg-white border-slate-300 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter your first name"
                                            />
                                        ) : (
                                            <div className="bg-white border-slate-300 px-4 py-3 rounded-lg text-slate-900 shadow-sm">
                                                {user.firstName || 'Not provided'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName" className="text-slate-900 text-sm font-medium">
                                            Last Name
                                        </Label>
                                        {isEditing ? (
                                            <Input 
                                                id="lastName" 
                                                value={user.lastName} 
                                                onChange={handleUserChange} 
                                                className="bg-white border-slate-300 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Enter your last name"
                                            />
                                        ) : (
                                            <div className="bg-white border-slate-300 px-4 py-3 rounded-lg text-slate-900 shadow-sm">
                                                {user.lastName || 'Not provided'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Email Address */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Mail size={20} className="text-slate-700" />
                                        <Label className="text-slate-900 text-sm font-medium">Email Address</Label>
                                    </div>
                                    {isEditing ? (
                                        <Input 
                                            value={user.email} 
                                            onChange={(e) => setUser({...user, email: e.target.value})}
                                            className="bg-white border-slate-300 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            type="email"
                                            placeholder="Enter your email address"
                                        />
                                    ) : (
                                        <div className="bg-white border-slate-300 px-4 py-3 rounded-lg text-slate-900 shadow-sm">
                                            {user.email}
                                        </div>
                                    )}
                                </div>

                                {/* Company */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <Building size={20} className="text-slate-700" />
                                        <Label className="text-slate-900 text-sm font-medium">Company</Label>
                                    </div>
                                    {isEditing ? (
                                        <Input 
                                            value={user.company} 
                                            onChange={(e) => setUser({...user, company: e.target.value})}
                                            className="bg-white border-slate-300 text-slate-900 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter your company name"
                                        />
                                    ) : (
                                        <div className="bg-white border-slate-300 px-4 py-3 rounded-lg text-slate-900 shadow-sm">
                                            {user.company || 'Not provided'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Security Section */}
                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold text-slate-900 border-b border-slate-300 pb-2">
                                    Security & Access
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                    {/* Password */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Lock size={20} className="text-slate-700" />
                                            <Label className="text-slate-900 text-sm font-medium">Password</Label>
                                        </div>
                                        <div className="relative">
                                            <div className="bg-white border-slate-300 px-4 rounded-lg text-slate-900 flex items-center justify-between shadow-sm h-12">
                                                <span>{showPassword ? userPassword : '••••••••••'}</span>
                                                <button 
                                                    type="button"
                                                    onClick={handlePasswordToggle}
                                                    className="text-slate-700 hover:text-slate-900 transition-colors"
                                                >
                                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Role */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <Shield size={20} className="text-slate-700" />
                                            <Label className="text-slate-900 text-sm font-medium">Role</Label>
                                        </div>
                                        <div className="bg-purple-600 px-4 rounded-lg text-white font-medium h-12 flex items-center">
                                            {user.role}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

