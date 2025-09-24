import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { authInterceptor } from '../../services/authInterceptor';

interface AccountPopupProps {
  onClose: () => void;
}

export const AccountPopup: React.FC<AccountPopupProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleMyDetailsClick = () => {
    navigate('/account');
    onClose();
  };

  const handleLogout = async () => {
    try {
      console.log('AccountPopup: Logout button clicked');
      await authInterceptor.logout();
      navigate('/signin');
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, still redirect to signin
      navigate('/signin');
      onClose();
    }
  };

  return (
    <div className="absolute top-full right-0 mt-3 w-56">
      <div className="relative">
        {/* Triangle */}
        <div 
          className="absolute top-0 right-3 w-0 h-0"
          style={{ 
            transform: 'translateY(-100%)',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '8px solid #1f2937' // Corresponds to bg-gray-800
          }}
        ></div>
        
        <Card className="bg-gray-800 text-white border-gray-700 shadow-lg">
          <CardContent className="p-3">
            <div className="text-center mb-2">
              <h3 className="text-lg font-semibold">Binh Nguyen</h3>
              <p className="text-sm text-gray-400">Manager</p>
            </div>
            <hr className="border-gray-600" />
            <div className="flex justify-around mt-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 h-auto text-sm"
                onClick={handleMyDetailsClick}
              >
                My Details
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 h-auto text-sm" 
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};