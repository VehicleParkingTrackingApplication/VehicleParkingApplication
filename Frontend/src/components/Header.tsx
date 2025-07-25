import React from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

const navItems = ['Attendance', 'Parking', 'CUP', 'Resources', 'Contact'];

export default function Header() {
  const navigate = useNavigate();

  return (
    <header className="w-full px-6 py-4 flex items-center justify-between bg-transparent">
        <div className="flex items-center">
            <img src="/logo.png" alt="MoniPark Logo" className="h-8 w-auto" />
        </div>
        <nav className="flex space-x-4">
            {navItems.map(item => (
            <Button key={item} variant="ghost" size="sm" onClick={() => navigate('/')}>
                {item}
            </Button>
            ))}
        </nav>
        <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon">
            {/* bell icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5S10.5 3.17 10.5 4v.68C7.63 5.36 6 7.92 6 11v5l-1.99 2H20l-2-2z" />
            </svg>
            </Button>
            <span className="text-sm font-medium">Binh</span>
            <Button variant="outline" size="sm" onClick={() => navigate('/signin')}>Logout</Button>
        </div>
    </header>
  );
}