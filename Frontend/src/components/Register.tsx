import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useNavigate } from 'react-router-dom';
import { register } from '../services/backend';
import { setCookie } from '../utils/cookies';

export default function RegisterPage() {
    const nav = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRegister = async () => {
        // Validation
        if (!formData.username || !formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Use the API service instead of direct fetch
            const authResult = await register(formData.username, formData.email, formData.password);
            
            if (authResult) {
                const { user, token } = authResult;
                
                // Store token in cookies securely
                setCookie('token', token, {
                    maxAge: 60 * 60 * 24 * 7, // 7 days
                    secure: true,
                    sameSite: 'Strict'
                });
                
                // Store user data in localStorage (non-sensitive data)
                localStorage.setItem('user', JSON.stringify(user));
                
                // Redirect to dashboard
                nav('/dashboard');
            } else {
                setError('Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            <div className="flex-1 bg-gradient-to-b from-blue-900 via-black to-yellow-900 flex items-center justify-center p-8">
                <div className="text-white text-center">
                    <h2 className="text-3xl font-bold mb-2">MoniPark</h2>
                    <p className="opacity-80">"From Parked Cars to Smart Starts"</p>
                    <Button 
                        variant="outline" 
                        className="mt-4" 
                        onClick={() => nav('/')}
                    >
                        Back to Home
                    </Button>
                </div>
            </div>
            <div className="flex-1 bg-gray-800 flex items-center justify-center p-8">
                <Card className="w-full max-w-md bg-gray-700">
                <CardContent className="space-y-6">
                    <h3 className="text-2xl font-semibold text-center">Register</h3>
                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
                            {error}
                        </div>
                    )}
                    <Input 
                        name="username"
                        placeholder="Username" 
                        value={formData.username}
                        onChange={handleInputChange}
                    />
                    <Input 
                        name="email"
                        type="email" 
                        placeholder="Email" 
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                    <Input 
                        name="password"
                        type="password" 
                        placeholder="Password" 
                        value={formData.password}
                        onChange={handleInputChange}
                    />
                    <Input 
                        name="confirmPassword"
                        type="password" 
                        placeholder="Confirm Password" 
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleRegister();
                            }
                        }}
                    />
                    <Button 
                        size="lg" 
                        className="w-full" 
                        onClick={handleRegister}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Creating account...' : 'Register'}
                    </Button>
                    <Button 
                        variant="ghost" 
                        className="w-full" 
                        onClick={() => nav('/signin')}
                    >
                        Already have an account? Sign in
                    </Button>
                </CardContent>
                </Card>
            </div>
        </div>
    );
}