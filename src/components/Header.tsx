import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, User, Bell, Gift } from 'lucide-react';
import { useLocationStore } from '../store/locationStore';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { deliveryLocation, openLocationPicker } = useLocationStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-[100] bg-[#050505]/95 backdrop-blur-md px-4 py-3 border-b border-[#4CD964]/10 shadow-[0_2px_15px_rgba(0,0,0,0.5)]">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Delivery Details */}
        <div className="flex flex-col text-left">
          {/* Delivery Time Badge */}
          <div className="flex items-center gap-1.5 w-fit">
            <span className="bg-[#4CD964]/10 text-[#4CD964] text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg shadow-sm flex items-center gap-1">
              ⚡ 10 Minutes
            </span>
          </div>
          
          {/* Location Picker Dropdown */}
          <button 
            onClick={openLocationPicker}
            className="flex items-center gap-1 text-[11px] font-extrabold text-white mt-1 max-w-[180px] sm:max-w-xs transition-colors hover:text-[#4CD964] outline-none"
          >
            <span className="truncate">
              {deliveryLocation ? deliveryLocation.address : 'Balaji PG, Bengaluru'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-white/40 shrink-0" />
          </button>
        </div>

        {/* Right Side: Icons */}
        <div className="flex items-center gap-2">
          {/* Notification Icon */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/cart')}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-sm shrink-0"
          >
            <Bell className="w-4 h-4 text-white/60" />
          </motion.button>

          {/* User Profile */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/admin')}
            className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center overflow-hidden shadow-sm shrink-0"
          >
            <User className="w-4 h-4 text-white/70" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}
