import { Clock, CheckCircle, User } from "lucide-react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const { t } = useTranslation();

  const navItems = [
    { id: 'home', icon: Clock, label: t('navigation.home'), path: '/' },
    { id: 'completed', icon: CheckCircle, label: t('navigation.completed'), path: '/completed' },
    { id: 'upcoming', icon: Clock, label: t('navigation.upcoming'), path: '/upcoming' },
    { id: 'profile', icon: User, label: t('navigation.profile'), path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 safe-area-bottom">
      <div className="grid grid-cols-4 h-16" style={{ direction: 'rtl' }}>
        {navItems.map((item) => {
          const isActive = location === item.path;
          const IconComponent = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => {
                setLocation(item.path);
              }}
              className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                !isActive ? 'text-gray-400 hover:text-gray-600' : ''
              }`}
              style={isActive ? {color: '#008553'} : {}}
            >
              <IconComponent className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
