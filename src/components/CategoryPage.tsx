import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Plus, Minus, ShoppingBag } from 'lucide-react';
import { MENU_ITEMS } from '../data/menuItems';
import { useCartStore } from '../store/cartStore';
import { useSystemStore } from '../store/systemStore';
import toast from 'react-hot-toast';
import Header from './Header';
import { playSound, SOUNDS } from '../utils/audio';
import { useSEO } from '../utils/seo';

const getStableRating = (id: string | number) => {
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const rating = 4.5 + (Math.abs(hash) % 6) * 0.1;
  return rating.toFixed(1);
};

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

export default function CategoryPage({ type }: { type: 'food' | 'grocery' }) {
  useSEO(
    type === 'food' ? 'Food Menu' : 'Grocery Menu',
    type === 'food'
      ? 'Browse our complete hot food menu including biryanis, gravies, fast food and delicious combo offers at Moms Magic Yellapur and Dandeli.'
      : 'Order fresh grocery essentials and dairy items online with fast home delivery from Moms Magic.'
  );
  const navigate = useNavigate();
  const { addItem, items: cartItems, updateQuantity } = useCartStore();
  const settings = useSystemStore(state => state.settings);
  
  // States
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchIndex, setSearchIndex] = useState(0);
  const [activeDietTab, setActiveDietTab] = useState<'all' | 'veg' | 'nonveg'>('all');

  // Rotating Search Placeholders
  useEffect(() => {
    const timer = setInterval(() => {
      setSearchIndex((prev) => (prev + 1) % ROTATING_SEARCH_PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  if (type === 'grocery') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 text-center p-6 bg-matte-black text-white">
        <div className="w-40 h-40 bg-gold/5 rounded-[50px] flex items-center justify-center border border-gold/10 relative">
          <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full" />
          <ShoppingBag className="w-20 h-20 text-gold animate-pulse" />
        </div>
        <div className="space-y-4">
          <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter uppercase text-white">PREMIUM <span className="text-luxury-gold">MARKET</span></h2>
          <p className="text-text-muted font-bold uppercase tracking-[4px] text-[10px]">Curating the finest essentials for you</p>
        </div>
        <button onClick={() => navigate('/')} className="btn-luxury-red px-14">BACK TO SELECTION</button>
      </div>
    );
  }

  const handledAddWithToast = (product: any) => {
    playSound(SOUNDS.ADD_TO_CART);
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

  // Split into Veg and Non-Veg columns so all products are organized cleanly
  const vegProducts = displayedProducts.filter(product => product.isVeg);
  const nonVegProducts = displayedProducts.filter(product => !product.isVeg);

  const categoriesWithAll = [
    { id: 'All', name: 'All Dishes', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80' },
    ...CATEGORIES_DATA
  ];

  const renderProductCard = (product: any) => {
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
              <span className="text-[9px] sm:text-[10px] font-extrabold">{getStableRating(product.id)}</span>
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
  };

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white font-sans pb-32">
      {/* Header & Search */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a] px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="bg-[#1a1a1a] p-3 rounded-xl border border-[#262626] hover:bg-zinc-800 transition-colors">
            <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
            </svg>
          </button>
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-4 flex items-center">
              <svg className="h-5 w-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#262626] rounded-xl py-3 pl-12 pr-4 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#facc15] transition-colors text-sm" 
              placeholder={ROTATING_SEARCH_PLACEHOLDERS[searchIndex]} 
              type="text"
            />
          </div>
        </div>
        <div className="mt-8 text-center">
          <h1 className="italic font-[900] tracking-[-0.02em] text-4xl uppercase">
            <span className="text-white">Order</span> <span className="text-[#facc15]">Food</span>
          </h1>
        </div>
      </header>

      <main className="pb-32">
        {/* Primary Categories */}
        <section className="mt-6">
          <div className="flex overflow-x-auto no-scrollbar gap-3 px-4">
            {categoriesWithAll.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 font-bold px-8 py-4 rounded-2xl uppercase text-xs tracking-widest transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#facc15] text-black shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                    : 'bg-[#1a1a1a] text-zinc-400 border border-[#262626]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* Diet Filters */}
        <section className="mt-8 px-4">
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-3xl p-2 flex items-center justify-between">
            <button 
              onClick={() => setActiveDietTab('all')}
              className={`rounded-2xl px-4 py-3 flex items-center gap-2 flex-1 justify-center transition-all ${
                activeDietTab === 'all' ? 'bg-white text-black shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="font-extrabold text-[10px] leading-tight uppercase text-center">All<br/>Selection</span>
            </button>
            <button 
              onClick={() => setActiveDietTab('veg')}
              className={`rounded-2xl px-4 py-3 flex items-center gap-2 flex-1 justify-center transition-all ${
                activeDietTab === 'veg' ? 'bg-emerald-400 text-black shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="font-bold text-[10px] uppercase">Pure Veg</span>
            </button>
            <button 
              onClick={() => setActiveDietTab('nonveg')}
              className={`rounded-2xl px-4 py-3 flex items-center gap-2 flex-1 justify-center transition-all ${
                activeDietTab === 'nonveg' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="font-bold text-[10px] uppercase text-center">Classic Non-Veg</span>
            </button>
          </div>
        </section>

        {/* Food Grid */}
        <section className="mt-8 px-4 grid grid-cols-2 gap-4">
          {(activeDietTab === 'all' ? displayedProducts : activeDietTab === 'veg' ? vegProducts : nonVegProducts).map((product: any) => {
            const inCart = cartItems.find(i => i.id === product.id);
            const isCombo = product.isCombo;
            return (
              <article key={product.id} className="bg-[#1a1a1a] rounded-[2.5rem] p-3 border border-[#262626] shadow-[0_4px_20px_rgba(250,204,21,0.05)] relative overflow-hidden flex flex-col justify-between">
                {isCombo && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-[#facc15] opacity-50"></div>
                )}
                <div>
                  <div className="relative rounded-3xl overflow-hidden aspect-square">
                    <img alt={product.name} className="w-full h-full object-cover" src={product.image} />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isVeg && (
                        <span className="bg-emerald-400/20 text-emerald-400 text-[8px] font-bold px-2 py-0.5 rounded-full border border-emerald-400/30 backdrop-blur-md uppercase">Pure Veg</span>
                      )}
                      {isCombo && (
                        <span className="bg-[#facc15] text-black text-[8px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 uppercase">
                          Royal Choice <span>✦</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 px-1">
                    <h3 className="font-black text-xs uppercase tracking-tight truncate text-white">{product.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[#facc15] text-[10px]">★ {getStableRating(product.id)}</span>
                      <span className="text-zinc-500 text-[10px]">(₹{product.price})</span>
                    </div>
                  </div>
                </div>
                {inCart ? (
                  <div className="w-full mt-4 bg-[#facc15] text-black rounded-2xl flex items-center justify-between px-3 py-2 shadow-lg shadow-[#facc15]/20">
                    <button onClick={() => { playSound(SOUNDS.QUANTITY_TICK); updateQuantity(product.id, inCart.quantity - 1); }} className="font-black text-xs px-2 py-1"><Minus className="w-4 h-4"/></button>
                    <span className="text-[10px] font-black uppercase tracking-widest">{inCart.quantity} Added</span>
                    <button onClick={() => { playSound(SOUNDS.QUANTITY_TICK); updateQuantity(product.id, inCart.quantity + 1); }} className="font-black text-xs px-2 py-1"><Plus className="w-4 h-4"/></button>
                  </div>
                ) : (
                  <button onClick={() => handledAddWithToast(product)} className="w-full mt-4 bg-[#facc15] hover:bg-yellow-500 text-black font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-[#facc15]/20 active:scale-95 transition-transform">
                    Add +
                  </button>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
}
