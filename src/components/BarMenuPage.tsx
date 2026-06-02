import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Lock, ArrowLeft, Heart, Search, ArrowUpDown, 
  Check, X, Volume2, Wine, Flame, Sparkles, Loader2, Compass 
} from 'lucide-react';
import { playSound, SOUNDS } from '../utils/audio';
import { useCartStore } from '../store/cartStore';
import Header from './Header';
import toast from 'react-hot-toast';

interface Drink {
  id: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  price: number;
  image: string;
  isAvailable: boolean;
}

const CATEGORIES = [
  { id: 'All', name: 'All Drinks', emoji: '🍸' },
  { id: 'Beer', name: 'Beer', emoji: '🍺' },
  { id: 'Whisky', name: 'Whisky', emoji: '🥃' },
  { id: 'Rum', name: 'Rum', emoji: '🍹' },
  { id: 'Vodka', name: 'Vodka', emoji: '🍸' },
  { id: 'Wine', name: 'Wine', emoji: '🍷' },
  { id: 'Brandy', name: 'Brandy', emoji: '🍾' },
  { id: 'Gin', name: 'Gin', emoji: '🌿' }
];

export default function BarMenuPage() {
  const navigate = useNavigate();
  const addItemToCart = useCartStore(state => state.addItem);

  // Security & Gates States
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);

  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Drinks Catalogue States
  const [drinks, setDrinks] = useState<Drink[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'default'>('default');
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('moms_magic_bar_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Fetch drinks list
  const fetchDrinks = async () => {
    setLoading(true);
    try {
      // Always load directly from local data – no backend required
      const fallback = await import('../data/barDrinks.json');
      setDrinks((fallback.default as any) || []);
    } catch (error) {
      console.error('Failed to load bar drinks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset lock state on every fresh mount
    sessionStorage.removeItem('moms_magic_bar_unlocked');
  }, []);

  // Re-fetch drinks whenever the bar is unlocked
  useEffect(() => {
    if (isUnlocked) {
      fetchDrinks();
    }
  }, [isUnlocked]);

  // Handle Password Unlock
  const handleUnlockCellar = (e: React.FormEvent) => {
    e.preventDefault();
    playSound(SOUNDS.CLICK);
    
    if (passwordInput === 'opensimsim') {
      sessionStorage.setItem('moms_magic_bar_unlocked', 'true');
      setIsUnlocked(true);
      setPasswordError(false);
      toast.success('Unlocked!', { icon: '🔑', duration: 3000 });
    } else {
      setPasswordError(true);
      playSound(SOUNDS.CLICK); // Error sound feedback
      toast.error('Passphrase incorrect.', { icon: '🚨' });
      // Clear error after shake completes
      setTimeout(() => setPasswordError(false), 800);
    }
  };

  // Toggle Favorite
  const toggleFavorite = (drinkId: string) => {
    playSound(SOUNDS.CLICK);
    let updated;
    if (favorites.includes(drinkId)) {
      updated = favorites.filter(id => id !== drinkId);
    } else {
      updated = [...favorites, drinkId];
      toast.success('Added to favorites!', { icon: '❤️', duration: 1500 });
    }
    setFavorites(updated);
    localStorage.setItem('moms_magic_bar_favorites', JSON.stringify(updated));
  };

  // Add to Room Service Cart
  const handleOrderRoomService = (drink: Drink) => {
    if (!drink.isAvailable) return;
    playSound(SOUNDS.ADD_TO_CART);

    // Map Drink to Product standard type
    const product = {
      id: drink.id,
      name: drink.name,
      price: drink.price,
      image: drink.image,
      category: `Bar - ${drink.category}`,
      type: 'food' as const,
      description: `${drink.brand} • ${drink.size} Premium liquor selection. Served cold to your room or villa.`,
      isAvailable: drink.isAvailable
    };

    addItemToCart(product);
    toast.success(`${drink.name} added to Room Service Cart! 🥃`, {
      style: {
        border: '1px solid rgba(255, 183, 0, 0.3)',
        background: '#121620',
        color: '#FFB700',
      }
    });
  };

  // Filter and Sort Drinks
  const filteredDrinks = drinks.filter(drink => {
    const matchesSearch = 
      drink.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      drink.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All' || 
      drink.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const sortedDrinks = [...filteredDrinks].sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return 0; // default order
  });

  // Render Password Speakeasy Door Gate
  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-[150] bg-[#050505] flex items-center justify-center p-6 font-sans">
        {/* Glow Spheres */}
        <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] bg-[#FFB700]/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[55%] h-[55%] bg-[#FFB700]/5 rounded-full blur-[180px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Keyhole Speakeasy Header */}
          <div className="text-center mb-10 space-y-4">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-[35px] bg-[#FFB700]/15 blur-lg" />
              <div className="w-18 h-18 rounded-[28px] bg-gradient-to-br from-[#FFB700] to-[#FFD166] flex items-center justify-center border border-white/10 shadow-2xl relative rotate-12">
                <Lock className="w-8 h-8 text-matte-black" />
              </div>
            </div>
            
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-r from-[#FFB700] to-[#FFD166] drop-shadow-xl text-center leading-none">
              LOCKED
            </h1>
          </div>

          {/* Form */}
          <motion.div 
            animate={passwordError ? { x: [-12, 12, -12, 12, -8, 8, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="bg-[#0F121C]/80 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10 shadow-[0_30px_60px_rgba(0,0,0,0.8)]"
          >
            <form onSubmit={handleUnlockCellar} className="space-y-6">
              <div className="space-y-2 text-left">
                <input 
                  type="password"
                  required
                  placeholder="Password"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className={`w-full px-6 py-4.5 bg-white/5 rounded-2xl border outline-none font-bold text-sm text-center text-white transition-all placeholder:text-white/20 ${
                    passwordError 
                      ? 'border-red-500/50 focus:border-red-500 bg-red-500/5' 
                      : 'border-white/10 focus:border-[#FFB700]/40'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full h-16 rounded-[22px] bg-gradient-to-r from-[#FFB700] to-[#FFD166] text-matte-black font-black text-xs uppercase tracking-[3px] shadow-lg shadow-[#FFB700]/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                Unlock
              </button>
            </form>
          </motion.div>

          <div className="text-center mt-6">
            <button 
              onClick={() => navigate('/')} 
              className="text-white/30 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Main Lobby
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // MAIN BAR CATALOGUE RENDER
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32 relative">
      <Header />

      {/* Ambient glowing bar environment */}
      <div className="absolute top-[10%] left-[-10%] w-[55%] h-[55%] bg-[#FFB700]/5 rounded-full blur-[220px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[45%] h-[45%] bg-[#FFB700]/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-[1400px] mx-auto px-6 pt-8 text-left relative z-10">
        
        {/* Back Link */}
        <button 
          onClick={() => {
            playSound(SOUNDS.CLICK);
            navigate('/');
          }}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Lobby
        </button>

        {/* Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <span className="text-[#FFB700] font-black uppercase tracking-[6px] text-xs flex items-center gap-2">
              <Wine className="w-4 h-4 text-[#FFB700] fill-[#FFB700]/10" /> Moms Magic Resort Speakeasy
            </span>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFB700] to-[#FFD166] drop-shadow-[0_0_30px_rgba(255,183,0,0.1)]">Secret</span> Cellar
            </h1>
            <p className="text-white/40 text-xs font-black uppercase tracking-[3px]">Luxury Room Service Alcohol Catalog</p>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-[#FFB700]/10 text-[#FFB700] text-[9px] font-black uppercase tracking-wider px-3.5 py-2.5 rounded-xl border border-[#FFB700]/10 flex items-center gap-1.5">
              ⚡ Room Delivery: 15-20 Mins
            </span>
          </div>
        </div>

        {/* Search & Sort Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Search bar */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text"
              placeholder="Search spirits, brands, categories (e.g. Absolut, Rum...)"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-13 pr-6 py-4.5 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-[#FFB700]/30 transition-all placeholder:text-white/20"
            />
          </div>

          {/* Sort pricing */}
          <div className="relative">
            <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <select
              value={sortBy}
              onChange={e => {
                playSound(SOUNDS.CLICK);
                setSortBy(e.target.value as any);
              }}
              className="w-full pl-13 pr-6 py-4.5 bg-white/5 rounded-2xl border border-white/10 text-white/70 font-black outline-none focus:border-[#FFB700]/30 transition-all appearance-none cursor-pointer uppercase tracking-wider text-xs"
            >
              <option value="default">Sort: Default Order</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Sticky Category Tabs */}
        <div className="sticky top-[72px] z-40 -mx-6 px-6 py-3.5 bg-[#050505]/90 backdrop-blur-md border-y border-white/5 mb-10 overflow-x-auto no-scrollbar flex items-center gap-3">
          {CATEGORIES.map(category => {
            const isActive = selectedCategory === category.id;
            return (
              <button
                key={category.id}
                onClick={() => {
                  playSound(SOUNDS.CLICK);
                  setSelectedCategory(category.id);
                }}
                className={`px-6 py-3.5 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shrink-0 border ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#FFB700] to-[#FFD166] text-matte-black border-[#FFD166] shadow-[0_5px_15px_rgba(255,183,0,0.2)]' 
                    : 'bg-white/5 border-white/5 text-white/60 hover:text-white hover:border-white/15'
                }`}
              >
                <span>{category.emoji}</span>
                <span>{category.name}</span>
              </button>
            );
          })}
        </div>

        {/* Loader Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-[420px] rounded-[35px] bg-white/[0.02] border border-white/5 animate-pulse flex flex-col justify-between p-6">
                <div className="w-full aspect-[4/3] rounded-2xl bg-white/5 mb-4" />
                <div className="h-6 bg-white/5 rounded-md w-[80%] mb-2" />
                <div className="h-4 bg-white/5 rounded-md w-[40%] mb-6" />
                <div className="h-12 bg-white/5 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : sortedDrinks.length > 0 ? (
          /* Cards Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {sortedDrinks.map(drink => {
              const isFav = favorites.includes(drink.id);
              return (
                <motion.div
                  key={drink.id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="bg-[#0C101A] border border-white/5 rounded-[35px] overflow-hidden group shadow-xl hover:border-[#FFB700]/30 transition-colors flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-black/20">
                    <img 
                      src={drink.image} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" 
                      alt={drink.name} 
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Dark gradient shadow inside image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C101A] via-transparent to-black/30" />

                    {/* Category Stamp */}
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-wider text-white">
                      {drink.category}
                    </div>

                    {/* Favorite Heart Button */}
                    <button 
                      onClick={() => toggleFavorite(drink.id)}
                      className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white transition-colors hover:bg-white/10"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? 'fill-red-500 text-red-500' : 'text-white/60'}`} />
                    </button>

                    {/* Stock Alert */}
                    {!drink.isAvailable && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] flex items-center justify-center z-10">
                        <span className="bg-red-500/10 border border-red-500/25 px-5 py-2.5 rounded-full text-red-400 text-[10px] font-black uppercase tracking-widest">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 space-y-4 text-left flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-[#FFB700]/60 block uppercase tracking-widest">{drink.brand}</span>
                      <h4 className="text-xl font-black italic uppercase tracking-tight text-white leading-tight truncate">
                        {drink.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase pt-1">
                        <span>Size: {drink.size}</span>
                        <span>•</span>
                        <span className="text-[#FFB700]">Room Delivery</span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-3 border-t border-white/5">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[9px] font-bold text-white/30 uppercase">Rate Card</span>
                        <span className="text-2xl font-black italic text-[#FFB700]">₹{drink.price}</span>
                      </div>

                      {/* Room Service Order Button */}
                      <button
                        onClick={() => handleOrderRoomService(drink)}
                        disabled={!drink.isAvailable}
                        className={`w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-[2px] shadow-sm flex items-center justify-center gap-2 transition-all ${
                          drink.isAvailable 
                            ? 'bg-[#FFB700] hover:bg-[#FFD166] text-matte-black hover:scale-[1.02] active:scale-95' 
                            : 'bg-white/5 border border-white/5 text-white/20 cursor-not-allowed'
                        }`}
                      >
                        <Wine className="w-3.5 h-3.5" />
                        Order to Room
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Empty Search State */
          <div className="text-center py-20 bg-white/[0.01] border border-white/5 rounded-[45px] space-y-4">
            <Wine className="w-16 h-16 text-white/10 mx-auto" />
            <h3 className="text-xl font-black uppercase text-white">No Spirits Found</h3>
            <p className="text-white/40 text-xs max-w-xs mx-auto leading-relaxed">
              We couldn't find any products matching your current query. Try resetting your category filter or modifying search tags.
            </p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                playSound(SOUNDS.CLICK);
              }}
              className="px-6 py-2.5 bg-white/5 rounded-xl border border-white/10 text-xs font-black uppercase text-white/70 hover:text-white"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
