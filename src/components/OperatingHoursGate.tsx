import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSystemStore } from '../store/systemStore';

export default function OperatingHoursGate({ children }: { children: React.ReactNode }) {
  // Operating hours restriction removed — app is always accessible
  return <>{children}</>;

  // eslint-disable-next-line no-unreachable
  const settings = useSystemStore(state => state.settings);
  const [isOpen, setIsOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const location = useLocation();
  const isBulkOrder = localStorage.getItem('moms_magic_order_type') === 'bulk';
  
  // Apply operating hours to all main consumer routes
  const isConsumerRoute = !location.pathname.startsWith('/admin') &&
                          !location.pathname.startsWith('/feedback') &&
                          !location.pathname.startsWith('/about') &&
                          !(isBulkOrder && (location.pathname === '/checkout' || location.pathname === '/cart'));

  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (isOpen) return;

    const updateCountdown = () => {
      const now = new Date();
      const [openH, openM] = settings.openTime.split(':').map(Number);
      
      let targetDate = new Date(now);
      targetDate.setHours(openH, openM, 0, 0);

      // If target time is in the past for today, target is tomorrow
      if (now >= targetDate) {
        targetDate.setDate(targetDate.getDate() + 1);
      }

      const diffMs = targetDate.getTime() - now.getTime();
      const secs = Math.floor((diffMs / 1000) % 60);
      const mins = Math.floor((diffMs / (1000 * 60)) % 60);
      const hours = Math.floor(diffMs / (1000 * 60 * 60));

      const formatted = [
        hours.toString().padStart(2, '0'),
        mins.toString().padStart(2, '0'),
        secs.toString().padStart(2, '0')
      ].join(':');

      setTimeLeft(formatted);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [isOpen, settings.openTime]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      setCurrentTime(now);
      
      const isBypassed = location.pathname.startsWith('/admin');
      if (isBypassed || !isConsumerRoute) {
        setIsOpen(true);
        return;
      }

      // Check system-level settings overrides first
      if (settings.websiteStatus === 'OFF' || settings.emergencyStop) {
        setIsOpen(false);
        return;
      }

      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${hours}:${minutes}`;

      const isWithinHours = settings.openTime <= settings.closeTime
        ? (currentTimeStr >= settings.openTime && currentTimeStr <= settings.closeTime)
        : (currentTimeStr >= settings.openTime || currentTimeStr <= settings.closeTime);

      if (isWithinHours) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 10000); // Check every 10 seconds for real-time responsiveness
    return () => clearInterval(interval);
  }, [isConsumerRoute, settings, location.pathname]);

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
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[200px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-error/10 rounded-full blur-[200px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />

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
          className="mx-auto w-28 h-28 rounded-[40px] bg-primary/10 border border-primary/20 flex items-center justify-center relative rotate-12"
        >
          {isLateNight ? (
            <span className="material-symbols-outlined text-[56px] text-primary">dark_mode</span>
          ) : (
            <span className="material-symbols-outlined text-[56px] text-primary">light_mode</span>
          )}
          <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
        </motion.div>

        {/* Title */}
        <div className="space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl md:text-5xl font-headline-lg tracking-tighter text-on-background uppercase leading-none"
          >
            <>🔴 Mom's Magic is <br /><span className="text-primary">Currently Closed</span></>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-secondary text-sm md:text-base font-bold max-w-sm mx-auto leading-relaxed"
          >
            Orders are accepted only between {openTimeFormatted.time} {openTimeFormatted.ampm} and {closeTimeFormatted.time} {closeTimeFormatted.ampm}. Please visit again during business hours.
          </motion.p>
        </div>

        {/* Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-surface rounded-[28px] p-6 border border-outline-variant/30 space-y-3 shadow-md"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            <span className="text-secondary font-bold uppercase tracking-widest text-[10px]">Next Opening In</span>
          </div>
          <div className="text-4xl md:text-5xl font-mono font-black tracking-widest text-primary drop-shadow-sm">
            {timeLeft}
          </div>
        </motion.div>

        {/* Operating Hours Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-primary/5 rounded-[28px] p-6 border border-primary/10 space-y-4"
        >
          <div className="flex items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[20px] text-primary">info</span>
            <span className="text-primary font-bold uppercase tracking-widest text-[10px]">Operating Hours</span>
          </div>
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-secondary text-[10px] font-bold uppercase tracking-widest mb-1">Opens</p>
              <p className="text-2xl font-headline-lg text-on-background">
                {openTimeFormatted.time} <span className="text-primary text-sm">{openTimeFormatted.ampm}</span>
              </p>
            </div>
            <div className="w-12 h-[2px] bg-primary/30" />
            <div className="text-center">
              <p className="text-secondary text-[10px] font-bold uppercase tracking-widest mb-1">Closes</p>
              <p className="text-2xl font-headline-lg text-on-background">
                {closeTimeFormatted.time} <span className="text-primary text-sm">{closeTimeFormatted.ampm}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

