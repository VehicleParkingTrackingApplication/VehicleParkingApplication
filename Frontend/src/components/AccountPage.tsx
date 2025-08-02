import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { fetchApi, putApi } from '../services/api';

export default function AccountPage() {
    const [user, setUser] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        email: '',
        username: ''
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
                const response = await fetchApi('/account/details'); // Example endpoint
                if (response.ok) {
                    const data = await response.json();
                    setUser({
                        firstName: data.firstName || '',
                        lastName: data.lastName || '',
                        phoneNumber: data.phoneNumber || '',
                        email: data.email || '',
                        username: data.username || ''
                    });
                } else {
                    setError('Failed to fetch user data.');
                }
            } catch (err) {
                setError('Network error. Please try again.');
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
            const response = await putApi('/account/update', {}, JSON.stringify(user));
            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.message || 'Failed to update details.');
            }
            // Optionally update passwords
            if (passwords.newPassword) {
                const passResponse = await putApi('/account/change-password', {}, JSON.stringify(passwords));
                if (!passResponse.ok) {
                    throw new Error('Failed to update password.');
                }
            }
        } catch (err) {
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
                                    <Input id="phoneNumber" type="tel" value={user.phoneNumber} onChange={handleUserChange} className="sm:col-span-2 bg-gray-700 border-gray-600" />
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