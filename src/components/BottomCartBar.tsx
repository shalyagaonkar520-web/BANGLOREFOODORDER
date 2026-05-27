import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { useLocationStore } from '../store/locationStore';
import { ShoppingBag, ArrowRight, Zap, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';


export default function BottomCartBar() {
  const { items, total } = useCartStore();
  const { deliveryLocation } = useLocationStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const distanceKm = deliveryLocation?.distance ?? 999;

  
  if (itemCount === 0 || location.pathname === '/cart' || location.pathname === '/checkout') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        className="fixed bottom-[110px] md:bottom-12 left-6 right-6 md:left-1/2 md:-translate-x-1/2 md:max-w-xl z-[90] pointer-events-none"
      >
        <div className="relative group pointer-events-auto">
          {/* Luxury Ambient Glow */}
          <div className="absolute inset-0 bg-brand/10 blur-[80px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative bg-dark-surface/90 backdrop-blur-3xl rounded-3xl md:rounded-[40px] p-3 md:p-5 flex items-center justify-between border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_4s_infinite]" />
            
            <div className="flex items-center gap-3 md:gap-6">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: -5 }}
                className="w-12 h-12 md:w-18 md:h-18 rounded-[20px] md:rounded-[28px] bg-brand flex items-center justify-center relative shadow-2xl shadow-brand/20 border border-white/10 shrink-0"
              >
                <ShoppingBag className="w-5 h-5 md:w-8 md:h-8 text-white" />
                <AnimatePresence>
                  <motion.span 
                    key={itemCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-2 -right-2 md:-top-3 md:-right-3 bg-gold text-matte-black text-[9px] md:text-[10px] font-black w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full shadow-2xl border-2 border-matte-black"
                  >
                    {itemCount}
                  </motion.span>
                </AnimatePresence>
              </motion.div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1 md:gap-2">
                  <Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5 text-gold" />
                  <span className="text-text-muted text-[8px] md:text-[10px] font-black uppercase tracking-[2px] md:tracking-[4px] whitespace-nowrap">Elite Selection</span>
                </div>
                <div className="flex items-baseline gap-1 md:gap-2">
                  <span className="text-white text-xl md:text-3xl font-black italic tracking-tighter">₹{total}</span>

                </div>
              </div>
            </div>

            <motion.button 
              whileHover={{ x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/cart')}
              className="h-12 md:h-18 px-5 md:px-10 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[2px] md:tracking-[3px] text-matte-black flex items-center gap-2 md:gap-3 relative overflow-hidden group/btn shadow-2xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, #F4B400, #FFD95A, #FFEEA9)'
              }}
            >
              <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover/btn:translate-x-0 transition-transform duration-500" />
              <span className="relative z-10 hidden sm:inline">Order Now</span>
              <span className="relative z-10 sm:hidden">Order</span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
