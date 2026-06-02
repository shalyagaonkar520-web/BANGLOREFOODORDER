import { Home, ShoppingBag, User, Search, Wine } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Search', path: '/food' },
    { icon: Wine, label: 'Bar', path: '/bar-menu' },
    { icon: ShoppingBag, label: 'Cart', path: '/cart' },
    { icon: User, label: 'Account', path: '/admin' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] md:hidden bg-[#050505]/95 backdrop-blur-[25px] border-t border-white/5 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] pb-[calc(env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around h-15 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className="flex-1 flex flex-col items-center justify-center h-full"
            >
              <div className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[#4CD964] scale-105 font-black' : 'text-white/40 font-semibold'}`}>
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[8px] uppercase tracking-widest font-black">
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
