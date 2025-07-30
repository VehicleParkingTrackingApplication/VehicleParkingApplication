import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Home, Users, Settings, HelpCircle, FileText, Calendar, BarChart3 } from 'lucide-react';

interface MenuItem {
  title: string;
  url: string;
  icon?: React.ReactNode;
  description?: string;
  items?: MenuItem[];
}

interface NavigationMenuProps {
  className?: string;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ className = '' }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const menuItems: MenuItem[] = [
    {
      title: 'Home',
      url: '/',
      icon: <Home className="w-4 h-4" />
    },
    {
      title: 'Dashboard',
      url: '/',
      icon: <BarChart3 className="w-4 h-4" />
    },
    {
      title: 'Area Management',
      url: '/area-management',
      icon: <Calendar className="w-4 h-4" />,
      items: [
        {
          title: 'All Events',
          url: '/events',
          description: 'Browse all available events'
        },
        {
          title: 'My Events',
          url: '/events/my',
          description: 'View your registered events'
        },
        {
          title: 'Create Event',
          url: '/events/create',
          description: 'Create a new event'
        }
      ]
    },
    {
      title: 'Users',
      url: '/users',
      icon: <Users className="w-4 h-4" />,
      items: [
        {
          title: 'All Users',
          url: '/users',
          description: 'Manage user accounts'
        },
        {
          title: 'User Groups',
          url: '/users/groups',
          description: 'Organize users into groups'
        }
      ]
    },
    {
      title: 'Reports',
      url: '/reports',
      icon: <FileText className="w-4 h-4" />,
      items: [
        {
          title: 'Event Reports',
          url: '/reports/events',
          description: 'View event analytics'
        },
        {
          title: 'User Reports',
          url: '/reports/users',
          description: 'User activity reports'
        }
      ]
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: <Settings className="w-4 h-4" />
    },
    {
      title: 'Help',
      url: '/help',
      icon: <HelpCircle className="w-4 h-4" />
    }
  ];

  const handleDropdownToggle = (title: string) => {
    setOpenDropdown(openDropdown === title ? null : title);
  };

  const handleDropdownClose = () => {
    setOpenDropdown(null);
  };

  return (
    <nav className={`flex items-center space-x-1 ${className}`}>
      {menuItems.map((item) => (
        <div key={item.title} className="relative">
          {item.items ? (
            // Dropdown menu item
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle(item.title)}
                onBlur={() => setTimeout(handleDropdownClose, 150)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                {item.icon}
                {item.title}
                <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === item.title ? 'rotate-180' : ''}`} />
              </button>
              
              {openDropdown === item.title && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    {item.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        to={subItem.url}
                        className="flex flex-col gap-1 p-3 rounded-md hover:bg-gray-50 transition-colors"
                        onClick={handleDropdownClose}
                      >
                        <div className="font-medium text-gray-900">{subItem.title}</div>
                        {subItem.description && (
                          <div className="text-sm text-gray-500">{subItem.description}</div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Regular menu item
            <Link
              to={item.url}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {item.icon}
              {item.title}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default NavigationMenu; 