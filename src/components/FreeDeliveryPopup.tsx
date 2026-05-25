import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function FreeDeliveryPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Show the popup whenever the user enters the food menu
    if (location.pathname === '/food') {
      setIsOpen(true);
    }
  }, [location.pathname]);

  const handleProceed = () => {
    setIsOpen(false);
    sessionStorage.setItem('foodOfferShown', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md bg-dark-surface rounded-3xl border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,1)] overflow-hidden"
          >
            {/* Header with Icon */}
            <div className="bg-brand p-8 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-10"
              >
                <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30">
                  <Truck className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Free Delivery!</h2>
              </motion.div>
            </div>

            {/* Content */}
            <div className="p-8 text-center space-y-6">
              <div className="space-y-2">
                <p className="text-white/40 font-black uppercase tracking-[4px] text-[10px]">Exclusive Offer</p>
                <p className="text-xl font-bold text-white leading-tight">
                  Unlock <span className="text-brand">FREE DELIVERY</span> on all orders above <span className="text-brand text-2xl">₹300</span>
                </p>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3 text-left">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="text-xs text-white/60 font-medium">
                  This offer will be automatically applied once your cart reaches ₹300.
                </p>
              </div>

              <button
                onClick={handleProceed}
                className="w-full bg-brand text-white py-5 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-brand/20 flex items-center justify-center gap-3 group"
              >
                PROCEED <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
