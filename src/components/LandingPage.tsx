import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Star, Plus, Minus, X, ArrowRight, Sparkles, Zap, Heart, UtensilsCrossed 
} from 'lucide-react';
import { MENU_ITEMS } from '../data/menuItems';
import { useCartStore } from '../store/cartStore';
import toast from 'react-hot-toast';
import Header from './Header';
import ComboOffersSection from './ComboOffersSection';

// Swish realistic category metadata (uses photographic food assets)
const CATEGORIES_DATA = [
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
  
  // States
  const [searchIndex, setSearchIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentWeather, setCurrentWeather] = useState<'sunny' | 'rainy' | 'cloudy'>('sunny');
  const [liveTemp, setLiveTemp] = useState<number | null>(null);

  // Fetch real-time weather in Yellapur (Karnataka, India)
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=14.9643&longitude=74.7121&current=weather_code,temperature_2m'
        );
        if (!res.ok) return;
        const data = await res.json();
        const code = data?.current?.weather_code;
        const temp = data?.current?.temperature_2m;

        if (typeof code === 'number') {
          let mapped: 'sunny' | 'rainy' | 'cloudy' = 'sunny';
          if (code === 0 || code === 1) {
            mapped = 'sunny';
          } else if ([2, 3, 45, 48].includes(code)) {
            mapped = 'cloudy';
          } else if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) {
            mapped = 'rainy';
          } else {
            mapped = 'cloudy';
          }
          setCurrentWeather(mapped);
        }
        if (typeof temp === 'number') {
          setLiveTemp(Math.round(temp));
        }
      } catch (err) {
        console.error('Error fetching live weather in Yellapur:', err);
      }
    };

    fetchWeather();
    
    // Auto refresh weather every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const heroTranslateY = useTransform(scrollY, [0, 300], [0, 80]);

  // Rotating Search Placeholders
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % ROTATING_SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Hero section slider
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroSlide((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Filter items based on query
  const filteredProducts = MENU_ITEMS.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Curated premium favorites: exactly 3 veg at the starting, then exactly 3 non-veg
  const favVegIds = ['br-4', 'br-7', 'rn-3'];
  const favNonVegIds = ['br-5-full', 'st-1', 'st-3'];

  let favVeg = favVegIds.map(id => MENU_ITEMS.find(item => item.id === id)).filter(Boolean) as any[];
  if (favVeg.length < 3) {
    const existingIds = new Set(favVeg.map(i => i.id));
    favVeg = [...favVeg, ...MENU_ITEMS.filter(item => item.isVeg && !existingIds.has(item.id))].slice(0, 3);
  }

  let favNonVeg = favNonVegIds.map(id => MENU_ITEMS.find(item => item.id === id)).filter(Boolean) as any[];
  if (favNonVeg.length < 3) {
    const existingIds = new Set(favNonVeg.map(i => i.id));
    favNonVeg = [...favNonVeg, ...MENU_ITEMS.filter(item => !item.isVeg && !existingIds.has(item.id))].slice(0, 3);
  }

  const favouriteItems = [...favVeg, ...favNonVeg];

  const bestSalesItems = MENU_ITEMS.filter(item => 
    item.name.toLowerCase().includes('biryani') || 
    item.name.toLowerCase().includes('kadai') || 
    item.name.toLowerCase().includes('paneer') || 
    item.name.toLowerCase().includes('shawarma') || 
    item.name.toLowerCase().includes('kabab') ||
    item.name.toLowerCase().includes('noodle')
  ).slice(0, 8);

  const handledAddWithToast = (product: any) => {
    addItem(product);
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



  return (
    <div className="relative min-h-screen bg-matte-black text-text-main font-sans pb-32" ref={containerRef}>
      <Header />

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

      {searchQuery ? (
        // Search Results Screen
        <div className="px-4 py-6 space-y-6">
          <h2 className="text-xl font-bold uppercase tracking-tight text-white/60">Search Results</h2>
          <div className="grid grid-cols-2 gap-3.5">
            {filteredProducts.map((product) => {
              const inCart = cartItems.find(i => i.id === product.id);
              return (
                <div key={product.id} className="bg-[#0B0E14] border border-white/5 rounded-[20px] p-2.5 flex flex-col relative shadow-[0_8px_30px_rgba(0,0,0,0.5)] group transition-all hover:scale-[1.01]">
                  <div className="relative aspect-[16/10] rounded-[16px] overflow-hidden mb-2 bg-black/5 shrink-0">
                    <img src={product.image} className="w-full h-full object-cover" alt="" />
                    <button 
                      onClick={() => handledAddWithToast(product)}
                      className="absolute bottom-1 right-1 bg-[#4CD964] hover:bg-[#3AC152] text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1 text-left">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${product.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-wider">Serves 1</span>
                  </div>
                  <h4 className="text-[12px] font-black text-white truncate mb-0.5">{product.name}</h4>
                  <p className="text-[12px] font-black text-white mt-auto">₹{product.price}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Main Home Content
        <>
          {/* HERO THEME SECTION SLIDER WITH PARALLAX & ANIMATED LEAVES */}
          <motion.div 
            style={{ y: heroTranslateY }}
            className="px-4 py-4 relative z-0"
          >
            <div className={`h-[260px] rounded-[24px] border border-[#4CD964]/10 shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden relative p-6 flex flex-col justify-between transition-all duration-700 ${
              currentWeather === 'sunny' 
                ? 'bg-gradient-to-br from-[#12281A] via-[#0B140E] to-[#050505]' 
                : currentWeather === 'rainy'
                  ? 'bg-gradient-to-br from-[#0D1821] via-[#080E14] to-[#050505]'
                  : 'bg-gradient-to-br from-[#1B2430] via-[#0F141C] to-[#050505]'
            }`}>
              
              {/* Floating Leaves */}
              <motion.div 
                animate={{ y: [0, -10, 0], rotate: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-8 right-[40%] text-emerald-500/10 pointer-events-none text-xl font-bold"
              >
                🍃
              </motion.div>
              <motion.div 
                animate={{ y: [0, 15, 0], rotate: [0, -15, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute bottom-8 left-1/3 text-emerald-500/10 pointer-events-none text-2xl font-bold"
              >
                🍃
              </motion.div>

              {/* Dynamic Weather System Overlay */}
              {currentWeather === 'rainy' && (
                <>
                  {/* Rain cloud visual in top-right */}
                  <motion.div 
                    animate={{ y: [0, -4, 0], scale: [1, 1.05, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute top-6 right-8 text-4xl pointer-events-none select-none z-[15] opacity-50 filter drop-shadow-[0_0_12px_rgba(76,217,100,0.4)]"
                  >
                    🌧️
                  </motion.div>
                  {/* Full-card falling rain curtain (placed at z-20 to fall in front of content) */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px] z-[20]">
                    {/* Dark storm backdrop */}
                    <div className="absolute inset-0 bg-[#0B141D]/45 backdrop-blur-[0.5px]" />
                    {/* Rain drops */}
                    {[...Array(25)].map((_, i) => {
                      const left = `${(i * 4) + Math.random() * 2}%`;
                      const delay = Math.random() * 2;
                      const duration = 0.5 + Math.random() * 0.3;
                      return (
                        <motion.div
                          key={i}
                          initial={{ y: -55, opacity: 0 }}
                          animate={{ y: 300, opacity: [0, 0.8, 0.8, 0] }}
                          transition={{
                            duration: duration,
                            repeat: Infinity,
                            delay: delay,
                            ease: "linear"
                          }}
                          style={{
                            position: 'absolute',
                            left: left,
                            top: 0,
                            width: '1px',
                            height: '25px',
                            background: 'linear-gradient(to bottom, rgba(255,255,255,0.0), rgba(76,217,100,0.6))'
                          }}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {currentWeather === 'sunny' && (
                <>
                  {/* Spinning glowing sun visual in top-right */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    className="absolute top-4 right-8 w-16 h-16 pointer-events-none select-none z-[15] flex items-center justify-center"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#FFD166] shadow-[0_0_20px_#FFD166,0_0_35px_#FF9F1C] relative flex items-center justify-center">
                      {/* Sun rays */}
                      {[...Array(8)].map((_, idx) => (
                        <div 
                          key={idx}
                          className="absolute w-1 h-10 bg-gradient-to-t from-[#FFD166] to-[#FF9F1C] rounded-full opacity-60"
                          style={{ transform: `rotate(${idx * 45}deg)` }}
                        />
                      ))}
                    </div>
                  </motion.div>
                  {/* Warm solar environment */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px] z-0">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,209,102,0.15)_0%,transparent_60%)]" />
                    {/* Solar ray beams */}
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      className="absolute top-[-10px] right-[-10px] w-48 h-48 bg-[conic-gradient(from_0deg,transparent_0deg,rgba(255,209,102,0.05)_30deg,transparent_60deg)] rounded-full origin-center"
                    />
                    {/* Floating heat sparkles */}
                    {[...Array(8)].map((_, i) => {
                      const left = `${20 + Math.random() * 60}%`;
                      const top = `${20 + Math.random() * 60}%`;
                      const delay = Math.random() * 3;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: [0, 0.4, 0], scale: [0.5, 1.2, 0.5] }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: delay,
                            ease: "easeInOut"
                          }}
                          className="absolute w-2 h-2 rounded-full bg-[#FFD166]/20 blur-[1px]"
                          style={{ left: left, top: top }}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {currentWeather === 'cloudy' && (
                <>
                  {/* Volumetric cloud system layered inside the card */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[24px] z-[20]">
                    {/* Misty grey-blue glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
                    
                    {/* Drifting Clouds */}
                    <motion.div 
                      animate={{ x: [-80, 280], y: [10, 15, 10] }}
                      transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                      className="absolute text-5xl opacity-35 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]"
                      style={{ top: '10%' }}
                    >
                      ☁️
                    </motion.div>
                    <motion.div 
                      animate={{ x: [280, -80], y: [75, 70, 75] }}
                      transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                      className="absolute text-6xl opacity-25 filter drop-shadow-[0_0_12px_rgba(255,255,255,0.2)]"
                      style={{ top: '30%' }}
                    >
                      ☁️
                    </motion.div>
                    <motion.div 
                      animate={{ x: [-50, 250], y: [130, 135, 130] }}
                      transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                      className="absolute text-4xl opacity-30 filter blur-[0.5px]"
                      style={{ top: '50%' }}
                    >
                      ☁️
                    </motion.div>
                  </div>
                </>
              )}

              <div className="max-w-[66%] space-y-2.5 relative z-10 text-left">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[9px] font-extrabold bg-[#4CD964]/10 text-[#4CD964] px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#4CD964]/20 shrink-0">
                    Feast Mode ⚡
                  </span>
                  <span className="text-[9px] font-extrabold bg-amber-500/10 text-[#FFD166] px-2 py-0.5 rounded-md uppercase tracking-wider border border-amber-500/20 animate-pulse shrink-0">
                    Moms Magic 2.0
                  </span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentWeather(prev => prev === 'sunny' ? 'rainy' : prev === 'rainy' ? 'cloudy' : 'sunny');
                    }}
                    className="text-[9px] font-extrabold bg-blue-500/10 text-blue-400 px-2.5 py-0.5 rounded-md uppercase tracking-wider border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1.5 active:scale-95 shrink-0"
                  >
                    {currentWeather === 'sunny' && '☀️ Yellapur: Sunny'}
                    {currentWeather === 'rainy' && '🌧️ Yellapur: Rainy'}
                    {currentWeather === 'cloudy' && '☁️ Yellapur: Cloudy'}
                    {liveTemp !== null && ` (${liveTemp}°C)`}
                  </button>
                </div>
                <h1 className="text-4xl font-extrabold italic uppercase tracking-tighter text-white leading-none drop-shadow-sm">
                  Delicious <br/> <span className="text-[#4CD964]">Lunch & Dinner</span>
                </h1>
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed">
                  Fresh and sizzling hot • delivered in 10 mins
                </p>
              </div>


            </div>
          </motion.div>

          {/* Special Combo Offers (At the starting) */}
          <ComboOffersSection />

          {/* CATEGORY SECTION (CIRCULAR PHOTOGRAPHY LIST) */}
          <section className="py-6 space-y-4">
            <div className="px-4 text-left">
              <h2 className="text-lg font-black uppercase tracking-tight italic text-white">Browse <span className="text-[#4CD964]">Categories</span></h2>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Realistic visual culinary strips</p>
            </div>

            <div className="flex gap-5 overflow-x-auto no-scrollbar px-4 py-3">
              {CATEGORIES_DATA.map((cat) => (
                <div 
                  key={cat.id} 
                  onClick={() => navigate('/food', { state: { category: cat.id } })}
                  className="flex flex-col items-center gap-3 cursor-pointer shrink-0"
                >
                  <div className="relative group/cat shrink-0">
                    {/* Glowing outer aura that rotates and cycles colors */}
                    <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-[#4CD964] via-[#FFD166] via-[#FF4D00] via-[#FF007F] to-[#00F0FF] opacity-75 blur-[3px] group-hover/cat:opacity-100 group-hover/cat:blur-[5px] transition-all duration-500 animate-spin-slow" />
                    
                    {/* Main circular frame */}
                    <div className="w-[74px] h-[74px] rounded-full bg-[#050505] p-[3px] relative z-10 flex items-center justify-center overflow-hidden border border-white/10 transition-transform active:scale-95 group-hover/cat:scale-105 duration-300">
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
                  <span className="text-[10px] font-extrabold uppercase text-white/80 tracking-wider group-hover/cat:text-[#4CD964] transition-colors">
                    {cat.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* YOUR FAVOURITES SECTION */}
          <section className="py-6 space-y-4">
            <div className="px-4 text-left">
              <h2 className="text-lg font-black uppercase tracking-tight italic text-white">⭐ Your <span className="text-[#4CD964]">Favourites</span></h2>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Curated specifically by you</p>
            </div>

            <div className="flex gap-4 overflow-x-auto no-scrollbar px-4 py-2">
              {favouriteItems.map((product) => {
                return (
                  <div key={product.id} className="w-[160px] h-[230px] shrink-0 bg-[#0B0E14] border border-white/5 rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col p-2.5 relative snap-start">
                    
                    {/* Bestseller Badge */}
                    <div className="absolute top-4 left-4 bg-[#FF7A00] text-white text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md shadow-sm z-10 flex items-center gap-0.5">
                      ★ Bestseller
                    </div>

                    <div className="relative aspect-[16/10] rounded-[16px] overflow-hidden mb-2 bg-black/5 shrink-0">
                      <img src={product.image} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={() => handledAddWithToast(product)}
                        className="absolute bottom-[-8px] right-2 bg-[#4CD964] hover:bg-[#3AC152] text-white w-6.5 h-6.5 rounded-full flex items-center justify-center shadow-md border-2 border-white transition-transform active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 mb-1 mt-1 text-left">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${product.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-wider">Serves 1</span>
                    </div>

                    <div className="text-left flex-1 flex flex-col justify-between">
                      <h4 className="text-[12px] font-extrabold text-white truncate tracking-tight">{product.name}</h4>
                      <p className="text-[12px] font-black text-white mt-auto">₹{product.price}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* BEST SALES SECTION (SWISH-THEMED GREEN CONTAINER) */}
          <section className="px-4 py-4">
            <div className="bg-gradient-to-br from-[#0B0E14] via-[#10141D] to-[#050505] rounded-[28px] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] space-y-4 overflow-hidden relative border border-[#4CD964]/10">
              
              {/* Subtle visual glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(76,217,100,0.02)_0%,transparent_50%)] pointer-events-none" />

              <div className="flex items-center justify-between relative z-10">
                <div className="text-left">
                  <span className="text-[8px] font-black bg-[#4CD964]/10 text-[#4CD964] px-2 py-0.5 rounded-md uppercase tracking-wider border border-[#4CD964]/20">
                    Hot Sellers 🔥
                  </span>
                  <h2 className="text-lg font-black uppercase tracking-tight italic text-white mt-1">⚡ Best <span className="text-[#4CD964]">Sales</span></h2>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Top rated favorite plates</p>
                </div>
                <button onClick={() => navigate('/food')} className="text-[9px] font-black bg-[#4CD964] text-[#050505] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm hover:bg-[#3AC152]">
                  View All
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 relative z-10">
                {bestSalesItems.map((product) => {
                  return (
                    <div key={product.id} className="w-[150px] shrink-0 bg-white/5 backdrop-blur rounded-[20px] p-2.5 relative border border-white/10 shadow-sm flex flex-col">
                      <div className="relative aspect-[16/10] rounded-[14px] overflow-hidden mb-2 bg-black/5 shrink-0">
                        <img src={product.image} className="w-full h-full object-cover" alt="" />
                        <button 
                          onClick={() => handledAddWithToast(product)}
                          className="absolute bottom-[-8px] right-2 bg-[#4CD964] hover:bg-[#3AC152] text-[#050505] w-6 h-6 rounded-full flex items-center justify-center shadow-md border-2 border-[#0B0E14] transition-transform active:scale-95"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1 mt-1 text-left">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4CD964] shrink-0 animate-pulse" />
                        <span className="text-[8px] font-bold text-[#4CD964]/80 uppercase tracking-wider">Popular</span>
                      </div>
                      <div className="text-left flex-1 flex flex-col justify-between">
                        <h4 className="text-[11px] font-extrabold text-white truncate tracking-tight">{product.name}</h4>
                        <p className="text-[11px] font-black text-white mt-auto">₹{product.price}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* DENSE 2-COLUMN GRID SECTION WITH SCARCITY TRIGGERS */}
          <section className="py-6 space-y-4 px-4">
            <div className="text-left">
              <h2 className="text-lg font-black uppercase tracking-tight italic text-white">🔥 Highly <span className="text-[#4CD964]">Recommended</span></h2>
              <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Impulse favorites based on Zepto trends</p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
              {MENU_ITEMS.slice(10, 16).map((product) => {
                const badges = ["Trending", "Bestseller", "Hot Deal", "Limited Offer", "Most Loved", "Recently Ordered"];
                const badge = badges[product.name.length % badges.length];

                return (
                  <div key={product.id} className="bg-[#0B0E14] border border-white/5 rounded-[16px] p-2 flex flex-col relative shadow-[0_8px_25px_rgba(0,0,0,0.5)] group transition-all hover:scale-[1.01]">
                    
                    {/* Scarcity / Triggers Badge */}
                    <div className="absolute top-3.5 left-3.5 bg-emerald-500 text-white text-[6px] sm:text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm z-10 flex items-center gap-0.5 animate-pulse">
                      🔥 {badge}
                    </div>

                    <div className="relative aspect-[16/10] rounded-[12px] overflow-hidden mb-1.5 bg-black/5 shrink-0">
                      <img src={product.image} className="w-full h-full object-cover" alt="" />
                      <button 
                        onClick={() => handledAddWithToast(product)}
                        className="absolute bottom-[-6px] right-1.5 bg-[#4CD964] hover:bg-[#3AC152] text-white w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-md border border-white transition-transform active:scale-95"
                      >
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 mb-1 text-left">
                      <span className={`w-1 h-1 rounded-full shrink-0 ${product.isVeg ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-[7px] sm:text-[8px] font-black text-white/40 uppercase tracking-wider">Serves 1</span>
                    </div>

                    <div className="text-left flex-1 flex flex-col justify-between">
                      <h4 className="text-[10px] sm:text-[12px] font-extrabold text-white truncate tracking-tight">{product.name}</h4>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-[10px] sm:text-[12px] font-black text-white">₹{product.price}</p>
                        <div className="flex items-center gap-0.5 text-[#FF7A00]">
                          <Star className="w-2 h-2 fill-current" />
                          <span className="text-[7px] sm:text-[8px] font-black">4.8</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* FLOATING CENTER MENU BUTTON */}
      <div className="fixed bottom-20 left-0 right-0 flex justify-center z-[90] pointer-events-none md:hidden">
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMenuOpen(true)}
          className="bg-[#4CD964] text-white rounded-full px-6 py-3.5 shadow-[0_8px_30px_rgba(76,217,100,0.35)] flex items-center gap-2 pointer-events-auto hover:scale-105 active:scale-95 transition-all text-xs font-black uppercase tracking-widest border border-white/10"
        >
          <UtensilsCrossed className="w-4 h-4 text-white" />
          <span>Menu</span>
        </motion.button>
      </div>



      {/* CATEGORY BOTTOM SHEET MODAL (Inspired by Screenshot 1) */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/75 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}>
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-[#0B0E14] border-t border-[#4CD964]/20 rounded-t-[32px] p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-[0_-15px_40px_rgba(0,0,0,0.5)] flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Bottom Sheet Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4">
                <div className="text-left">
                  <h3 className="text-lg font-black uppercase italic tracking-tight leading-none text-white">⚡ Select Category</h3>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Jump to your favorite meals instantly</p>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-[#4CD964]/10 text-[#4CD964] flex items-center justify-center hover:bg-[#4CD964]/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Categories list */}
              <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar pr-1 max-h-[50vh]">
                <div 
                  onClick={() => { setIsMenuOpen(false); navigate('/food', { state: { category: 'Top Picks' } }); }}
                  className="flex items-center justify-between py-3.5 px-4 rounded-2xl bg-[#4CD964]/10 border border-[#4CD964]/20 text-[#4CD964] cursor-pointer"
                >
                  <span className="font-extrabold text-sm tracking-tight">Curated Combos 🍲</span>
                  <span className="text-[10px] font-black bg-[#4CD964] text-white px-2 py-0.5 rounded-full">NEW</span>
                </div>
                
                {CATEGORIES_DATA.map((cat) => (
                  <div 
                    key={cat.id} 
                    onClick={() => { setIsMenuOpen(false); navigate('/food', { state: { category: cat.id } }); }}
                    className="flex items-center justify-between py-3.5 px-4 rounded-2xl bg-white/5 border border-white/5 hover:border-[#4CD964]/20 transition-colors cursor-pointer text-left group"
                  >
                    <span className="font-bold text-sm text-white group-hover:text-[#4CD964] transition-colors">{cat.name}</span>
                    <span className="text-xs font-bold text-white/40">{cat.count} Items</span>
                  </div>
                ))}
              </div>

              {/* Sheet Floating close button */}
              <div className="pt-6 flex justify-center">
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="bg-[#4CD964] text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
