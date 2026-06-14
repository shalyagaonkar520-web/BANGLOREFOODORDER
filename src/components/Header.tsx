import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, User, Bell, Menu, X, Compass, PartyPopper, Utensils, LogOut, PackageSearch } from 'lucide-react';
import { useLocationStore } from '../store/locationStore';
import { useNavigate, Link } from 'react-router-dom';



export default function Header() {
  const { deliveryLocation, openLocationPicker } = useLocationStore();
  const navigate = useNavigate();

  const userPhone = localStorage.getItem('moms_magic_user_phone');

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

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/food" className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-[#4CD964] transition-colors flex items-center gap-1.5">
            <Utensils className="w-3.5 h-3.5 text-[#4CD964]" /> Food Order
          </Link>
          <Link to="/bulk" className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-[#4CD964] transition-colors flex items-center gap-1.5">
            <PartyPopper className="w-3.5 h-3.5 text-[#4CD964]" /> Party Specials
          </Link>
          {userPhone && (
            <Link to="/orders" className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-[#4CD964] transition-colors flex items-center gap-1.5">
              <PackageSearch className="w-3.5 h-3.5 text-[#4CD964]" /> My Orders
            </Link>
          )}
        </nav>

        {/* Right Side: Icons (Mobile) */}
        <div className="flex md:hidden items-center gap-2">
          {userPhone && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/orders')}
              className="w-8 h-8 rounded-full bg-white/5 border border-[#4CD964]/30 flex items-center justify-center shadow-sm shrink-0"
            >
              <PackageSearch className="w-4 h-4 text-[#4CD964]" />
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
}
