import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Footer } from './Footer';
import { register } from '../services/backend';

export default function RegisterPage() {
    const nav = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!username || !email || !password) {
          setError('Please fill in all fields');
          return;
        }
    
        setIsLoading(true);
        setError('');
    
        try {
          const result = await register(username, email, password);
          
          if (result && result.accessToken) {
            localStorage.setItem('token', result.accessToken);
            nav('/dashboard');
          } else {
            setError(result?.message || 'Registration failed. Please try again.');
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
            <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white relative overflow-hidden">
                <div 
                    className="absolute top-0 right-0 w-[700px] h-[700px] bg-[#193ED8] rounded-full filter blur-3xl opacity-20"
                    style={{ transform: 'translate(50%, -50%)' }}
                ></div>
                <div 
                    className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-[#E8D767] rounded-full filter blur-3xl opacity-20"
                    style={{ transform: 'translate(-50%, 50%)' }}
                ></div>
                <div className="flex-1 flex items-center justify-center p-8 relative z-10">
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
                            placeholder="Username" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)} 
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
