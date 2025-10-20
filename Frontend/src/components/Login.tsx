import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { login, getCurrentUser } from '../services/backend';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogIn } from 'lucide-react';

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
      console.log("username :", username)
      console.log("password :", password)
      const result = await login(username, password);
      console.log("result :", result)
      if (result && result.accessToken) {
        localStorage.setItem('token', result.accessToken);
        window.dispatchEvent(new CustomEvent('authChange'));
        try {
          const me = await getCurrentUser();
          if (me && (me as any).profileCompleted === false) {
            nav('/complete-profile');
          } else {
            nav('/dashboard');
          }
        } catch {
          nav('/dashboard');
        }
      } else {
        setError(result?.message || 'Invalid username or password');
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Network error. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen text-white relative overflow-hidden" style={{ backgroundColor: '#2361c6' }}>
      <div className="absolute inset-0 overflow-hidden z-0">
        <motion.div animate={{ x: [0, 50, 0], y: [0, -30, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }} className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></motion.div>
        <motion.div animate={{ x: [0, -40, 0], y: [0, 20, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }} className="absolute bottom-0 left-0 w-80 h-80 bg-yellow-400/10 rounded-full blur-2xl transform -translate-x-40 translate-y-40"></motion.div>
      </div>

      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="px-6 py-4 absolute top-0 left-0 right-0 z-50"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between backdrop-blur-lg bg-white/5 rounded-2xl px-6 py-2 border border-white/10 shadow-xl">
          <div className="flex items-center">
            <img src="/assets/Logo.png" alt="MoniPark" className="w-24 h-24 object-contain" />
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10 hover:text-yellow-400 flex items-center gap-2" 
              onClick={() => nav('/')}
            >
              <ArrowLeft size={16} />
              Back to Home
            </Button>
            <Button 
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium" 
              onClick={() => nav('/register')}
            >
              Register
            </Button>
          </div>
        </div>
      </motion.nav>

      <div className="flex-1 flex items-center justify-center p-8 relative z-10 pt-32 md:pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <CardContent className="space-y-6 pt-6">
              <h3 className="text-2xl font-semibold text-center text-white">Sign in to MoniPark</h3>
              {error && (
                <div className="text-red-300 text-sm text-center bg-red-500/20 p-3 rounded-lg border border-red-500/30">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <Input 
                  type="text" 
                  placeholder="Username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-black/20 border-white/20 text-white placeholder-gray-400 focus:ring-yellow-400 focus:border-yellow-400"
                />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="bg-black/20 border-white/20 text-white placeholder-gray-400 focus:ring-yellow-400 focus:border-yellow-400"
                />
              </div>
              <Button 
                size="lg" 
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium" 
                onClick={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="animate-pulse">Signing in...</span>
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" /> Sign In
                  </>
                )}
              </Button>
              <Button 
                variant="link" 
                className="w-full text-blue-300 hover:text-yellow-300" 
                onClick={() => nav('/register')}
              >
                Don't have an account? Register
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    
    </div>
    
  );
}