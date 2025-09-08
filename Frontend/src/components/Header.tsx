import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { AccountPopup } from './account/AccountPopup';
import { NotificationPopup } from './NotificationPopup';
import { authInterceptor } from '../services/authInterceptor';
import { getCurrentUser } from '../services/backend';

export const Header: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(authInterceptor.isAuthenticated());
  const [userRole, setUserRole] = useState<string>('Admin');
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthChange = async () => {
      const authenticated = authInterceptor.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        try {
          const user = await getCurrentUser();
          if (user && user.role) {
            setUserRole(user.role.charAt(0).toUpperCase() + user.role.slice(1));
          } else {
            setUserRole('Admin');
          }
          
          // Set mock count for demonstration (will be replaced with real API call)
          setUnreadCount(3);
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          setUserRole('Admin');
        }
      } else {
        setUnreadCount(0);
      }
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

  const toggleNotificationPopup = () => {
    setIsNotificationOpen(!isNotificationOpen);
    // Close account popup if open
    if (isPopupOpen) {
      setIsPopupOpen(false);
    }
  };

  const handleLogout = async () => {
    await authInterceptor.logout();
    setIsAuthenticated(false);
    navigate('/');
  };

  const getLogoLink = () => {
    return isAuthenticated ? '/dashboard' : '/';
  };

  return (
    <header className="bg-gradient-to-b from-blue-900/90 via-blue-800/70 to-blue-800/90 backdrop-blur-sm px-6 py-4 relative z-50 sticky top-0">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between bg-blue-900/40 backdrop-blur-md rounded-2xl px-6 py-3 shadow-2xl text-white">
          <Link to={getLogoLink()} className="flex items-center">
            <img src="/assets/Logo.png" alt="MoniPark" className="w-20 h-20 object-contain" />
          </Link>

          {isAuthenticated ? (
            <>
              <nav className="hidden lg:flex items-center space-x-4">
                {userRole === 'Admin' ? (
                  <>
                    <Link to="/area-management" className="text-gray-300 hover:text-white transition-colors">Area Management</Link>
                    <Link to="/staff-management" className="text-gray-300 hover:text-white transition-colors">Staff Management</Link>
                    <Link to="/analytics" className="text-gray-300 hover:text-white transition-colors">Visualization Dashboard</Link>
                    {/* --- NEW LINK ADDED --- */}
                    <Link to="/reports" className="text-gray-300 hover:text-white transition-colors">Existing Reports</Link>
                  </>
                ) : (
                  <>
                    <Link to="/area-management" className="text-gray-300 hover:text-white transition-colors">Area Management</Link>
                    <Link to="/analytics" className="text-gray-300 hover:text-white transition-colors">Visualization Dashboard</Link>
                    {/* --- NEW LINK ADDED --- */}
                    <Link to="/reports" className="text-gray-300 hover:text-white transition-colors">Existing Reports</Link>
{/* <!--                     <Link to="/area-management" className="text-white hover:text-blue-300 transition-colors">Area Management</Link>
                    <Link to="/staff-management" className="text-white hover:text-blue-300 transition-colors">Staff Management</Link>
                    <Link to="/parking-dashboard" className="text-white hover:text-blue-300 transition-colors">Visualization Dashboard</Link>
                  </>
                ) : (
                  <>
                    <Link to="/area-management" className="text-white hover:text-blue-300 transition-colors">Area Management</Link>
                    <Link to="/analytics" className="text-white hover:text-blue-300 transition-colors">Visualization Dashboard</Link> --> */}
                  </>
                )}
              </nav>

              <div className="hidden lg:flex items-center space-x-4">
                <span className="text-white font-semibold">{userRole}</span>
                
                {/* Notification Bell */}
                <div className="relative">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-white hover:text-blue-300 relative"
                    onClick={toggleNotificationPopup}
                  >
                    <Bell className="h-6 w-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                  {isNotificationOpen && (
                    <NotificationPopup onClose={() => setIsNotificationOpen(false)} />
                  )}
                </div>

                {/* Account Popup */}
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="text-white border-white/20 hover:bg-blue-600/20"
                    onClick={togglePopup}
                  >
                    Binh
                  </Button>
                  {isPopupOpen && <AccountPopup onClose={() => setIsPopupOpen(false)} />}
                </div>
                
                <Button onClick={handleLogout} className="text-white hover:bg-blue-600/20">
                  Logout
                </Button>
              </div>
            </>
          ) : (
            <div className="hidden lg:flex items-center space-x-4">
              <Button onClick={() => navigate('/signin')} className="text-white hover:bg-blue-600/20">
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')} className="bg-yellow-500 text-white hover:bg-yellow-600">
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};