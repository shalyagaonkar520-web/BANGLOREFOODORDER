import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useMenuStore } from '../store/menuStore';
import { useCartStore } from '../store/cartStore';
import { useSystemStore } from '../store/systemStore';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { playSound, SOUNDS } from '../utils/audio';
import { useSEO } from '../utils/seo';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';

const CATEGORIES_DATA = [
  { id: 'Fast Food',      name: 'Fast Food',       emoji: '🍔' },
  { id: 'Rice & Noodles', name: 'Rice & Noodles',  emoji: '🍜' },
  { id: 'Biryani',        name: 'Biryani',          emoji: '🍛' },
  { id: 'Starters',       name: 'Starters',         emoji: '🍗' },
  { id: 'Veg/Gravy',      name: 'Veg / Gravy',      emoji: '🥗' },
  { id: 'Roti',           name: 'Roti & Breads',    emoji: '🫓' },
  { id: 'Burgers & Rolls',name: 'Burgers & Rolls',  emoji: '🌯' },
  { id: 'Pizzas & Momos', name: 'Pizzas & Momos',   emoji: '🍕' },
  { id: 'Drinks',         name: 'Drinks',            emoji: '🥤' },
];

const DIET_TABS = [
  { id: 'all',    label: 'All',     color: 'bg-primary text-white border-primary'       },
  { id: 'veg',    label: '🌿 Veg', color: 'bg-tertiary-container text-white border-tertiary-container'        },
  { id: 'nonveg', label: '🍗 Non-Veg', color: 'bg-error text-white border-error'        },
];

function getStableRating(id: string | number) {
  const str = String(id);
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return (4.3 + (Math.abs(hash) % 7) * 0.1).toFixed(1);
}

