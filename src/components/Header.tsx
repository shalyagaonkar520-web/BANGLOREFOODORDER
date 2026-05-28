import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, MapPin, ChevronDown, Sparkles, Zap } from 'lucide-react';
import { useLocationStore } from '../store/locationStore';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';

export default function Header() {
  const { items } = useCartStore();
  const { deliveryLocation, openLocationPicker } = useLocationStore();
  const location = useLocation();
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] h-24 px-6 md:px-12 pointer-events-none">
      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between pointer-events-auto">
        <Link to="/" className="flex items-center gap-4 group">
          <motion.div 
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="relative w-14 h-14 md:w-16 md:h-16 rounded-[24px] glass-card flex items-center justify-center border-brand/30 shadow-lg shadow-brand/10"
          >
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
            <div className="absolute inset-0 bg-brand/10 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-black italic tracking-tighter leading-none text-white uppercase">
              Moms <span className="text-brand text-glow">Magic</span>
            </span>
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[4px] mt-1 hidden md:block">Future of Flavors</span>
          </div>
        </Link>

        {/* Dynamic Location Display */}
        <motion.button 
          whileHover={{ y: -2 }}
          onClick={openLocationPicker}
          className="hidden md:flex items-center gap-4 px-6 py-3 rounded-2xl glass-panel border-white/10 hover:border-brand/40 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/20 group-hover:text-white transition-colors">Deliver to</p>
            <p className="text-white font-bold text-xs truncate max-w-[180px] flex items-center gap-2">
              {deliveryLocation ? deliveryLocation.address : 'Select Hub'}
              <ChevronDown className="w-3 h-3 opacity-20" />
            </p>
          </div>
        </motion.button>

        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Food', path: '/food' },
              { label: 'Offers', path: '/offers' },
              { label: 'Milk', path: '/milk' },
              { label: 'Admin', path: '/admin' }
            ].map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-[10px] font-black uppercase tracking-[3px] transition-all hover:text-brand ${location.pathname === item.path ? 'text-brand' : 'text-white/40'}`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <Link to="/cart" className="relative group">
            <motion.div 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center border-brand/20 shadow-lg"
            >
              <ShoppingBag className="w-6 h-6 text-white group-hover:text-brand transition-colors" />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-brand text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg border-2 border-dark-bg"
                  >
                    {itemCount}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </Link>
        </div>
      </div>
    </header>
  );
}

const ShoppingBag = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
