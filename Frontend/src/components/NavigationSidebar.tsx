import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, LayoutDashboard, Users, MapPin } from 'lucide-react';

// Navigation Sidebar Component
export const NavigationSidebar: React.FC<{ userRole: string }> = ({ userRole }) => {
  return (
    <div className="fixed left-0 top-0 h-screen w-64 z-40 p-4">
      <div className="h-full bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6">
        <nav className="flex flex-col space-y-3">
          <Link 
            to="/area-management" 
            className="flex items-center space-x-3 p-4 rounded-xl text-white hover:bg-white/20 transition-all duration-200 group"
          >
            <MapPin className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Area Management</span>
          </Link>
          
          {userRole === 'Admin' && (
            <Link 
              to="/staff-management" 
              className="flex items-center space-x-3 p-4 rounded-xl text-white hover:bg-white/20 transition-all duration-200 group"
            >
              <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span className="font-medium">Staff Management</span>
            </Link>
          )}
          
          <Link 
            to="/parking-dashboard" 
            className="flex items-center space-x-3 p-4 rounded-xl text-white hover:bg-white/20 transition-all duration-200 group"
          >
            <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-medium">Dashboard</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};
