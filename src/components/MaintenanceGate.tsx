import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wrench, Sparkles, Clock, Hourglass, ShieldAlert } from 'lucide-react';
import { useSystemStore } from '../store/systemStore';

export default function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const settings = useSystemStore(state => state.settings);

  // Target reopening date: May 29, 2026 00:00:00 Local Time
  const targetDate = new Date('2026-05-29T00:00:00');
  
  const [isTimeMaintenanceActive, setIsTimeMaintenanceActive] = useState(true);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = +targetDate - +now;

      if (difference <= 0) {
        setIsTimeMaintenanceActive(false);
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      });
      setIsTimeMaintenanceActive(true);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const isBypassed = location.pathname.startsWith('/admin');
  const isMaintenanceActive = settings.websiteStatus === 'OFF' || settings.emergencyStop;

  // Render original application routes if bypassed or if website is online
  if (isBypassed || !isMaintenanceActive) {
    return <>{children}</>;
  }

  // Format numbers to have a leading zero if they are single digits
  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans select-none">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#FF4B2B]/10 rounded-full blur-[200px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#F4B400]/10 rounded-full blur-[200px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl text-center space-y-8 relative z-10"
      >
        {/* Animated Upgrade Badge & Icon */}
        <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-[48px] bg-gradient-to-tr from-[#FF4B2B] to-[#F4B400] opacity-20 blur-md"
          />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 180 }}
            className="w-24 h-24 rounded-[36px] bg-gradient-to-br from-[#FF4B2B] to-[#F4B400] flex items-center justify-center border border-white/10 shadow-2xl relative rotate-6"
          >
            {settings.emergencyStop ? (
              <ShieldAlert className="w-10 h-10 text-white animate-bounce" />
            ) : (
              <Wrench className="w-10 h-10 text-white animate-bounce" />
            )}
            <Sparkles className="w-5 h-5 text-white absolute top-4 right-4 animate-ping" />
          </motion.div>
        </div>

        {/* Messaging */}
        <div className="space-y-4 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-black uppercase tracking-wider ${settings.emergencyStop ? 'text-red-400' : 'text-[#F4B400]'}`}
          >
            <Clock className="w-3.5 h-3.5" />
            {settings.emergencyStop ? 'Emergency Lockdown' : 'Temporarily Closed'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none"
          >
            Moms Magic <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4B2B] to-[#F4B400]">
              {settings.emergencyStop ? 'Order Lockdown' : 'Getting an Upgrade'}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-white/60 text-sm md:text-base font-medium max-w-md mx-auto leading-relaxed"
          >
            {settings.emergencyStop ? (
              "Our checkout pipelines are temporarily locked due to an operational emergency. We are working diligently to resume normal service shortly!"
            ) : (
              settings.maintenanceMessage
            )}
            <br />
            <span className="text-white/90 font-semibold mt-3 block">
              {settings.reopenMessage}
            </span>
            <span className="text-white/40 text-xs block mt-2 font-normal italic">
              Thank you so much for your kind patience and support! 🙏
            </span>
          </motion.p>
        </div>

        {/* Live Countdown Timer Grid (Only show if not emergency stop) */}
        {!settings.emergencyStop && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white/[0.03] backdrop-blur-md rounded-[32px] p-6 border border-white/10 shadow-2xl max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Hourglass className="w-4 h-4 text-[#F4B400] animate-spin" style={{ animationDuration: '4s' }} />
              <span className="text-white/50 font-black uppercase tracking-[3px] text-[10px]">Reopening In</span>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              {/* Days */}
              <div className="bg-white/5 rounded-2xl py-3 border border-white/5">
                <span className="block text-3xl font-black italic text-white tracking-tighter leading-none">
                  {formatNumber(timeLeft.days)}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/30 mt-1 block">
                  Days
                </span>
              </div>
              {/* Hours */}
              <div className="bg-white/5 rounded-2xl py-3 border border-white/5">
                <span className="block text-3xl font-black italic text-white tracking-tighter leading-none">
                  {formatNumber(timeLeft.hours)}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/30 mt-1 block">
                  Hours
                </span>
              </div>
              {/* Minutes */}
              <div className="bg-white/5 rounded-2xl py-3 border border-white/5">
                <span className="block text-3xl font-black italic text-[#F4B400] tracking-tighter leading-none">
                  {formatNumber(timeLeft.minutes)}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/30 mt-1 block">
                  Mins
                </span>
              </div>
              {/* Seconds */}
              <div className="bg-white/5 rounded-2xl py-3 border border-[#FF4B2B]/20">
                <span className="block text-3xl font-black italic text-[#FF4B2B] tracking-tighter leading-none animate-pulse">
                  {formatNumber(timeLeft.seconds)}
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/30 mt-1 block">
                  Secs
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Branded Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="flex items-center justify-center gap-2.5 pt-4 text-white/40"
        >
          <img src="/logo.png" alt="Logo" className="w-7 h-7 rounded-full border border-white/10 opacity-70" />
          <span className="text-base font-black italic tracking-tighter">
            Moms <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4B2B] to-[#F4B400]">Magic</span>
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
