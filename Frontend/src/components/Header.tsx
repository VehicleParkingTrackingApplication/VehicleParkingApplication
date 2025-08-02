import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { AccountPopup } from './AccountPopup';
import { authInterceptor } from '../services/authInterceptor';

export const Header: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(authInterceptor.isAuthenticated());
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChange = () => {
      setIsAuthenticated(authInterceptor.isAuthenticated());
    };

    window.addEventListener('authChange', handleAuthChange);

    // Initial check
    handleAuthChange();

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  const handleLogout = async () => {
    await authInterceptor.logout();
    setIsAuthenticated(false);
    navigate('/');
  };

  return (
    <header className="bg-black text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="MoniPark" className="w-10 h-10" />
            <span className="text-xl font-bold">MoniPark</span>
          </Link>

          {isAuthenticated ? (
            <>
              <nav className="hidden lg:flex items-center space-x-4">
                <Link to="/attendance" className="text-gray-300 hover:text-white transition-colors">Attendance</Link>
                <Link to="/parking" className="text-gray-300 hover:text-white transition-colors">Parking</Link>
                <Link to="/cup" className="text-gray-300 hover:text-white transition-colors">CUP</Link>
                <Link to="/area-management" className="text-gray-300 hover:text-white transition-colors">Area Management</Link>
                <Link to="/analytics" className="text-gray-300 hover:text-white transition-colors">Analytics</Link>
              </nav>

              <div className="hidden lg:flex items-center space-x-4">
                <Button variant="ghost" size="icon" className="text-gray-300 hover:text-white">
                  <Bell className="h-6 w-6" />
                </Button>
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="text-white border-gray-600 hover:bg-gray-800"
                    onClick={togglePopup}
                  >
                    Binh
                  </Button>
                  {isPopupOpen && <AccountPopup onClose={() => setIsPopupOpen(false)} />}
                </div>
                <Button onClick={handleLogout} className="text-white hover:bg-gray-800">
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="hidden lg:flex items-center space-x-4">
              <Button onClick={() => navigate('/signin')} className="text-white hover:bg-gray-800">
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')} className="bg-blue-600 text-white hover:bg-blue-700">
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
