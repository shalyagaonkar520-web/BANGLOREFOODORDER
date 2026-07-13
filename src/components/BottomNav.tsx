import { Link, useLocation } from 'react-router-dom';

import { useCartStore } from '../store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function BottomNav() {
  const location = useLocation();
  const { items } = useCartStore();
  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const isActive = (path: string) => location.pathname === path;

  const tabs = [
    { to: '/',         icon: 'home',          label: 'Home'    },
    { to: '/food',     icon: 'search',        label: 'Search'  },
    { to: '/orders',   icon: 'receipt_long', label: 'Orders'  },
    { to: '/profile',  icon: 'account_balance_wallet', label: 'Wallet', hash: '#wallet' },
    { to: '/profile',  icon: 'person',          label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] md:hidden bg-white/80 backdrop-blur-xl border-t border-[#EBEBF0] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="flex items-center justify-around px-2 py-2 max-w-2xl mx-auto">
        {tabs.map(({ to, icon, label, badge, hash }) => {
          const active = isActive(to);
          return (
              <Link
              key={to + label}
              to={hash ? `${to}${hash}` : to}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all duration-200 relative"
            >
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative"
              >
                <span
                  className={`material-symbols-outlined text-[24px] transition-all duration-200 ${
                    active ? 'text-primary' : 'text-on-surface-variant'
                  }`}
                  style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                >{icon}</span>
              </motion.div>

              <span
                className={`text-[10px] font-bold tracking-wide transition-all duration-200 ${
                  active ? 'text-primary' : 'text-on-surface-variant'
                }`}
              >
                {label}
              </span>

              {/* Active indicator dot */}
              {active && (
                <motion.span
                  layoutId="nav-active-dot"
                  className="absolute top-0 right-1 w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
