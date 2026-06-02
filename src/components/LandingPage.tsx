import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Plus, Minus, X, Sparkles, ShoppingBag } from 'lucide-react';
import { MENU_ITEMS } from '../data/menuItems';
import { useCartStore } from '../store/cartStore';
import { useSystemStore } from '../store/systemStore';
import toast from 'react-hot-toast';
import Header from './Header';
import { playSound, SOUNDS } from '../utils/audio';

// Swish realistic category metadata (uses photographic food assets)
const CATEGORIES_DATA = [
  { id: 'Combos', name: 'Combo Offers', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80', count: 5 },
  { id: 'Fast Food', name: 'Fast Food', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80', count: 15 },
  { id: 'Rice & Noodles', name: 'Rice & Noodles', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=200&q=80', count: 18 },
  { id: 'Biryani', name: 'Biryani', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=200&q=80', count: 18 },
  { id: 'Starters', name: 'Starters', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200&q=80', count: 12 },
  { id: 'Veg/Gravy', name: 'Veg / Gravy', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=200&q=80', count: 20 },
  { id: 'Roti', name: 'Roti', image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=200&q=80', count: 10 },
  { id: 'Burgers & Rolls', name: 'Burgers & Rolls', image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=200&q=80', count: 14 },
  { id: 'Pizzas & Momos', name: 'Pizzas & Momos', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&q=80', count: 16 },
  { id: 'Maggie', name: 'Maggi & Pasta', image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=200&q=80', count: 13 },
  { id: 'Drinks', name: 'Drinks', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=200&q=80', count: 12 }
];

const ROTATING_SEARCH_PLACEHOLDERS = [
  'Search "Biryani"',
  'Search "Shawarma"',
  'Search "Chicken 65"',
  'Search "Meals"',
  'Search "Paneer Tikka"',
  'Search "Butter Chicken"'
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { addItem, items: cartItems, updateQuantity } = useCartStore();
  const settings = useSystemStore(state => state.settings);
  
  // States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [recommendationOpen, setRecommendationOpen] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<any>(null);

  // Rotating Search Placeholders
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % ROTATING_SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handledAddWithToast = (product: any) => {
    playSound(SOUNDS.ADD_TO_CART);
    addItem(product);
    setLastAddedProduct(product);
    setRecommendationOpen(true); // Automatically slide open sideways drawer when added!
    toast.success(`${product.name} added to cravings plate! 🍳`, {
      style: {
        background: '#FFFFFF',
        color: '#2B2B2B',
        border: '1px solid rgba(76, 217, 100, 0.2)',
        borderRadius: '20px',
        padding: '16px 24px',
        fontWeight: '600',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }
    });
  };

  // Map Combo Offers to standard food format
  const combos = settings?.comboOffers || [];
  const activeCombos = combos.filter(combo => {
    if (!combo.isActive) return false;
    if (combo.expiryDate) {
      const now = new Date();
      const expiry = new Date(combo.expiryDate);
      expiry.setHours(23, 59, 59, 999);
      if (now > expiry) return false;
    }
    return true;
  });

  const mappedCombos = activeCombos.map((combo): any => ({
    id: combo.id,
    name: combo.name,
    price: combo.offerPrice,
    originalPrice: combo.regularPrice,
    category: 'Combos',
    type: 'food',
    image: combo.image || '/chicken_biryani_new.png',
    description: combo.items.join(' + '),
    isVeg: combo.name.toLowerCase().includes('veg'),
    isCombo: true
  }));

  // Combine Combos with MENU_ITEMS - putting combos at the top
  const allProducts = [...mappedCombos, ...MENU_ITEMS];

  // Filter items based on selected category and search query
  const filteredProducts = allProducts.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Separate combos and standard products, sorting both by price low to high
  const comboProducts = filteredProducts.filter(item => item.isCombo).sort((a, b) => a.price - b.price);
  const standardProducts = filteredProducts.filter(item => !item.isCombo).sort((a, b) => a.price - b.price);

  // Combine so combos always appear at the starting/beginning of all page filters
  const displayedProducts = [...comboProducts, ...standardProducts];

  const categoriesWithAll = [
    { id: 'All', name: 'All Dishes', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80' },
    ...CATEGORIES_DATA
  ];

  // Get companion recommendations
  const getRecommendations = () => {
    const baseProduct = lastAddedProduct || MENU_ITEMS[0];
    if (!baseProduct) return [];
    
    const drinks = MENU_ITEMS.filter(item => item.category === 'Drinks' && item.id !== baseProduct.id);
    const starters = MENU_ITEMS.filter(item => item.category === 'Starters' && item.id !== baseProduct.id);
    const fastfood = MENU_ITEMS.filter(item => item.category === 'Fast Food' && item.id !== baseProduct.id);
    
    const recs: any[] = [];
    if (drinks.length > 0) recs.push(drinks[0]);
    if (starters.length > 0) recs.push(starters[0]);
    else if (fastfood.length > 0) recs.push(fastfood[0]);
    if (fastfood.length > 1) recs.push(fastfood[1]);
    else if (MENU_ITEMS.length > 0) {
      const fallback = MENU_ITEMS.filter(item => item.id !== baseProduct.id && !recs.some(r => r.id === item.id));
      if (fallback.length > 0) recs.push(fallback[0]);
    }
    return recs.slice(0, 3);
  };

  return (
    <div className="relative min-h-screen bg-matte-black text-text-main font-sans pb-32">
      <Header />

      {/* BRANDING HEADER BANNER */}
      <div className="px-4 pt-5 pb-2 text-left">
        <h1 className="text-3.5xl sm:text-5xl font-black italic uppercase tracking-tighter leading-none animate-shining-blink">
          Moms Magic 2.0
        </h1>
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1.5">
          Taste the magic of home • Delivered in 10 mins
        </p>
      </div>

      {/* SEARCH BAR AREA */}
      <div className="px-4 pt-4 sticky top-[72px] z-[40] bg-[#050505]/95 backdrop-blur-md pb-2">
        <div className="relative flex items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/40" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={ROTATING_SEARCH_PLACEHOLDERS[searchIndex]}
              className="w-full bg-white/5 border border-white/10 rounded-[18px] py-3.5 pl-11 pr-12 outline-none focus:border-[#4CD964] transition-all font-semibold text-sm text-white placeholder:text-white/30 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            />
            {/* Swish style Toggled Filter Slider on right side of Search bar */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center bg-[#4CD964]/10 p-2 rounded-xl border border-[#4CD964]/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4CD964] inline-block shadow-[0_0_8px_rgba(76,217,100,0.4)] animate-pulse" />
            </div>
          </div>
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center shadow-sm">
            <img src="/logo.png" className="w-7 h-7 object-contain opacity-80" alt="Logo" />
          </div>
        </div>
      </div>

      {/* CATEGORY SECTION (CIRCULAR PHOTOGRAPHY LIST) */}
      <section className="py-4 space-y-3">
        <div className="px-4 text-left flex justify-between items-center">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight italic text-white">Browse <span className="text-[#4CD964]">Categories</span></h2>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Select to filter your cravings</p>
          </div>
          {selectedCategory !== 'All' && (
            <button 
              onClick={() => setSelectedCategory('All')} 
              className="text-[10px] font-extrabold text-[#4CD964] uppercase tracking-wider bg-[#4CD964]/10 px-3 py-1 rounded-full border border-[#4CD964]/20 active:scale-95 transition-all"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="flex gap-5 overflow-x-auto no-scrollbar px-4 py-3">
          {categoriesWithAll.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <div 
                key={cat.id} 
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center gap-3 cursor-pointer shrink-0 group/cat"
              >
                <div className="relative shrink-0">
                  {/* Glowing outer aura that rotates and cycles colors for active category */}
                  {isActive ? (
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-[#4CD964] via-[#FFD166] via-[#FF4D00] via-[#FF007F] to-[#00F0FF] opacity-100 blur-[4px] animate-spin-slow" />
                  ) : (
                    <div className="absolute -inset-0.5 rounded-full bg-white/10 opacity-0 group-hover/cat:opacity-100 group-hover/cat:blur-[3px] transition-all duration-300" />
                  )}
                  
                  {/* Main circular frame */}
                  <div className={`w-[74px] h-[74px] rounded-full p-[3px] relative z-10 flex items-center justify-center overflow-hidden border transition-all duration-300 active:scale-95 ${
                    isActive ? 'bg-[#050505] border-white/20 scale-105 shadow-[0_0_15px_rgba(76,217,100,0.3)]' : 'bg-[#050505] border-white/10 group-hover/cat:border-white/20'
                  }`}>
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      <img 
                        src={cat.image} 
                        className="w-full h-full object-cover group-hover/cat:scale-110 transition-transform duration-500" 
                        alt={cat.name} 
                      />
                      {/* Soft bottom shading overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    </div>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider transition-colors duration-300 ${
                  isActive ? 'text-[#4CD964]' : 'text-white/80 group-hover/cat:text-[#4CD964]'
                }`}>
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ALL FOOD GRID SECTION */}
      <section className="py-4 space-y-4 px-4">
        <div className="text-left flex justify-between items-center border-b border-white/5 pb-2">
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight italic text-white">
              {selectedCategory === 'All' ? 'All' : selectedCategory} <span className="text-[#4CD964]">Dishes</span>
            </h2>
            <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
              {displayedProducts.length} {displayedProducts.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
        </div>

        {displayedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-white/5 rounded-3xl border border-white/5">
            <div className="text-4xl">🔍</div>
            <h3 className="text-md font-bold text-white">No food items found</h3>
            <p className="text-xs text-white/40 max-w-[250px] mx-auto">Try checking other categories or adjust your search.</p>
            <button 
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="text-xs font-black bg-[#4CD964] text-black px-4 py-2 rounded-full uppercase tracking-wider active:scale-95 transition-all mt-2"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {displayedProducts.map((product) => {
              const inCart = cartItems.find(i => i.id === product.id);
              const isCombo = product.isCombo;
              
              return (
                <div 
                  key={product.id} 
                  className={`border rounded-[20px] p-2.5 flex flex-col justify-between relative shadow-[0_8px_25px_rgba(0,0,0,0.5)] group transition-all duration-300 hover:scale-[1.02] ${
                    isCombo 
                      ? 'border-amber-400 bg-gradient-to-b from-[#1A150D] via-[#0E0F14] to-[#0B0E14] shadow-[0_0_20px_rgba(255,209,102,0.25)] animate-gold-blink border-2' 
                      : 'bg-[#0B0E14] border-white/5'
                  }`}
                >
                  {/* Badges / Indicators */}
                  <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1">
                    {isCombo ? (
                      <span className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black text-[6.5px] sm:text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-md animate-pulse border border-yellow-300/30 shrink-0">
                        ⭐ Combo
                      </span>
                    ) : product.fires && product.fires >= 2 ? (
                      <span className="bg-red-500 text-white text-[6px] sm:text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-md self-start shrink-0">
                        🔥 Hot
                      </span>
                    ) : null}
                  </div>

                  {/* Product Image */}
                  <div className="relative aspect-[16/10] rounded-[14px] overflow-hidden mb-2 bg-black/40 shrink-0">
                    <img 
                      src={product.image} 
                      className="w-full h-full object-cover group-hover/product:scale-105 transition-transform duration-500" 
                      alt={product.name} 
                    />
                  </div>

                  {/* Title & Description */}
                  <div className="text-left flex-1 flex flex-col justify-between mt-1 px-1">
                    <div>
                      <h4 className={`text-[12px] sm:text-[13px] font-extrabold truncate tracking-tight mb-0.5 group-hover:text-[#4CD964] transition-colors ${
                        isCombo ? 'text-amber-300' : 'text-white'
                      }`}>
                        {product.name}
                      </h4>
                      {product.description && (
                        <p className="text-[9px] sm:text-[10px] text-white/40 line-clamp-1 leading-tight mb-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Price and Ratings */}
                    <div className="flex items-center justify-between pt-1">
                      <p className={`text-[12px] sm:text-[13px] font-black ${
                        isCombo ? 'text-amber-400' : 'text-white'
                      }`}>₹{product.price}</p>
                      <div className={`flex items-center gap-0.5 ${
                        isCombo ? 'text-amber-400' : 'text-amber-500'
                      }`}>
                        <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-current" />
                        <span className="text-[9px] sm:text-[10px] font-extrabold">4.9</span>
                      </div>
                    </div>

                    {/* Full-width Order Button at the very bottom of card content */}
                    <div className="mt-2.5">
                      {inCart ? (
                        <div className="w-full bg-[#4CD964] text-black rounded-xl flex items-center justify-between px-2 py-1.5 shadow-md border border-white">
                          <button 
                            onClick={() => {
                              playSound(SOUNDS.QUANTITY_TICK);
                              updateQuantity(product.id, inCart.quantity - 1);
                            }}
                            className="text-black hover:text-black/80 active:scale-75 transition-all w-4 h-4 flex items-center justify-center font-bold text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-[10px] sm:text-xs font-black min-w-[8px] text-center">{inCart.quantity} Added</span>
                          <button 
                            onClick={() => {
                              playSound(SOUNDS.QUANTITY_TICK);
                              updateQuantity(product.id, inCart.quantity + 1);
                            }}
                            className="text-black hover:text-black/80 active:scale-75 transition-all w-4 h-4 flex items-center justify-center font-bold text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handledAddWithToast(product)}
                          className="w-full bg-[#4CD964] hover:bg-[#3AC152] text-black font-black text-[10px] sm:text-xs uppercase tracking-wider py-2 rounded-xl shadow-sm transition-transform active:scale-95"
                        >
                          Order Now
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* OPTIONAL SLIDING SIDE RECS TAB - ALWAYS VISIBLE */}
      <motion.button 
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setRecommendationOpen(true)}
        className="fixed right-0 top-[40%] -translate-y-1/2 z-[80] bg-gradient-to-l from-amber-500 to-yellow-400 text-black font-black text-[9px] uppercase tracking-widest pl-3.5 pr-2 py-3.5 rounded-l-2xl shadow-[0_4px_20px_rgba(255,209,102,0.3)] border border-yellow-300/30 flex flex-col items-center gap-1.5 cursor-pointer animate-pulse"
      >
        <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
        <span className="writing-mode-vertical uppercase tracking-wider text-[8px]">Pairings</span>
      </motion.button>

      {/* SIDEWAYS SLIDING RECOMMENDATION PANEL */}
      <AnimatePresence>
        {recommendationOpen && (
          <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-xs" onClick={() => setRecommendationOpen(false)}>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="bg-[#0B0E14] border-l border-[#4CD964]/20 w-[80%] max-w-sm h-full shadow-[-10px_0_40px_rgba(0,0,0,0.6)] flex flex-col justify-between p-5 text-left overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel content */}
              <div className="space-y-6">
                <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div>
                    <div className="flex items-center gap-1 text-[8px] font-black uppercase text-amber-400 tracking-widest">
                      <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      Perfect Pairings
                    </div>
                    <h3 className="text-sm font-extrabold text-white mt-1">
                      {lastAddedProduct ? (
                        <>Pairs well with <span className="text-[#4CD964]">{lastAddedProduct.name}</span></>
                      ) : (
                        <>Signature Cravings for You</>
                      )}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setRecommendationOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/5 text-white/60 flex items-center justify-center hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Recommended items list */}
                <div className="space-y-4">
                  {getRecommendations().map((item) => {
                    const inCart = cartItems.find(i => i.id === item.id);
                    return (
                      <div 
                        key={item.id}
                        className="bg-white/5 border border-white/5 hover:border-[#4CD964]/20 rounded-2xl p-3 flex flex-col gap-3 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/5 shrink-0">
                            <img src={item.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          <div>
                            <h4 className="text-[11px] font-black text-white leading-tight">{item.name}</h4>
                            <span className="text-[8px] text-white/40 font-bold uppercase tracking-wider block mt-0.5">{item.category}</span>
                            <p className="text-[10px] font-black text-[#4CD964] mt-1">₹{item.price}</p>
                          </div>
                        </div>

                        <div>
                          {inCart ? (
                            <div className="w-full bg-[#4CD964] text-black rounded-lg flex items-center justify-between px-2 py-1 shadow-md border border-white">
                              <button 
                                onClick={() => {
                                  playSound(SOUNDS.QUANTITY_TICK);
                                  updateQuantity(item.id, inCart.quantity - 1);
                                }}
                                className="text-black hover:text-black/80 active:scale-75 transition-all w-4.5 h-4.5 flex items-center justify-center font-bold text-xs"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-[9px] font-black text-center">{inCart.quantity} Added</span>
                              <button 
                                onClick={() => {
                                  playSound(SOUNDS.QUANTITY_TICK);
                                  updateQuantity(item.id, inCart.quantity + 1);
                                }}
                                className="text-black hover:text-black/80 active:scale-75 transition-all w-4.5 h-4.5 flex items-center justify-center font-bold text-xs"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => {
                                playSound(SOUNDS.ADD_TO_CART);
                                addItem(item);
                                toast.success(`${item.name} added! 🍯`, { duration: 1500 });
                              }}
                              className="w-full bg-[#4CD964] hover:bg-[#3AC152] text-black font-black text-[9px] uppercase tracking-widest py-2 rounded-xl transition-all active:scale-95"
                            >
                              Order It
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Close Button / Bottom Area */}
              <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                <button 
                  onClick={() => setRecommendationOpen(false)}
                  className="w-full bg-[#4CD964] hover:bg-[#3AC152] text-black font-black text-[10px] uppercase tracking-widest py-3.5 rounded-[18px] text-center shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-black" />
                  <span>Continue To Plate</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
