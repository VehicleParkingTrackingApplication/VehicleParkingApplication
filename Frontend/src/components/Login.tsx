import React, { useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/backend';
import { setCookie } from '../utils/cookies';

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
            // Use the API service instead of direct fetch
            const authResult = await login(email, password);
            
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
                
                // Redirect to dashboard or home
                nav('/dashboard');
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            console.error('Login error:', err);
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
                    onKeyDown={(e) => {
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
