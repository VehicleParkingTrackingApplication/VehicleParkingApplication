import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Footer } from './Footer';
import { login } from '../services/backend';
import { useState } from 'react';

export default function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(username, password);
      
      if (result && result.accessToken) {
        // In a real app, you would store the token securely
        localStorage.setItem('token', result.accessToken);
        window.dispatchEvent(new CustomEvent('authChange'));
        nav('/');
      } else {
        setError(result?.message || 'Invalid username or password');
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
                <div className="flex-1 bg-gray-800 flex items-center justify-center p-8">
                    <Card className="w-full max-w-md bg-gray-700 border-gray-600">
                    <CardContent className="space-y-6 pt-6">
                        <h3 className="text-2xl font-semibold text-center text-white">Sign in</h3>
                        {error && (
                            <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
                                {error}
                            </div>
                        )}
                        <Input 
                            type="text" 
                            placeholder="Username" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
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
                            className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                        />
                        <Button 
                            size="lg" 
                            className="w-full bg-blue-600 hover:bg-blue-700" 
                            onClick={handleLogin}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Login'}
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full text-gray-300 hover:text-white" 
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
                        className="mt-4 bg-transparent border-white text-white hover:bg-white hover:text-black" 
                        onClick={() => nav('/')}
                    >
                        Back to Home
                    </Button>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
