import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { MENU_ITEMS, CATEGORIES } from '../data/menuItems';
import { Search, Plus, Minus, Star, ChevronLeft, Zap, Leaf, Drumstick, ShoppingBag, ArrowRight, MessageCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getRecommendations, RecommendationResult } from '../utils/recommendationEngine';
import RecommendationPopup from './RecommendationPopup';
import { Product } from '../types';

const getDummyRatingInfo = (id: string) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rating = (4.4 + (hash % 7) * 0.1).toFixed(1);
  const reviews = 8 + (hash % 52);
  const messages = [
    "Nice food, must try!",
    "Incredible taste!",
    "Highly recommended!",
    "Super fresh & hot!",
    "Best in the city!",
    "Absolutely delicious!",
    "Amazing quality!"
  ];
  const msg = messages[hash % messages.length];
  return { rating, reviews, msg };
};
import toast from 'react-hot-toast';

export default function CategoryPage({ type }: { type: 'food' | 'grocery' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { addItem, items, updateQuantity, total } = useCartStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [recommendTriggerProduct, setRecommendTriggerProduct] = useState<Product | null>(null);

  useEffect(() => {
    localStorage.removeItem('moms_magic_order_type');
    if (location.state?.category) {
      setActiveCategory(location.state.category);
    }
  }, [location.state]);

  const handleAddWithRecommend = useCallback((product: Product) => {
    addItem(product);
    setTimeout(() => {
      const rec = getRecommendations(product, total + product.price);
      if (rec) {
        setRecommendTriggerProduct(product);
        setRecommendation(rec);
      }
    }, 350);
  }, [addItem, total]);

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter(item => {
      const matchesType = item.type === type;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesDiet = dietFilter === 'all' || (dietFilter === 'veg' ? item.isVeg : !item.isVeg);
      return matchesType && matchesSearch && matchesCategory && matchesDiet;
    });
  }, [type, searchTerm, activeCategory, dietFilter]);

  if (type === 'grocery') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 text-center p-6">
        <div className="w-40 h-40 bg-gold/5 rounded-[50px] flex items-center justify-center border border-gold/10 relative">
          <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full" />
          <ShoppingBag className="w-20 h-20 text-gold" />
        </div>
        <div className="space-y-4">
          <h2 className="text-6xl font-black italic tracking-tighter uppercase text-white">PREMIUM <span className="text-luxury-gold">MARKET</span></h2>
          <p className="text-text-muted font-bold uppercase tracking-[4px] text-[10px]">Curating the finest essentials for you</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-luxury-red px-14">BACK TO SELECTION</button>
      </div>
    );
  }

  return (
    <div className="pb-48">
      {/* Premium Header */}
      <div className="sticky top-0 z-[50] bg-matte-black/95 backdrop-blur-3xl px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 max-w-[1400px] mx-auto">
          <button onClick={() => navigate('/')} className="w-12 h-12 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group hover:border-gold/30 transition-all">
             <ChevronLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
          </button>
          
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-gold transition-colors" />
            <input 
              type="text" 
              placeholder="Search premium flavors..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-gold/30 transition-all font-bold text-sm text-white placeholder:text-text-muted/30"
            />
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-10 max-w-[1400px] mx-auto">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Order <span className="text-luxury-gold">Food</span></h2>
        </div>
        {/* Categories */}
        <div className="space-y-8">
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6">
            {['All', 'Top Picks', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-10 py-5 rounded-[20px] font-black text-[10px] uppercase tracking-[3px] transition-all whitespace-nowrap border ${
                  activeCategory === cat 
                  ? 'bg-gold text-matte-black border-gold shadow-xl shadow-gold/20' 
                  : 'bg-white/5 text-text-muted border-white/5 hover:border-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-4 p-2 bg-white/5 rounded-3xl border border-white/5">
          {[
            { id: 'all', label: 'All Selection', icon: Zap },
            { id: 'veg', label: 'Pure Veg', icon: Leaf },
            { id: 'nonveg', label: 'Classic Non-Veg', icon: Drumstick }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDietFilter(f.id as any)}
              className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${
                dietFilter === f.id 
                ? 'bg-white text-matte-black shadow-lg' 
                : 'text-text-muted hover:text-white'
              }`}
            >
              <f.icon className="w-4 h-4" /> {f.label}
            </button>
          ))}
        </div>

        {/* Product List */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-12">
          {MENU_ITEMS.filter(item => {
            const matchesType = item.type === type;
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = 
              activeCategory === 'All' || 
              (activeCategory === 'Top Picks' ? item.isTopPick : item.category === activeCategory);
            const matchesDiet = dietFilter === 'all' || (dietFilter === 'veg' ? item.isVeg : !item.isVeg);
            return matchesType && matchesSearch && matchesCategory && matchesDiet;
          }).map((product) => {
            const cartItem = items.find(i => i.id === product.id);
            const isRoyal = (product as any).royalHighlight;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`group relative perspective-1000 ${isRoyal ? 'z-10' : 'z-0'}`}
              >
                <div className={`luxury-card rounded-[20px] md:rounded-[40px] p-3 md:p-6 transition-all duration-700 h-full flex flex-col ${
                  isRoyal 
                  ? 'border-[#4CD964]/50 shadow-[0_15px_40px_rgba(76,217,100,0.2)] ring-2 md:ring-4 ring-[#4CD964]/10 bg-gradient-to-br from-[#4CD964]/10 to-[#0B0E14]' 
                  : 'border-[#4CD964]/10 hover:border-[#4CD964]/30 bg-[#0B0E14]'
                }`}>
                  {/* Visual Container */}
                  <div className="relative aspect-square md:aspect-[16/10] rounded-[18px] md:rounded-[35px] overflow-hidden mb-3 md:mb-8 bg-black/40 shrink-0">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 ${isRoyal ? 'opacity-100' : 'opacity-90'}`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0E14] via-transparent to-transparent opacity-90" />
                    
                    <div className="absolute top-2 left-2 md:top-5 md:left-5 flex flex-col gap-1 md:gap-2">
                       <div className={`px-2 md:px-4 py-1 rounded-full border text-[6px] md:text-[8px] font-black uppercase tracking-widest ${product.isVeg ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' : 'bg-red-500/15 text-red-500 border-red-500/30'}`}>
                          {product.isVeg ? 'Pure Veg' : 'Non-Veg'}
                       </div>
                       {isRoyal && (
                          <motion.div 
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="px-2 md:px-4 py-1 rounded-full bg-[#4CD964] text-white text-[6px] md:text-[8px] font-black uppercase tracking-widest shadow-md"
                          >
                            Royal Choice ✨
                          </motion.div>
                       )}
                    </div>
                  </div>

                  {/* Information */}
                  <div className="px-1 md:px-2 pb-1 md:pb-2 flex flex-col flex-1 justify-between gap-3">
                    <div className="flex flex-col md:flex-row md:justify-between items-start gap-2">
                      <div className="space-y-1 w-full md:w-auto overflow-hidden">
                        <h4 className="text-sm md:text-2xl font-black italic uppercase tracking-tighter truncate w-full text-white">{product.name}</h4>
                        <div 
                          className="flex items-center gap-1 cursor-pointer bg-[#4CD964]/10 px-2 py-0.5 rounded-lg border border-[#4CD964]/20 w-fit"
                          onClick={() => setSelectedReviewProduct(product)}
                        >
                          <Star className="w-2.5 h-2.5 text-[#4CD964] fill-[#4CD964]" />
                          <span className="text-[8px] md:text-[10px] font-black uppercase text-[#4CD964] tracking-[1.5px]">
                            {product.rating || getDummyRatingInfo(product.id || '').rating} <span className="text-white/40 ml-0.5 font-bold">({getDummyRatingInfo(product.id || '').reviews})</span>
                          </span>
                        </div>
                      </div>
                      <div className="bg-[#4CD964]/10 text-[#4CD964] border border-[#4CD964]/30 font-black italic tracking-tighter text-xs md:text-xl px-2.5 py-1 rounded-xl shadow-sm shrink-0 flex items-center justify-center mt-1 md:mt-0">
                        ₹{product.price}
                      </div>
                    </div>

                    <p className="hidden md:block text-xs font-medium text-white/60 leading-relaxed line-clamp-2">
                      {product.description}
                    </p>
                    
                    <motion.div 
                      onClick={() => setSelectedReviewProduct(product)}
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="bg-brand/10 border border-brand/20 rounded-lg md:rounded-xl px-2 md:px-4 py-1.5 md:py-2.5 flex gap-1.5 md:gap-3 items-center overflow-hidden relative cursor-pointer hover:bg-brand/20 transition-colors"
                    >
                       <MessageCircle className="w-3 h-3 md:w-4 md:h-4 text-brand shrink-0" />
                       <motion.p 
                         animate={{ x: [0, -10, 0] }}
                         transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                         className="text-[8px] md:text-[10px] font-bold text-white/80 italic leading-tight whitespace-nowrap"
                       >
                         "{getDummyRatingInfo(product.id || '').msg}"
                       </motion.p>
                    </motion.div>

                    {/* Interaction */}
                    <div className="pt-2 md:pt-4 mt-auto">
                      {cartItem ? (
                        <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-[16px] md:rounded-[20px] h-10 md:h-16 px-2 md:px-4">
                          <button 
                            onClick={() => updateQuantity(product.id!, cartItem.quantity - 1)}
                            className="w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl bg-white/10 hover:bg-[#4CD964]/20 transition-all text-white"
                          >
                            <Minus className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </button>
                          <span className="text-sm md:text-xl font-black italic text-white">{cartItem.quantity}</span>
                          <button 
                            onClick={() => handleAddWithRecommend(product)}
                            className="w-7 h-7 md:w-10 md:h-10 flex items-center justify-center rounded-lg md:rounded-xl bg-[#4CD964] text-white shadow-md hover:bg-[#4CD964]/90"
                          >
                            <Plus className="w-3 h-3 md:w-4 md:h-4 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleAddWithRecommend(product)}
                          className={`w-full h-10 md:h-16 rounded-[16px] md:rounded-[20px] group flex items-center justify-center gap-2 font-black uppercase tracking-[1px] text-[9px] md:text-xs transition-all duration-300 ${
                            isRoyal 
                            ? 'bg-gradient-to-r from-[#3AC152] to-[#4CD964] text-white shadow-md shadow-brand/10 hover:scale-[1.03] active:scale-95' 
                            : 'btn-luxury-red'
                          }`}
                        >
                          <span>{isRoyal ? 'ORDER ROYAL' : 'ADD TO CRAVINGS'}</span>
                          <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform text-white shrink-0" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedReviewProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedReviewProduct(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-matte-black border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedReviewProduct(null)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
              
              <h3 className="text-2xl font-black italic uppercase text-white mb-2 pr-10">{selectedReviewProduct.name}</h3>
              <div className="flex items-center gap-2 mb-8">
                <Star className="w-6 h-6 text-gold fill-gold" />
                <span className="text-2xl font-black italic text-gold">{selectedReviewProduct.rating || getDummyRatingInfo(selectedReviewProduct.id || '').rating}</span>
                <span className="text-white/40 text-sm font-bold ml-1">({getDummyRatingInfo(selectedReviewProduct.id || '').reviews} Verified Reviews)</span>
              </div>

              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto no-scrollbar pr-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand/20 rounded-full flex items-center justify-center text-xs font-black text-brand uppercase">
                          {String.fromCharCode(65 + Math.floor(Math.random() * 26))}
                        </div>
                        <div>
                          <span className="text-sm font-black text-white uppercase tracking-widest block">User {Math.floor(Math.random() * 9000) + 1000}</span>
                          <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block">{i === 0 ? 'Just now' : `${i} days ago`}</span>
                        </div>
                      </div>
                      <div className="flex text-gold">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className={`w-3 h-3 ${j < 4 || Math.random() > 0.5 ? 'fill-gold' : 'fill-white/20 text-white/20'}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-white/80 italic font-bold">"{getDummyRatingInfo(selectedReviewProduct.id + i).msg}"</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-6">
                <h4 className="text-[10px] font-black text-brand uppercase tracking-widest mb-4">Add Your Experience</h4>
                <div className="flex gap-3">
                  <input type="text" id="review-input" placeholder="How was the food?" className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 outline-none focus:border-brand/50 transition-colors font-bold text-sm text-white placeholder:text-white/20" />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('review-input') as HTMLInputElement;
                      if (input && input.value.trim()) {
                        toast.success('Review posted successfully! 🌟', {
                          style: { background: '#161A22', color: '#fff', border: '1px solid #FF4D00' }
                        });
                        input.value = '';
                      } else {
                        toast.error('Please write something first!', {
                          style: { background: '#161A22', color: '#fff', border: '1px solid #FF4D00' }
                        });
                      }
                    }}
                    className="bg-brand text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,77,0,0.3)]"
                  >
                    Post
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Recommendation Popup */}
      {recommendation && recommendTriggerProduct && (
        <RecommendationPopup
          result={recommendation}
          triggerId={recommendTriggerProduct.id!}
          onClose={() => setRecommendation(null)}
        />
      )}
    </div>
  );
}
