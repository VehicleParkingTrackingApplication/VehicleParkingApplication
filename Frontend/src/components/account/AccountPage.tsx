import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { fetchAuthApi, putAuthApi } from '../../services/api';

export default function AccountPage() {
    const [user, setUser] = useState({
        firstName: '',
        lastName: '',
        email: '',
        username: ''
    });
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isTestingConnection, setIsTestingConnection] = useState(false);

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
                        username: userData.username || ''
                    });
                    console.log('User state updated:', {
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || '',
                        email: userData.email || '',
                        username: userData.username || ''
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

    const testConnection = async () => {
        setIsTestingConnection(true);
        try {
            const response = await fetch('http://localhost:1313/api/auth/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
            
            console.log('Test connection response:', response.status, response.statusText);
            if (response.ok) {
                const data = await response.json();
                console.log('Test connection data:', data);
                alert('Connection successful! Check console for details.');
            } else {
                alert(`Connection failed: ${response.status} ${response.statusText}`);
            }
        } catch (err) {
            console.error('Test connection error:', err);
            alert('Connection test failed. Check console for details.');
        } finally {
            setIsTestingConnection(false);
        }
    };

    const handleUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setUser(prevUser => ({
            ...prevUser,
            [id]: value
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setPasswords(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Update user name using the proper endpoint
            const nameResponse = await putAuthApi('account/update-name', {}, JSON.stringify({
                firstName: user.firstName,
                lastName: user.lastName
            }));
            
            if (!nameResponse.ok) {
                const errorData = await nameResponse.json();
                setError(errorData.message || 'Failed to update name.');
                return;
            }

            // Update password if provided
            if (passwords.newPassword && passwords.oldPassword) {
                // Password change functionality is not available
                setError('Password change functionality is not available. Please contact support.');
                return;
            }

            // If we get here, the update was successful
            setError(''); // Clear any previous errors
            alert('Account updated successfully!');
            
        } catch (err) {
            console.error('Update error:', err);
            setError('Update failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !user.email) {
        return <div>Loading...</div>;
    }

    return (
        <div className="relative min-h-screen bg-black text-white overflow-hidden flex items-center justify-center">
            <div 
                className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
                style={{ transform: 'translate(50%, -50%)' }}
            ></div>
            <div 
                className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
                style={{ transform: 'translate(-50%, 50%)' }}
            ></div>

            <main className="relative z-10 px-4 py-8 sm:px-6 lg:px-8 w-full max-w-4xl">
                <Card className="bg-gray-900/50 border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">My Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {error && <p className="text-red-500">{error}</p>}
                        
                        {/* Debug section */}
                        <div className="flex gap-4 mb-4">
                            <Button 
                                type="button" 
                                onClick={testConnection}
                                disabled={isTestingConnection}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white"
                            >
                                {isTestingConnection ? 'Testing...' : 'Test Connection'}
                            </Button>
                            <Button 
                                type="button" 
                                onClick={() => {
                                    console.log('Current token:', localStorage.getItem('token'));
                                    console.log('Current user state:', user);
                                }}
                                className="bg-gray-600 hover:bg-gray-700 text-white"
                            >
                                Debug Info
                            </Button>
                        </div>
                        
                        {/* Backend Status Info */}
                        <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-4 mb-4">
                            <h4 className="text-blue-300 font-semibold mb-2">Backend Connection Status</h4>
                            <p className="text-blue-200 text-sm">
                                The backend server is running on port 1313, but it needs environment variables to be configured.
                            </p>
                            <p className="text-blue-200 text-sm mt-2">
                                <strong>Required:</strong> Create a .env file in the Backend folder with ACCESS_TOKEN_SECRET and other variables.
                            </p>
                        </div>
                        
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
                            </div>

                            <hr className="my-8 border-gray-700" />

                            <div className="space-y-6">
                                <h3 className="text-xl font-semibold mb-4">Login Details:</h3>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                        <Label htmlFor="email" className="sm:text-right">Email:</Label>
                                        <Input id="email" type="email" value={user.email} onChange={handleUserChange} className="sm:col-span-2 bg-gray-700 border-gray-600" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                        <Label htmlFor="username" className="sm:text-right">Username:</Label>
                                        <Input id="username" value={user.username} onChange={handleUserChange} className="sm:col-span-2 bg-gray-700 border-gray-600" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                        <Label htmlFor="oldPassword" className="sm:text-right">Old Password:</Label>
                                        <Input id="oldPassword" type="password" value={passwords.oldPassword} onChange={handlePasswordChange} className="sm:col-span-2 bg-gray-700 border-gray-600" />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                        <Label htmlFor="newPassword" className="sm:text-right">New Password:</Label>
                                        <Input id="newPassword" type="password" value={passwords.newPassword} onChange={handlePasswordChange} className="sm:col-span-2 bg-gray-700 border-gray-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-center pt-8">
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded" disabled={isLoading}>
                                    {isLoading ? 'Updating...' : 'Update'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
