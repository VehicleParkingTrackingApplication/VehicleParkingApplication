import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Youtube, Linkedin } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Social Icons */}
          <div className="flex space-x-4">
            <Link to="#" className="text-gray-400 hover:text-white"><Twitter /></Link>
            <Link to="#" className="text-gray-400 hover:text-white"><Instagram /></Link>
            <Link to="#" className="text-gray-400 hover:text-white"><Youtube /></Link>
            <Link to="#" className="text-gray-400 hover:text-white"><Linkedin /></Link>
          </div>

          {/* Use Cases */}
          <div>
            <h3 className="font-bold mb-4">Use cases</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-400 hover:text-white">Parking Slot Management</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white">SME solution</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white">How to use</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white">Documentation</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-400 hover:text-white">Facebook</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white">Instagram</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-white">Website</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-bold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="#" className="text-gray-400 hover:text-white">Customer Feedback</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};