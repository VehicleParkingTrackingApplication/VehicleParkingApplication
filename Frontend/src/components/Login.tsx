import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const nav = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:1313'}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Store token or user data if needed
                localStorage.setItem('token', data.token || '');
                localStorage.setItem('user', JSON.stringify(data.user || {}));
                nav('/');
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Login failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
        <div className="flex-1 bg-gray-800 flex items-center justify-center p-8">
            <Card className="w-full max-w-md bg-gray-700">
            <CardContent className="space-y-6">
                <h3 className="text-2xl font-semibold text-center">Sign in</h3>
                {error && (
                    <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
                        {error}
                    </div>
                )}
                <Input 
                    type="email" 
                    placeholder="Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <Input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            handleLogin();
                        }
                    }}
                />
                <Button 
                    size="lg" 
                    className="w-full" 
                    onClick={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </Button>
                <Button 
                    variant="ghost" 
                    className="w-full" 
                    onClick={() => nav('/register')}
                >
                    Don't have an account? Register
                </Button>
            </CardContent>
            </Card>
        </div>
        <div className="flex-1 bg-gradient-to-b from-blue-900 via-black to-yellow-900 flex items-center justify-center p-8">
            <div className="text-white text-center max-w-sm">
            <h2 className="text-3xl font-bold mb-4">MoniPark</h2>
            <p>An AI-driven car park monitoring solution tailored for SMEs — seamlessly integrating Real-Time Occupancy Tracking, Smart Vehicle Analytics, and Automated Visitor Insights. Unlock next-level efficiency by transforming parking spaces into data-powered growth hubs.</p>
            <Button 
                variant="outline" 
                className="mt-4" 
                onClick={() => nav('/')}
            >
                Back to Home
            </Button>
            </div>
        </div>
        </div>
    );
}
