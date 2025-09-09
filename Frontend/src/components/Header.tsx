import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, LogOut, LayoutDashboard, BarChart2, FileText, Car, Plug, Users, User, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { NotificationPopup } from './NotificationPopup';
import { authInterceptor } from '../services/authInterceptor';
import { getCurrentUser } from '../services/backend';

export const Header: React.FC = () => {
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
          setUserRole(user?.role?.charAt(0).toUpperCase() + user.role.slice(1) || 'Admin');
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
    handleAuthChange();
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  const toggleNotificationPopup = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };
  const handleLogout = async () => {
    await authInterceptor.logout();
    setIsAuthenticated(false);
    navigate('/');
  };
  const getLogoLink = () => isAuthenticated ? '/dashboard' : '/';

  const interactiveBlockClasses = "transition-all duration-150 ease-in-out hover:bg-white/30 hover:shadow-lg active:scale-95 active:shadow-inner";
  const interactiveButtonClasses = "transition-all duration-150 ease-in-out hover:shadow-lg active:scale-95";

  return (
    <header className="backdrop-blur-md bg-white/20 rounded-2xl border border-white/30 p-4 z-50 fixed top-0 left-0 h-screen w-64 text-gray-800">
      <div className="flex flex-col justify-between h-full">
        <div>
          <Link to={getLogoLink()} className="flex items-center justify-center mb-6">
            <img src="/assets/Logo.png" alt="MoniPark" className="w-16 h-16 object-contain" />
          </Link>

          {isAuthenticated && (
            <nav className="flex flex-col space-y-2">
              {userRole === 'Admin' ? (
                <>
                  <Link to="/dashboard" className={`flex items-center text-black hover:font-bold p-2 rounded-md text-base ${interactiveBlockClasses}`}>
                    <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
                  </Link>
                  <Link to="/parking-dashboard" className={`flex items-center text-black hover:font-bold p-2 rounded-md text-base ${interactiveBlockClasses}`}>
                    <BarChart2 className="mr-3 h-5 w-5" /> Statistic
                  </Link>
                  <Link to="/reports" className={`flex items-center text-black hover:font-bold p-2 rounded-md text-base ${interactiveBlockClasses}`}>
                    <FileText className="mr-3 h-5 w-5" /> ReportAI
                  </Link>
                  <Link to="/parking-dashboard" className={`flex items-center text-black hover:font-bold p-2 rounded-md text-base ${interactiveBlockClasses}`}>
                    <Car className="mr-3 h-5 w-5" /> Vehicle
                  </Link>
                  <Link to="/area-management" className={`flex items-center text-black hover:font-bold p-2 rounded-md text-base ${interactiveBlockClasses}`}>
                    <Plug className="mr-3 h-5 w-5" /> Connection
                  </Link>
                  <Link to="/staff-management" className={`flex items-center text-black hover:font-bold p-2 rounded-md text-base ${interactiveBlockClasses}`}>
                    <Users className="mr-3 h-5 w-5" /> Staff Management
                  </Link>
                  <Link to="/staff-management" className={`flex items-center text-black hover:font-bold p-2 rounded-md text-base ${interactiveBlockClasses}`}>
                    <User className="mr-3 h-5 w-5" /> My Details
                  </Link>
                  <Link to="/staff-management" className={`flex items-center text-black hover:font-bold p-2 rounded-md text-base ${interactiveBlockClasses}`}>
                    <Settings className="mr-3 h-5 w-5" /> Setting
                  </Link>
                </>
              ) : (
                <></> // Omitting other role for brevity
              )}
            </nav>
          )}
        </div>

        {/* --- FINAL STACKED BOTTOM SECTION --- */}
        <div className="flex flex-col space-y-2">
          {isAuthenticated ? (
            <>
              {/* Notification Button with Text */}
              <div className="relative">
                <Button
                  variant="ghost"
                  className={`w-full flex items-center justify-center text-black bg-white/20 text-sm py-2 px-3 rounded-md relative ${interactiveButtonClasses}`}
                  onClick={toggleNotificationPopup}
                >
                  <Bell className="h-5 w-5 mr-1" />
                  <span className="truncate">Notification</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
                {isNotificationOpen && (
                  <div className="absolute bottom-50 left-full ml-110 z-2">
                    <NotificationPopup onClose={() => setIsNotificationOpen(false)} />
                  </div>
                )}
              </div>

              {/* Logout Button with custom color */}
              <Button
                onClick={handleLogout}
                className={`w-full flex justify-center items-center bg-[#677ae5] text-white hover:bg-[#5a6acf] text-sm font-semibold py-2 px-3 rounded-md ${interactiveButtonClasses}`}
              >
                <LogOut className="mr-1 h-5 w-5" />
                <span className="truncate">Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/signin')} className={`w-full text-black bg-white/10 text-base ${interactiveBlockClasses}`}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')} className={`w-full bg-yellow-500 text-black hover:bg-yellow-600 text-base ${interactiveBlockClasses}`}>
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

