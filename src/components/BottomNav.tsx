import { Home, ShoppingBag, User, Search, Tag, Heart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Tag, label: 'Offers', path: '/offers' },
    { icon: Search, label: 'Search', path: '/food' },
    { icon: Heart, label: 'Team', path: '/about' },
    { icon: ShoppingBag, label: 'Cart', path: '/cart' },
    { icon: User, label: 'Account', path: '/admin' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] md:hidden px-6 pb-6 pointer-events-none" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
      <div className="max-w-lg mx-auto pointer-events-auto">
        <div className="bg-[#0F0F0F]/92 backdrop-blur-[25px] border border-white/5 rounded-[35px] px-4 pt-4 pb-6 flex items-center justify-between shadow-2xl relative overflow-hidden">
          {/* Subtle Golden Glow Line */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
          
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.label}
                to={item.path}
                className="relative group"
              >
                <div className={`flex flex-col items-center gap-1 transition-all duration-500 ${isActive ? 'text-gold' : 'text-white/30'}`}>
                  <motion.div
                    whileTap={{ scale: 0.8 }}
                    className="relative p-2"
                  >
                    <Icon className={`w-6 h-6 transition-all duration-500 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(244,180,0,0.5)]' : 'group-hover:scale-110 group-hover:text-white/60'}`} />
                  </motion.div>
                  <span className={`text-[8px] font-black uppercase tracking-[3px] transition-all duration-500 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 translate-y-2'}`}>
                    {item.label}
                  </span>
                </div>
                
                {isActive && (
                  <motion.div 
                    layoutId="navIndicatorLuxury"
                    className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-gold rounded-full shadow-[0_0_15px_rgba(244,180,0,0.6)]"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
