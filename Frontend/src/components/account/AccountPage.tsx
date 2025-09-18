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
        username: '',
        phoneNumber: '',
        address: ''
    });
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: ''
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
                        phoneNumber: userData.phoneNumber || '',
                        address: userData.address || ''
                    });
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
                lastName: user.lastName,
                phoneNumber: user.phoneNumber,
                address: user.address
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
        <div className="min-h-screen text-white relative overflow-hidden flex items-center justify-center"style={{ background: 'linear-gradient(to bottom right, #677ae5, #6f60c0)' }}>
            <div 
                className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#677ae5] rounded-full filter blur-3xl opacity-20"
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
                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <Label htmlFor="phoneNumber" className="sm:text-right">Phone number:</Label>
                                    <Input id="phoneNumber" value={user.phoneNumber} onChange={handleUserChange} className="sm:col-span-2 bg-gray-700 border-gray-600" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <Label htmlFor="address" className="sm:text-right">Address:</Label>
                                    <Input id="address" value={user.address} onChange={handleUserChange} className="sm:col-span-2 bg-gray-700 border-gray-600" />
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
                        <hr className="my-8 border-gray-700" />
                        <MyReportsSection />
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

function MyReportsSection() {
    const [reports, setReports] = useState<Array<{ _id: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetchAuthApi('reports');
                if (!res.ok) throw new Error('Failed to load reports');
                const data = await res.json();
                const items = Array.isArray(data?.data) ? data.data : [];
                setReports(items.map((r: any) => ({ _id: r._id, name: r.name })));
            } catch (e: any) {
                setError(e?.message || 'Failed to load reports');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4">My Reports</h3>
            {loading && <div className="text-gray-300">Loading...</div>}
            {error && <div className="text-red-400">{error}</div>}
            {!loading && !error && (
                <ul className="list-disc pl-6 space-y-1">
                    {reports.length === 0 ? (
                        <li className="text-gray-300">No reports yet.</li>
                    ) : (
                        reports.map(r => (
                            <li key={r._id}>{r.name}</li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
}
