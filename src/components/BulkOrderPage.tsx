import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, Plus, X, PartyPopper, ShoppingBag, Calendar, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '../store/cartStore';
import { useBulkOrderStore } from '../store/bulkOrderStore';
import { PARTY_ITEMS, SNACKS, ICE_CAKES, NORMAL_CAKES } from '../data/partyItems';
import { MENU_ITEMS } from '../data/menuItems';
import { Product } from '../types';
import { useSEO } from '../utils/seo';

// NOTE: Party Specials label swap (names only):
// - Ice Cakes  -> Normal
// - Normal Cakes -> Ice Cake
type Category = 'Normal' | 'Ice Cake' | 'Party Items' | 'Snacks';

export default function BulkOrderPage() {
  useSEO("Bulk & Party Orders", "Plan and customize your custom catering, cakes, and event setup options at Moms Magic.");
  const navigate = useNavigate();
  const { addItem, items } = useCartStore();
  const [activeCategory, setActiveCategory] = useState<Category>('Normal');
  const [showUpsell, setShowUpsell] = useState(false);

  useEffect(() => {
    localStorage.setItem('moms_magic_order_type', 'bulk');
  }, []);

  const categories: Category[] = ['Normal', 'Ice Cake', 'Party Items', 'Snacks'];

  const advanceToNextCategory = (currentCat: Category) => {
    const currentIndex = categories.indexOf(currentCat);
    if (currentIndex > -1 && currentIndex < categories.length - 1) {
      setActiveCategory(categories[currentIndex + 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/cart');
    }
  };



  const handleAddToCart = (product: Product, category: Category) => {
    addItem(product, undefined, 1);

    toast.success(`${product.name} Added! 🎈`, {
      icon: '🎉',
      style: {
        background: '#161A22',
        color: '#FFD700',
        border: '1px solid #FF4D00'
      }
    });
  };



  const IS_LOCKED = false;
  if (IS_LOCKED) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="space-y-6 relative z-10 max-w-md mx-auto">
          <PartyPopper className="w-16 h-16 text-brand mx-auto opacity-80" />
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-tight">Party <span className="text-brand">Specials</span></h1>
          <div className="bg-brand/20 text-brand px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest inline-block border border-brand/30">
            Coming Soon
          </div>
          <p className="text-white/40 text-sm font-bold mt-4 leading-relaxed">
            We are upgrading our premium celebration experience. Check back later for exclusive bulk deals!
          </p>
          <button onClick={() => navigate('/')} className="mt-8 px-8 py-4 bg-white/5 hover:bg-white/10 transition-colors rounded-2xl font-black text-xs uppercase tracking-widest text-white border border-white/10 w-full">
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white pb-32 overflow-hidden">
      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-[200px] animate-pulse" />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gold/30 rounded-full blur-[1px]"
            initial={{ x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight }}
            animate={{ 
              y: [null, Math.random() * -200 - 100],
              x: [null, Math.random() * 100 - 50],
              opacity: [0, 0.8, 0]
            }}
            transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <div className="relative z-10 px-4 md:px-8 max-w-7xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => navigate('/')} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-full border border-white/10 backdrop-blur-md">
             <PartyPopper className="w-5 h-5 text-brand" />
             <span className="font-black uppercase tracking-widest text-xs">Premium Celebration</span>
          </div>
          <button onClick={() => navigate('/cart')} className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-colors relative">
            <ShoppingBag className="w-5 h-5" />
            {items.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full" />}
          </button>
        </div>




        {/* Upsell: Book A Setup Card at starting of main list */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[30px] bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-brand/20 border border-white/10 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_rgba(168,85,247,0.15)] relative overflow-hidden group mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="space-y-1 relative z-10 text-center sm:text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full border border-purple-500/20">Moms Magic Premium ✨</span>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mt-2">Want a gorgeous live setup or counter?</h3>
            <p className="text-white/60 text-xs font-bold">Let our premium decoration team setup the perfect celebration for you!</p>
          </div>
          <button
            onClick={() => navigate('/celebration')}
            className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 transition-all rounded-2xl font-black text-xs uppercase tracking-widest text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] shrink-0"
          >
            Book A Setup 🏛️
          </button>
        </motion.div>

        {/* Categories Navigation */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 mb-8 snap-x">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`snap-start whitespace-nowrap px-8 py-4 rounded-[20px] font-black uppercase tracking-widest text-xs transition-all duration-300 ${
                activeCategory === cat 
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-[0_10px_30px_rgba(255,77,0,0.3)] scale-105 border border-white/20' 
                : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >

            {/* Normal (Ice Cakes), Ice Cake (Normal Cakes), Party Items & Snacks */}
            {(activeCategory === 'Normal' || activeCategory === 'Ice Cake' || activeCategory === 'Party Items' || activeCategory === 'Snacks') && (
              <div className="space-y-6">

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {(
                    activeCategory === 'Normal' ? ICE_CAKES :
                    activeCategory === 'Ice Cake' ? NORMAL_CAKES :
                    activeCategory === 'Party Items' ? PARTY_ITEMS :
                    SNACKS
                  ).map(item => (
                    <div key={item.id} className="group relative p-5 rounded-[30px] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-colors overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="aspect-square rounded-[20px] overflow-hidden mb-4 relative bg-black/40">
                         <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                         {(activeCategory === 'Normal' || activeCategory === 'Ice Cake') && (
                           <div className="absolute bottom-2 left-2 right-2 text-center">
                             <span className="text-[8px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-brand">{activeCategory}</span>
                           </div>
                         )}
                         {activeCategory === 'Party Items' && (
                           <div className="absolute bottom-2 left-2 right-2 text-center">
                             <span className="text-[8px] font-black uppercase tracking-widest bg-black/60 backdrop-blur-md px-2 py-1 rounded-full border border-white/10 text-white/80">Perfect for Birthday</span>
                           </div>
                         )}

                      </div>
                      
                      <div className="space-y-3 relative z-10">
                        <div>
                          <h4 className="font-black italic uppercase tracking-tighter text-lg leading-tight">{item.name}</h4>
                          <span className="text-brand font-black">₹{item.price}</span>
                        </div>
                        <button 
                          onClick={() => handleAddToCart(item, activeCategory)}
                          className="w-full py-3 bg-white/10 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-brand transition-colors active:scale-95"
                        >
                          Add Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



          </motion.div>
        </AnimatePresence>
      </div>

      {/* Smart Upselling Popup */}
      <AnimatePresence>
        {showUpsell && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-end md:items-center justify-center p-0 md:p-6"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-[#111] w-full md:w-[600px] max-h-[85vh] overflow-y-auto no-scrollbar rounded-t-[40px] md:rounded-[40px] border border-white/10 shadow-2xl relative"
            >
              <div className="sticky top-0 bg-[#111]/90 backdrop-blur-md p-6 border-b border-white/5 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand/20 rounded-full flex items-center justify-center">
                    <PartyPopper className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <h3 className="font-black italic uppercase tracking-tighter text-xl">Complete Your Celebration 🎉</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Highly recommended addons</p>
                  </div>
                </div>
                <button onClick={() => setShowUpsell(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 pb-24 md:pb-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-brand mb-4">Party Essentials</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {PARTY_ITEMS.slice(0, 4).map(item => (
                      <div key={item.id} className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between border border-white/5">
                        <img src={item.image} className="w-full h-24 object-cover rounded-xl mb-3" alt={item.name} />
                        <div className="mb-3">
                          <p className="font-black uppercase text-[10px] truncate">{item.name}</p>
                          <p className="text-brand font-black text-xs">₹{item.price}</p>
                        </div>
                        <button 
                          onClick={() => { addItem(item); toast.success('Added!'); }}
                          className="w-full py-2 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand transition-colors"
                        >
                          Add +
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-brand mb-4">Quick Snacks</h4>
                  <div className="space-y-3">
                    {SNACKS.map(snack => (
                      <div key={snack.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-4">
                          <img src={snack.image} className="w-16 h-16 object-cover rounded-xl" alt="" />
                          <div>
                            <p className="font-black uppercase text-sm">{snack.name}</p>
                            <p className="text-brand font-black text-xs">₹{snack.price}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => { addItem(snack); toast.success('Added!'); }}
                          className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center hover:bg-brand transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="sticky bottom-0 bg-[#111] p-4 border-t border-white/5 md:hidden">
                 <button onClick={() => setShowUpsell(false)} className="w-full py-4 bg-brand rounded-2xl font-black uppercase tracking-widest">Done</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip Button */}
      <button
          onClick={() => advanceToNextCategory(activeCategory)}
          className="fixed bottom-24 left-6 md:bottom-10 md:left-10 z-40 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-4 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/20 active:scale-95 transition-all font-black uppercase tracking-widest text-[10px] flex items-center gap-2"
        >
          Skip {activeCategory} <ArrowRight className="w-4 h-4" />
        </button>
    </div>
  );
}
