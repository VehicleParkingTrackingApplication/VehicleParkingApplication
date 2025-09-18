import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { fetchAuthApi, putAuthApi } from '../../services/api';
import { User, Mail, Shield, Building, Eye, EyeOff, Edit, Save, X } from 'lucide-react';

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
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #677ae5, #6f60c0)' }}>
                <div className="text-white text-xl">Loading...</div>
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
        <div className="min-h-screen text-white relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, #677ae5, #6f60c0)' }}>
            {/* Background decorative elements */}
            <div 
                className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
                style={{ transform: 'translate(50%, -50%)' }}
            ></div>
            <div 
                className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
                style={{ transform: 'translate(-50%, 50%)' }}
            ></div>
            <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8 w-full max-w-4xl">
                <Card className="backdrop-blur-md bg-white/10 border-white/20 shadow-2xl">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">My Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {error && <p className="text-red-500">{error}</p>}
                        
                        
                        <form onSubmit={handleUpdate}>
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <Label htmlFor="firstName" className="sm:text-right">First name:</Label>
                                    <Input id="firstName" value={user.firstName} onChange={handleUserChange} className="sm:col-span-2 bg-gray-700 border-gray-600" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <Label htmlFor="lastName" className="sm:text-right">Last name:</Label>
                                    <Input id="lastName" value={user.lastName} onChange={handleUserChange} className="sm:col-span-2 bg-gray-700 border-gray-600" />
                                </div>

                                {/* Email Address */}
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Mail size={20} className="text-white" />
                                        <Label className="text-white text-sm font-medium">Email Address</Label>
                                    </div>
                                    {isEditing ? (
                                        <Input 
                                            value={user.email} 
                                            onChange={(e) => setUser({...user, email: e.target.value})}
                                            className="bg-black/20 border-white/20 text-white"
                                            type="email"
                                        />
                                    ) : (
                                        <div className="bg-black/20 border-white/20 px-4 py-3 rounded-lg text-white">
                                            {user.email}
                                        </div>
                                    )}
                                </div>

                                {/* Role */}
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Shield size={20} className="text-white" />
                                        <Label className="text-white text-sm font-medium">Role</Label>
                                    </div>
                                    <div className="bg-purple-600 px-4 py-2 rounded-full text-white text-sm font-medium inline-block">
                                        {user.role}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                {/* Company */}
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Building size={20} className="text-white" />
                                        <Label className="text-white text-sm font-medium">Company</Label>
                                    </div>
                                    {isEditing ? (
                                        <Input 
                                            value={user.company} 
                                            onChange={(e) => setUser({...user, company: e.target.value})}
                                            className="bg-black/20 border-white/20 text-white"
                                        />
                                    ) : (
                                        <div className="bg-black/20 border-white/20 px-4 py-3 rounded-lg text-white">
                                            {user.company}
                                        </div>
                                    )}
                                </div>

                                 {/* Password */}
                                 <div>
                                     <div className="flex items-center gap-3 mb-2">
                                         <Label className="text-white text-sm font-medium">Password</Label>
                                     </div>
                                     <div className="relative">
                                         <div className="bg-black/20 border-white/20 px-4 py-3 rounded-lg text-white flex items-center justify-between">
                                             <span>{showPassword ? userPassword : '••••••••••'}</span>
                                             <button 
                                                 onClick={handlePasswordToggle}
                                                 className="text-white hover:text-gray-300"
                                             >
                                                 {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                             </button>
                                         </div>
                                     </div>
                                 </div>

                                {/* Account Status */}
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Label className="text-white text-sm font-medium">Account Status</Label>
                                    </div>
                                    <div className="bg-green-600 px-4 py-2 rounded-full text-white text-sm font-medium inline-block">
                                        Active
                                    </div>
                                </div>
                            </div>
                        </div>


                        {error && (
                            <div className="mt-4 p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                                <p className="text-red-300 text-sm">{error}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

