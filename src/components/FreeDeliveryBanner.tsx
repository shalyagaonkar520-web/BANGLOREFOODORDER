import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FreeDeliveryBanner() {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Use local storage to persist the 24-hour timer across reloads
    let endTimeStr = localStorage.getItem('deliveryTimerEnd');
    let endTime = endTimeStr ? parseInt(endTimeStr, 10) : 0;
    
    if (!endTime || endTime < Date.now()) {
      endTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
      localStorage.setItem('deliveryTimerEnd', endTime.toString());
    }

    const updateTimer = () => {
      const diff = endTime - Date.now();
      
      if (diff <= 0) {
        setIsExpired(true);
        return;
      }
      
      const h = Math.floor((diff / (1000 * 60 * 60)));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, []);

  if (isExpired) return null;

  return (
    <motion.div 
      initial={{ y: -50 }}
      animate={{ y: 0 }}
      className="bg-[#F4B400] text-black py-2 px-4 text-center text-[10px] md:text-xs font-black tracking-widest uppercase flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 shadow-[0_0_15px_rgba(244,180,0,0.4)] z-50 relative sticky top-0"
    >
      <span className="flex items-center gap-2">
        <span className="animate-bounce">🚚</span> FREE DELIVERY TODAY ONLY!
      </span>
      {timeLeft && (
        <div className="flex items-center gap-1.5 bg-black/10 px-3 py-1 rounded-full border border-black/10">
          <Clock className="w-3.5 h-3.5" />
          <span>Ends in {timeLeft}</span>
        </div>
      )}
    </motion.div>
  );
}
