import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { AccountPopup } from './AccountPopup';

export const Header: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const togglePopup = () => {
    setIsPopupOpen(!isPopupOpen);
  };

  return (
    <header className="bg-black text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="MoniPark" className="w-10 h-10" />
            <span className="text-xl font-bold">MoniPark</span>
          </Link>

          <nav className="hidden lg:flex items-center space-x-4">
            <Link to="/attendance" className="text-gray-300 hover:text-white transition-colors">Attendance</Link>
            <Link to="/parking" className="text-gray-300 hover:text-white transition-colors">Parking</Link>
            <Link to="/cup" className="text-gray-300 hover:text-white transition-colors">CUP</Link>
            <Link to="/resources" className="text-gray-300 hover:text-white transition-colors">Resources</Link>
            <Link to="/contact" className="text-gray-300 hover:text-white transition-colors">Contact</Link>
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
          </div>
        </div>
      </div>
    </header>
  );
};
