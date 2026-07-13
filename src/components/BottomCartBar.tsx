import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';

import { useNavigate, useLocation } from 'react-router-dom';
import { useSystemStore } from '../store/systemStore';
import { ShoppingBag, ChevronRight } from 'lucide-react';

export default function BottomCartBar() {
  const { items, total } = useCartStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const settings  = useSystemStore(state => state.settings);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const isOrderingPaused = settings.websiteStatus === 'OFF' || settings.emergencyStop;

  // Hide on checkout or when cart is empty
  if (
    itemCount === 0 ||
    location.pathname === '/checkout' ||
    isOrderingPaused
  ) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed bottom-[80px] left-0 right-0 px-4 z-[110] md:bottom-4"
      >
        <button
          onClick={() => navigate('/cart')}
          className="w-full max-w-sm mx-auto flex items-center justify-between bg-[#111827]/95 backdrop-blur-xl text-white rounded-[24px] px-5 py-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] hover:bg-black active:scale-[0.97] transition-all border border-gray-800"
        >
          {/* Left: item count badge */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 rounded-full flex items-center justify-center relative">
              <ShoppingBag className="w-5 h-5 text-white" />
              <AnimatePresence>
                <motion.span
                  key={itemCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full shadow-sm"
                >
                  {itemCount}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-sm leading-tight text-white">
                ₹{total}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-white/80 font-medium">
                plus taxes
              </span>
            </div>
          </div>

          {/* Right: Checkout */}
          <div className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full font-bold text-[13px] tracking-wide shadow-[0_4px_12px_rgba(255,107,53,0.3)] hover:bg-orange-600 transition-colors">
            View Cart
            <ChevronRight className="w-4 h-4" />
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
