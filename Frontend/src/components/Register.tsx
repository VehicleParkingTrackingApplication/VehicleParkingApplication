import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Footer } from './Footer';
import { register } from '../services/backend';

export default function RegisterPage() {
    const nav = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !email || !password || !phone) {
          setError('Please fill in all fields');
          return;
        }
    
        setIsLoading(true);
        setError('');
    
        try {
          const result = await register(name, email, password);
          
          if (result && result.accessToken) {
            localStorage.setItem('accessToken', result.accessToken);
            if(result.refreshToken) {
              localStorage.setItem('refreshToken', result.refreshToken);
            }
            nav('/');
          } else {
            setError(result.message || 'Registration failed. Please try again.');
          }
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Network error. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

    return (
        <>
            <div className="flex flex-col md:flex-row min-h-screen bg-black text-white">
                <div className="flex-1 bg-gradient-to-b from-blue-900 via-black to-yellow-900 flex items-center justify-center p-8">
                    <div className="text-white text-center">
                        <h2 className="text-3xl font-bold mb-2">MoniPark</h2>
                        <p className="opacity-80">"From Parked Cars to Smart Starts"</p>
                        <Button 
                            variant="outline" 
                            className="mt-4 bg-transparent border-white text-white hover:bg-white hover:text-black" 
                            onClick={() => nav('/')}
                        >
                            Back to Home
                        </Button>
                    </div>
                </div>
                <div className="flex-1 bg-gray-800 flex items-center justify-center p-8">
                    <Card className="w-full max-w-md bg-gray-700 border-gray-600">
                    <CardContent className="space-y-6 pt-6">
                        <h3 className="text-2xl font-semibold text-center text-white">Register</h3>
                        {error && (
                            <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
                                {error}
                            </div>
                        )}
                        <Input 
                            placeholder="Name" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        />
                        <Input 
                            type="email" 
                            placeholder="Email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        />
                        <Input 
                            type="tel" 
                            placeholder="Phone number" 
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)} 
                            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        />
                        <Input 
                            type="password" 
                            placeholder="Password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        />
                        <Button 
                            size="lg" 
                            className="w-full bg-blue-600 hover:bg-blue-700" 
                            onClick={handleRegister}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Registering...' : 'Register'}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full text-gray-300 hover:text-white" 
                            onClick={() => nav('/signin')}
                        >
                            Already have an account? Sign in
                        </Button>
                    </CardContent>
                    </Card>
                </div>
            </div>
            <Footer />
        </>
    );
}
