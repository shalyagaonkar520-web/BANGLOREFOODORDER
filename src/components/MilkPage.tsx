import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function MilkPage() {
  const showComingSoonToast = () => {
    toast('Coming Soon! In a few days it will be available 🚀', {
      icon: '⏰',
      style: {
        background: '#161A22',
        color: '#FFD700',
        border: '1px solid rgba(255, 215, 0, 0.2)',
      },
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto p-8 py-24 flex flex-col items-center justify-center text-center space-y-8 min-h-[70vh]">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={showComingSoonToast}
        className="cursor-pointer space-y-8 flex flex-col items-center"
      >
        <div className="w-40 h-40 bg-blue-400/10 rounded-full flex items-center justify-center border border-blue-400/20 relative">
          <span className="material-symbols-outlined w-20 h-20 text-blue-400">local_drink</span>
          <div className="absolute inset-0 bg-blue-400/10 blur-3xl rounded-full animate-pulse" />
        </div>
        <div className="space-y-4">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter italic text-white uppercase">MANE <span className="text-blue-400">HALU</span></h1>
          <p className="text-blue-400 font-black uppercase tracking-[10px] text-xl flex items-center justify-center gap-3">
            <span className="material-symbols-outlined w-6 h-6">schedule</span> Coming Soon
          </p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); window.history.back(); }} 
          className="px-12 py-5 bg-white/5 border border-white/10 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-400 hover:text-white transition-all active:scale-95"
        >
          Return to Home
        </button>
      </motion.div>
    </div>
  );
}
