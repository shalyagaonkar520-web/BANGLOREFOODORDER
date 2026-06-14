import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, User, Bell, Menu, X, Compass, PartyPopper, Utensils, LogOut, PackageSearch } from 'lucide-react';
import { useLocationStore } from '../store/locationStore';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../firebase';


export default function Header() {
  const { deliveryLocation, openLocationPicker } = useLocationStore();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const userPhone = localStorage.getItem('moms_magic_user_phone');
  const handleLogout = () => {
    localStorage.removeItem('moms_magic_user_phone');
    localStorage.removeItem('moms_magic_user_name');
    auth.signOut();
    window.location.reload();
  };

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
          {userPhone ? (
            <>
              <Link to="/orders" className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-[#4CD964] transition-colors flex items-center gap-1.5">
                <PackageSearch className="w-3.5 h-3.5 text-[#4CD964]" /> My Orders
              </Link>
              <button onClick={handleLogout} className="text-xs font-black uppercase tracking-widest text-[#FF4D00]/70 hover:text-[#FF4D00] transition-colors flex items-center gap-1.5">
                <LogOut className="w-3.5 h-3.5 text-[#FF4D00]" /> Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="text-xs font-black uppercase tracking-widest text-white/70 hover:text-[#4CD964] transition-colors flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#4CD964]" /> Login / Signup
            </Link>
          )}
        </nav>

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

          {/* Hamburger Menu for Mobile */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsDrawerOpen(true)}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-sm shrink-0 md:hidden"
          >
            <Menu className="w-4 h-4 text-white/60" />
          </motion.button>
        </div>
      </div>

      {/* Sliding Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-md"
            />
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] z-[160] bg-[#050505]/98 border-l border-white/5 shadow-2xl p-6 flex flex-col justify-between font-sans text-left"
            >
              <div className="space-y-8">
                {/* Drawer Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="text-left">
                    <span className="text-[#4CD964] font-black uppercase tracking-[3px] text-[9px]">Moms Magic</span>
                    <h4 className="text-base font-black italic tracking-tighter text-white uppercase">Resort Portal</h4>
                  </div>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5"
                  >
                    <X className="w-4 h-4 text-white/60" />
                  </button>
                </div>

                <div className="flex flex-col gap-4">
                  <Link 
                    to="/food" 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-xs font-black uppercase tracking-wider text-white hover:text-[#4CD964] transition-colors flex items-center gap-3"
                  >
                    <Utensils className="w-4 h-4 text-[#4CD964]" /> Food Order
                  </Link>
                  <Link 
                    to="/bulk" 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-xs font-black uppercase tracking-wider text-white hover:text-[#4CD964] transition-colors flex items-center gap-3"
                  >
                    <PartyPopper className="w-4 h-4 text-[#4CD964]" /> Party Specials
                  </Link>
                  {userPhone ? (
                    <>
                      <Link 
                        to="/orders" 
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-xs font-black uppercase tracking-wider text-white hover:text-[#4CD964] transition-colors flex items-center gap-3"
                      >
                        <PackageSearch className="w-4 h-4 text-[#4CD964]" /> My Orders
                      </Link>
                      <button 
                        onClick={() => { handleLogout(); setIsDrawerOpen(false); }}
                        className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-xs font-black uppercase tracking-wider text-white hover:text-[#FF4D00] transition-colors flex items-center gap-3 w-full text-left"
                      >
                        <LogOut className="w-4 h-4 text-[#FF4D00]" /> Logout
                      </button>
                    </>
                  ) : (
                    <Link 
                      to="/auth" 
                      onClick={() => setIsDrawerOpen(false)}
                      className="p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl text-xs font-black uppercase tracking-wider text-white hover:text-[#4CD964] transition-colors flex items-center gap-3"
                    >
                      <User className="w-4 h-4 text-[#4CD964]" /> Login / Signup
                    </Link>
                  )}
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-white/5 pt-4 text-center space-y-2">
                <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Yellapur's Premium Selection</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4CD964]" />
                  <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">Rooms & Room Service Online</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