export default function CategoryPage({ type }: { type: 'food' | 'grocery' }) {
  useSEO(
    type === 'food' ? 'Order Food – Moms Magic' : 'Grocery – Moms Magic',
    type === 'food'
      ? 'Browse our full food menu – biryanis, fast food, gravies, rolls and more at Moms Magic.'
      : 'Order fresh grocery essentials from Moms Magic with fast home delivery.'
  );

  const navigate = useNavigate();
  const { addItem, items: cartItems, updateQuantity } = useCartStore();
  const settings = useSystemStore(state => state.settings);
  const { menuItems } = useMenuStore();

  const queryParams = new URLSearchParams(window.location.search);
  const restaurantId = queryParams.get('restaurantId') || localStorage.getItem('selected_restaurant_id') || 'res_1';
  
  const [restaurant, setRestaurant] = useState<any>(null);

  useEffect(() => {
    if (restaurantId) {
      localStorage.setItem('selected_restaurant_id', restaurantId);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const unsub = onSnapshot(doc(db, 'restaurants', restaurantId), (docSnap) => {
      if (docSnap.exists()) {
        setRestaurant({ id: docSnap.id, ...docSnap.data() });
      }
    }, (err) => console.error("Error loading restaurant doc:", err));
    return () => unsub();
  }, [restaurantId]);

  const adminToken = localStorage.getItem('moms_magic_admin_token');
  const userPhone  = localStorage.getItem('moms_magic_user_phone');
  const isAdmin =
    adminToken === 'mock-jwt-admin-token-123456' ||
    ['+917483187572', '+919606001790', '7483187572', '9606001790'].includes(userPhone || '');

  const isStoreOpen = () => {
    if (settings.websiteStatus === 'OFF' || settings.emergencyStop) return false;
    const now = new Date();
    const t = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
    if (settings.openTime <= settings.closeTime) return t >= settings.openTime && t <= settings.closeTime;
    return t >= settings.openTime || t <= settings.closeTime;
  };
  const isClosed = !isStoreOpen() && !isAdmin;

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [dietTab, setDietTab]                   = useState<'all'|'veg'|'nonveg'>('all');
  const [searchQuery, setSearchQuery]           = useState('');
  const [showOfferBanner, setShowOfferBanner]   = useState(true);

  // Pre-select category from landing page click
  useEffect(() => {
    const cat = localStorage.getItem('qb_selected_category');
    const q   = localStorage.getItem('qb_search_query');
    if (cat) { setSelectedCategory(cat); localStorage.removeItem('qb_selected_category'); }
    if (q)   { setSearchQuery(q);        localStorage.removeItem('qb_search_query'); }
  }, []);

  if (type === 'grocery') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 p-6 text-center">
        <span className="text-6xl">🛒</span>
        <h2 className="font-headline-md text-2xl text-on-surface">Grocery <span className="text-primary">Coming Soon</span></h2>
        <p className="text-body-sm text-secondary">We're curating the finest grocery essentials for you.</p>
        <button onClick={() => navigate('/')} className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold hover:bg-surface-tint active:scale-95 transition-all">Back to Home</button>
      </div>
    );
  }

  const handleAdd = (product: any) => {
    playSound(SOUNDS.ADD_TO_CART);
    addItem(product);
    toast.success(`${product.name} added! 🎉`, {
      style: { background: 'var(--color-surface-container-lowest)', color: 'var(--color-on-surface)', border: '1px solid var(--color-outline-variant)', borderRadius: '16px', fontFamily: 'var(--font-body-md)' }
    });
  };

  // Filter — also show items with no restaurantId (static/fallback menu)
  let products = [...menuItems]
    .filter(p => !p.restaurantId || p.restaurantId === restaurantId)
    .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(p => dietTab === 'all' ? true : dietTab === 'veg' ? p.isVeg : !p.isVeg)
    .sort((a, b) => (b.royalHighlight ? 1 : 0) - (a.royalHighlight ? 1 : 0) || a.price - b.price);

  // Group by category for "All" view
  const grouped: Record<string, typeof products> = {};
  if (selectedCategory === 'All' && !searchQuery) {
    products.forEach(p => {
      const cat = p.category || 'Other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    });
  }
  const showGrouped = selectedCategory === 'All' && !searchQuery && Object.keys(grouped).length > 0;

  const ProductRow = ({ product }: { product: any }) => {
    const inCart = cartItems.find(i => i.id === product.id);
    return (
      <motion.div
        layout
        key={product.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4 py-5 border-b border-outline-variant/30 last:border-b-0"
      >
        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${product.isVeg ? 'border-tertiary' : 'border-error'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${product.isVeg ? 'bg-tertiary' : 'bg-error'}`} />
          </div>
          {product.royalHighlight && (
            <span className="text-label-sm uppercase tracking-widest text-primary bg-primary-fixed px-2 py-0.5 rounded-xl flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> BESTSELLER
            </span>
            )}
          </div>
          <h3 className="font-headline-md text-body-lg text-on-surface line-clamp-2 leading-tight">
          {product.name}
        </h3>
        
        <div className="mt-2 flex items-center gap-3">
          <span className="font-bold text-lg">₹{product.price}</span>
          {product.originalPrice && (
            <span className="text-body-sm text-secondary line-through">₹{product.originalPrice}</span>
          )}
        </div>
        
        <p className="mt-2 text-body-sm text-secondary line-clamp-2 leading-relaxed">{product.description}</p>
        </div>

        {/* Image + button */}
        <div className="shrink-0 flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border border-outline-variant/30 bg-surface">
            {product.image
              ? <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
              : <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
            }
          </div>
          <AnimatePresence mode="wait">
            {inCart ? (
              <motion.div key="stepper" initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
                className="flex items-center bg-primary rounded-xl shadow-sm">
                <button onClick={() => { playSound(SOUNDS.QUANTITY_TICK); updateQuantity(product.id, inCart.quantity - 1); }}
                  className="w-8 h-8 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[14px] font-bold">remove</span>
                </button>
                <span className="w-7 text-center text-sm font-bold text-white">{inCart.quantity}</span>
                <button onClick={() => { playSound(SOUNDS.QUANTITY_TICK); updateQuantity(product.id, inCart.quantity + 1); }}
                  className="w-8 h-8 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[14px] font-bold">add</span>
                </button>
              </motion.div>
            ) : (
              <motion.button key="add" initial={{ scale: 0.85 }} animate={{ scale: 1 }} exit={{ scale: 0.85 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAdd(product)}
                disabled={isClosed}
                className={`w-24 h-8 border-2 text-label-md rounded-xl flex items-center justify-center gap-1 transition-colors
                  ${isClosed ? 'border-outline-variant text-secondary cursor-not-allowed' : 'border-primary text-primary bg-surface hover:bg-primary-fixed'}`}>
                <span className="material-symbols-outlined text-[14px] font-bold">add</span>
                {isClosed ? 'Closed' : 'Add'}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-32">

      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')}
              className="w-10 h-10 rounded-2xl border border-outline-variant bg-surface flex items-center justify-center hover:border-primary transition-colors shrink-0">
              <span className="material-symbols-outlined text-on-surface">chevron_left</span>
            </button>
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-secondary">search</span>
              <input
                id="food-search"
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search dishes…"
                className="w-full bg-surface border border-outline-variant rounded-2xl pl-10 pr-4 py-3 text-body-sm text-on-surface placeholder:text-secondary outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto flex items-start">
        {/* ── Left Sidebar Categories ── */}
        <div className="w-[85px] md:w-[120px] shrink-0 bg-surface border-r border-outline-variant/30 h-[calc(100vh-65px)] sticky top-[65px] overflow-y-auto no-scrollbar flex flex-col items-center py-4">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`w-full flex flex-col items-center justify-center py-4 gap-2 transition-all border-r-4 ${
              selectedCategory === 'All' ? 'border-primary bg-primary-fixed' : 'border-transparent text-secondary hover:bg-surface-container-low'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all ${
              selectedCategory === 'All' ? 'bg-surface border-2 border-primary' : 'bg-background border border-outline-variant'
            }`}>
              🍽️
            </div>
            <span className={`text-[10px] font-bold text-center leading-tight ${selectedCategory === 'All' ? 'text-primary' : 'text-secondary'}`}>All</span>
          </button>
          
          {CATEGORIES_DATA.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`w-full flex flex-col items-center justify-center py-4 gap-2 transition-all border-r-4 ${
                selectedCategory === cat.id ? 'border-primary bg-primary-fixed' : 'border-transparent text-secondary hover:bg-surface-container-low'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-all ${
                selectedCategory === cat.id ? 'bg-surface border-2 border-primary' : 'bg-background border border-outline-variant'
              }`}>
                {cat.emoji}
              </div>
              <span className={`text-[10px] font-bold text-center leading-tight px-1 ${selectedCategory === cat.id ? 'text-primary' : 'text-secondary'}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 px-4 md:px-8 py-6 min-w-0">

        {/* ── Store Info Banner ── */}
        <div className="bg-surface rounded-3xl border border-outline-variant/30 p-5 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-headline-md text-on-surface">{restaurant?.name || 'Loading Restaurant...'}</h1>
              <p className="text-body-sm text-secondary mt-0.5">{(restaurant?.cuisineTags || []).join(', ') || 'Indian, Fast Food'}</p>
            </div>
            <span className={`text-label-sm px-3 py-1 rounded-full uppercase tracking-wider ${(!restaurant?.isActive || isClosed) ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>
              {(!restaurant?.isActive || isClosed) ? 'Closed' : 'Open'}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-label-sm bg-primary text-white px-2 py-1 rounded-lg flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> {restaurant?.rating || '4.5'}
            </span>
            <span className="text-body-sm text-secondary flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">schedule</span> {restaurant?.openHours || '09:00-22:00'}</span>
          </div>
        </div>

        {/* ── Offer Strip ── */}
        {showOfferBanner && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-surface rounded-2xl p-4 border border-outline-variant/30 flex items-start gap-4 shadow-sm relative overflow-hidden group mt-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">local_offer</span>
              <span className="text-label-sm text-primary">20% OFF up to ₹100 | <span className="font-black">USE CODE: MAGIC20</span></span>
            </div>
            <button onClick={() => setShowOfferBanner(false)} className="text-outline text-label-md ml-2 hover:text-on-surface">✕</button>
          </motion.div>
        )}

        {/* ── Diet Filter Tabs ── */}
        <div className="mt-4 flex gap-2">
          {DIET_TABS.map(tab => (
            <button key={tab.id} onClick={() => setDietTab(tab.id as any)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${dietTab === tab.id ? tab.color : 'bg-surface text-secondary border-outline-variant/30 hover:bg-surface-container'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Menu Items ── */}
        <div className="mt-4 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
          {showGrouped ? (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 pt-4 pb-2 bg-surface-container-low border-b border-outline-variant/30">
                  <h2 className="font-headline-md text-on-surface">
                    {CATEGORIES_DATA.find(c => c.id === category)?.emoji} {category}
                    <span className="text-body-sm text-secondary ml-2">({items.length} items)</span>
                  </h2>
                </div>
                <div className="px-4">
                  {items.map(product => <ProductRow key={product.id} product={product} />)}
                </div>
              </div>
            ))
          ) : products.length > 0 ? (
            <div className="px-4">
              {products.map(product => <ProductRow key={product.id} product={product} />)}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-5xl">🍽️</span>
              <p className="font-label-md text-secondary">No items found</p>
              <button onClick={() => { setSearchQuery(''); setSelectedCategory('All'); setDietTab('all'); }}
                className="text-label-md text-primary hover:underline">
                Clear filters
              </button>
            </div>
          )}
        </div>

        </div>
      </div>
    </div>
  );
}
