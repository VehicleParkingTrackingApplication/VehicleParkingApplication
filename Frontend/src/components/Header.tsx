import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, LogOut, LayoutDashboard, BarChart2, FileText, Car, Plug, Users, User, Brain } from 'lucide-react';
import { Button } from './ui/button';

import { NotificationPopup } from './notification/NotificationPopup';
import { getUnreadNotificationCount } from '../services/notificationApi';

// import { NotificationPopup } from './NotificationPopup';

import { authInterceptor } from '../services/authInterceptor';
import { getCurrentUser } from '../services/backend';

export const Header: React.FC = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(authInterceptor.isAuthenticated());
  const [userRole, setUserRole] = useState<string>('User');
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleAuthChange = async () => {
      const authenticated = authInterceptor.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (authenticated) {
        try {
          const user = await getCurrentUser();
          if (user?.role) {
            setUserRole(user.role.charAt(0).toUpperCase() + user.role.slice(1));
          } else {
            setUserRole('User');
          }
          // Fetch actual unread count from API
          try {
            const count = await getUnreadNotificationCount();
            setUnreadCount(count);
          } catch (error) {
            console.error('Failed to fetch unread count:', error);
            setUnreadCount(0);
          }
        } catch (error) {
          console.error('Failed to fetch user role:', error);
          setUserRole('User');
        }
      } else {
        setUnreadCount(0);
        setUserRole('User');
      }
    };
    window.addEventListener('authChange', handleAuthChange);
    handleAuthChange();
    return () => window.removeEventListener('authChange', handleAuthChange);
  }, []);

  // Refresh unread count periodically when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch
    refreshUnreadCount();

    // Set up interval to refresh every 30 seconds
    const interval = setInterval(refreshUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const refreshUnreadCount = async () => {
    if (isAuthenticated) {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to refresh unread count:', error);
      }
    }
  };

  const toggleNotificationPopup = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleNotificationClose = () => {
    setIsNotificationOpen(false);
    // Refresh unread count when popup closes (in case notifications were marked as read)
    refreshUnreadCount();
  };
  const handleLogout = async () => {
    await authInterceptor.logout();
    setIsAuthenticated(false);
    navigate('/');
  };
  const getLogoLink = () => isAuthenticated ? '/dashboard' : '/';

  const getNavItemClasses = (path: string) => {
    const isActive = location.pathname === path;
    return `transition-all duration-200 ease-in-out p-2 rounded-md text-base flex items-center ${
      isActive 
        ? 'bg-white/40 text-white font-semibold shadow-lg' 
        : 'text-white/80 hover:bg-white/20 hover:text-white hover:shadow-md'
    }`;
  };
  
  const interactiveButtonClasses = "transition-all duration-150 ease-in-out hover:shadow-lg active:scale-95";

  return (
    <>
      {/* Logo in top 1/8 area */}
      <div className="fixed top-0 left-0 w-64 h-1/8 flex items-center justify-center z-50 bg-transparent">
        <Link to={getLogoLink()} className="flex items-center justify-center cursor-default">
          <img src="/assets/Logo.png" alt="MoniPark" className="w-24 h-24 object-contain" />
        </Link>
      </div>
      
      {/* Navbar in bottom 7/8 area with blue background */}
      <header className="fixed top-1/8 left-0 h-7/8 w-64 text-gray-800 z-40">
        <div className="h-full w-full rounded-tr-3xl border-r border-white/30 p-4 overflow-hidden" style={{backgroundColor: '#2361c6'}}>
          <div className="flex flex-col justify-between h-full">
            <div className="pt-6">

          {isAuthenticated && (
            <nav className="flex flex-col space-y-2">
              {userRole === 'Admin' ? (
                <>
                  <Link to="/dashboard" className={getNavItemClasses('/dashboard')}>
                    <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
                  </Link>
                  <Link to="/parking-dashboard" className={getNavItemClasses('/parking-dashboard')}>
                    <BarChart2 className="mr-3 h-5 w-5" /> Statistic
                  </Link>
                  <Link to="/reports" className={getNavItemClasses('/reports')}>
                    <FileText className="mr-3 h-5 w-5" /> ReportAI
                  </Link>
                  <Link to="/investigate-ai" className={getNavItemClasses('/investigate-ai')}>
                    <Brain className="mr-3 h-5 w-5" /> InvestigateAI
                  </Link>
                  <Link to="/vehicle" className={getNavItemClasses('/vehicle')}>
                    <Car className="mr-3 h-5 w-5" /> Vehicle
                  </Link>
                  <Link to="/area-management" className={getNavItemClasses('/area-management')}>
                    <Plug className="mr-3 h-5 w-5" /> Connection
                  </Link>
                  <Link to="/staff-management" className={getNavItemClasses('/staff-management')}>
                    <Users className="mr-3 h-5 w-5" /> Staff Management
                  </Link>
                  <Link to="/account" className={getNavItemClasses('/account')}>
                    <User className="mr-3 h-5 w-5" /> My Details
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/dashboard" className={getNavItemClasses('/dashboard')}>
                    <LayoutDashboard className="mr-3 h-5 w-5" /> Dashboard
                  </Link>
                  <Link to="/parking-dashboard" className={getNavItemClasses('/parking-dashboard')}>
                    <BarChart2 className="mr-3 h-5 w-5" /> Statistic
                  </Link>
                  <Link to="/reports" className={getNavItemClasses('/reports')}>
                    <FileText className="mr-3 h-5 w-5" /> ReportAI
                  </Link>
                  <Link to="/investigate-ai" className={getNavItemClasses('/investigate-ai')}>
                    <Brain className="mr-3 h-5 w-5" /> InvestigateAI
                  </Link>
                  <Link to="/vehicle" className={getNavItemClasses('/vehicle')}>
                    <Car className="mr-3 h-5 w-5" /> Vehicle
                  </Link>
                  {/* Hidden for non-admin: Connection (area-management) */}
                  {/* Hidden for non-admin: Staff Management */}
                  <Link to="/account" className={getNavItemClasses('/account')}>
                    <User className="mr-3 h-5 w-5" /> My Details
                  </Link>
                </>
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
                  className={`w-full flex items-center justify-center text-black bg-white text-sm py-2 px-3 rounded-md relative ${interactiveButtonClasses}`}
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
                    <NotificationPopup onClose={handleNotificationClose} />
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
              <Button onClick={() => navigate('/signin')} className={`w-full text-black bg-white/10 text-base transition-all duration-150 ease-in-out hover:bg-white/20 hover:shadow-lg active:scale-95 active:shadow-inner`}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/register')} className={`w-full bg-yellow-500 text-black hover:bg-yellow-600 text-base transition-all duration-150 ease-in-out hover:bg-white/20 hover:shadow-lg active:scale-95 active:shadow-inner`}>
                Sign Up
              </Button>
            </>
          )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

