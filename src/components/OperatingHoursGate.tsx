import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Moon, Sun, AlertCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { useSystemStore } from '../store/systemStore';

export default function OperatingHoursGate({ children }: { children: React.ReactNode }) {
  const settings = useSystemStore(state => state.settings);
  const [isOpen, setIsOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const location = useLocation();
  const isBulkOrder = localStorage.getItem('moms_magic_order_type') === 'bulk';
  const isFoodRoute = location.pathname === '/food' || 
                      location.pathname === '/grocery' ||
                      (location.pathname === '/cart' && !isBulkOrder) ||
                      (location.pathname === '/checkout' && !isBulkOrder);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const isBypassed = location.pathname.startsWith('/admin');
      if (isBypassed || !isFoodRoute) {
        setIsOpen(true);
        return;
      }

      // Check system-level settings overrides first
      if (settings.websiteStatus === 'OFF' || settings.emergencyStop) {
        setIsOpen(false);
        return;
      }

      // Remove the time restriction completely based on user request
      setIsOpen(true);
    };

    checkTime();
    const interval = setInterval(checkTime, 10000); // Check every 10 seconds for real-time responsiveness
    return () => clearInterval(interval);
  }, [isFoodRoute, settings, location.pathname]);

  if (isOpen) {
    return <>{children}</>;
  }

  const hours = currentTime.getHours();
  const isLateNight = hours >= 22 || hours < 6;

  // Format 24h timings from database into a premium AM/PM format
  const formatTime12h = (time24: string) => {
    try {
      const [hStr, mStr] = time24.split(':');
      const h = parseInt(hStr, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const displayHours = h % 12 || 12;
      return { time: `${displayHours}:${mStr}`, ampm };
    } catch (e) {
      return { time: time24, ampm: '' };
    }
  };

  const openTimeFormatted = formatTime12h(settings.openTime);
  const closeTimeFormatted = formatTime12h(settings.closeTime);

  return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-brand/10 rounded-full blur-[200px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[200px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-md text-center space-y-8 relative z-10"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="mx-auto w-28 h-28 rounded-[40px] bg-brand/10 border border-brand/20 flex items-center justify-center relative rotate-12"
        >
          {isLateNight ? (
            <Moon className="w-14 h-14 text-brand" />
          ) : (
            <Sun className="w-14 h-14 text-brand" />
          )}
          <div className="absolute inset-0 bg-brand/10 blur-3xl rounded-full animate-pulse" />
        </motion.div>

        {/* Title */}
        <div className="space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-black italic tracking-tighter text-white uppercase leading-none"
          >
            <>Sorry, We're <br /><span className="text-brand">Closed</span> Now</>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/40 text-sm md:text-base font-bold italic max-w-xs mx-auto leading-relaxed"
          >
            "We're currently not accepting orders. Please come back during our operating hours!"
          </motion.p>
        </div>

        {/* Operating Hours Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-brand/5 rounded-[28px] p-6 border border-brand/10 space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <AlertCircle className="w-5 h-5 text-brand" />
            <span className="text-brand font-black uppercase tracking-[4px] text-[10px]">Operating Hours</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Opens</p>
              <p className="text-2xl font-black italic text-white">
                {openTimeFormatted.time} <span className="text-brand text-sm">{openTimeFormatted.ampm}</span>
              </p>
            </div>
            <div className="w-12 h-[2px] bg-brand/30" />
            <div className="text-center">
              <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-1">Closes</p>
              <p className="text-2xl font-black italic text-white">
                {closeTimeFormatted.time} <span className="text-brand text-sm">{closeTimeFormatted.ampm}</span>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Brand */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex items-center justify-center gap-3 pt-4"
        >
          <img src="/logo.png" alt="Logo" className="w-8 h-8 rounded-full border border-brand/20" />
          <span className="text-xl font-black italic tracking-tighter text-white/60">
            Moms <span className="text-brand">Magic</span>
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}

