import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useEffect, useState } from 'react';

export default function UndoManager() {
  const { lastRemovedItem, undoRemove } = useCartStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (lastRemovedItem) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [lastRemovedItem]);

  if (!isVisible || !lastRemovedItem) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-32 right-6 z-[100] flex items-center gap-4 bg-dark-surface border border-brand/30 p-4 rounded-2xl shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-brand uppercase tracking-widest">Removed Item</span>
          <span className="text-sm font-bold text-white truncate max-w-[150px]">{lastRemovedItem.name}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              undoRemove();
              setIsVisible(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/20"
          >
            <Undo2 className="w-4 h-4" /> Undo
          </button>
          
          <button 
            onClick={() => setIsVisible(false)}
            className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
