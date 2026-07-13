import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import Header from './Header';
import { useCartStore } from '../store/cartStore';
import { playSound, SOUNDS } from '../utils/audio';
import { useSEO } from '../utils/seo';
import { useSystemStore } from '../store/systemStore';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

import { useMenuStore } from '../store/menuStore';
import { Search, Mic, ChevronRight, Star, Clock, MapPin, Heart } from 'lucide-react';

const CATEGORY_CHIPS = [
  { id: 'Pizzas & Momos',       label: 'Pizza',     image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=150&q=80' },
  { id: 'Burgers & Rolls',      label: 'Burger',    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=150&q=80' },
  { id: 'Biryani',     label: 'Biryani',   image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=150&q=80' },
  { id: 'Starters',     label: 'Chicken',   image: 'https://images.unsplash.com/photo-1569058242253-1df34b06a5fa?w=150&q=80' },
  { id: 'Veg/Gravy',label: 'North Indian', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=150&q=80' },
  { id: 'Rice & Noodles',label: 'Chinese', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=150&q=80' },
  { id: 'Drinks',    label: 'Drinks',  image: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=150&q=80' },
  { id: 'Fast Food',   label: 'Fast Food', image: 'https://images.unsplash.com/photo-1563805042-7684c8e9e1cb?w=150&q=80' },
];

const OFFERS = [
  { id: 1, title: 'Free Delivery', subtitle: 'On your first order', color: 'from-[#FF5A1F] to-[#FF7A45]', img: '🛵' },
  { id: 2, title: 'Flat ₹150 Off', subtitle: 'Above ₹499', color: 'from-[#8B5CF6] to-[#A78BFA]', img: '🎉' },
  { id: 3, title: 'Combo Meals', subtitle: 'Up to 30% Off', color: 'from-[#10B981] to-[#34D399]', img: '🍱' },
  { id: 4, title: 'Protein Meals', subtitle: 'Starting @ ₹199', color: 'from-[#3B82F6] to-[#60A5FA]', img: '🥩' },
];

export default function LandingPage() {
  useSEO(
    "Moms Magic – Premium Food Delivery",
    "Delicious food delivered in minutes. Fresh meals from trusted restaurants around you."
  );

  const navigate = useNavigate();
  const clearCart = useCartStore(state => state.clearCart);
  const addItem = useCartStore(state => state.addItem);
  const settings = useSystemStore(state => state.settings);
  const { menuItems } = useMenuStore();
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryClick = (categoryId: string) => {
    playSound(SOUNDS.ADD_TO_CART);
    clearCart();
    localStorage.setItem('moms_magic_order_type', 'regular');
    localStorage.setItem('qb_selected_category', categoryId);
    navigate('/food');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      clearCart();
      localStorage.setItem('moms_magic_order_type', 'regular');
      localStorage.setItem('qb_search_query', searchQuery.trim());
      navigate('/food');
    }
  };

  return (
    <div className="relative min-h-screen bg-background font-sans pb-24 md:pb-8">
      <Header />

      <main className="max-w-[1440px] mx-auto">
        {/* ── Premium Hero Section ── */}
        <div className="px-4 pt-6 pb-12 relative">
          <div className="relative w-full h-[420px] rounded-[32px] overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 flex flex-col md:flex-row items-center p-8 md:p-16 border border-orange-100 shadow-sm">
            {/* Left Content */}
            <div className="w-full md:w-1/2 z-10 flex flex-col justify-center items-start text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <span className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-white text-primary font-bold text-sm mb-6 shadow-sm border border-orange-200">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                  Lightning Fast Delivery
                </span>
                <h1 className="text-4xl md:text-6xl font-black text-on-surface leading-[1.1] mb-6 tracking-tight">
                  Premium Food <br/>
                  <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-400">Delivered</span> <br/>
                  in Minutes
                </h1>
                <p className="text-secondary font-medium text-lg md:text-xl max-w-md mb-8">
                  Experience world-class culinary delights from trusted restaurants around you.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => navigate('/food')}
                    className="bg-primary text-white font-bold px-8 py-4 rounded-full shadow-[0_8px_20px_rgba(255,107,53,0.3)] hover:shadow-[0_12px_25px_rgba(255,107,53,0.4)] hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    Order Now <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Right Illustrations */}
            <div className="hidden md:flex w-1/2 h-full relative items-center justify-center">
              <motion.img 
                animate={{ y: [0, -15, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80" 
                className="absolute right-[10%] top-[10%] w-56 h-56 rounded-full object-cover shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-4 border-white z-20"
                alt="Pizza"
              />
              <motion.img 
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 }}
                src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80" 
                className="absolute right-[45%] bottom-[5%] w-48 h-48 rounded-full object-cover shadow-[0_15px_40px_rgba(0,0,0,0.12)] border-4 border-white z-10"
                alt="Burger"
              />
               <motion.div
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                className="absolute right-0 bottom-[30%] bg-white rounded-3xl p-5 shadow-[0_15px_30px_rgba(0,0,0,0.1)] z-30 transform rotate-6 border border-gray-100"
              >
                <span className="text-primary font-black text-3xl leading-none tracking-tight">50%<br/>OFF</span>
              </motion.div>
            </div>
          </div>

          {/* ── Floating Search Bar ── */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl z-30">
            <form onSubmit={handleSearch} className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search restaurants, biryani, pizza..."
                className="w-full bg-white/95 backdrop-blur-2xl border border-gray-100 rounded-[24px] pl-16 pr-16 py-5 text-lg font-medium text-on-surface placeholder:text-gray-400 outline-none focus:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all shadow-[0_12px_30px_rgba(0,0,0,0.06)]"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              >
                <Mic className="w-5 h-5 text-gray-500" />
              </button>
            </form>
          </div>
        </div>

        <div className="h-16" /> {/* Spacer for floating search bar */}

        {/* ── Quick Categories ── */}
        <div className="px-4 py-8">
          <h2 className="text-2xl font-black text-on-surface mb-6 ml-2">What's on your mind?</h2>
          <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 px-2 snap-x">
            {CATEGORY_CHIPS.map((cat, i) => (
              <motion.button
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleCategoryClick(cat.id)}
                className="flex flex-col items-center gap-3 shrink-0 snap-start group"
              >
                <div className="w-24 h-24 rounded-full overflow-hidden shadow-sm group-hover:shadow-md transition-all relative">
                  <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-all" />
                </div>
                <span className="text-sm font-semibold text-on-surface">{cat.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* ── Promotional Cards ── */}
        <div className="px-4 py-8 bg-surface-container-low rounded-[32px] mx-4 mb-8">
          <h2 className="text-2xl font-black text-on-surface mb-6 ml-2">Top Offers</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x px-2">
            {OFFERS.map((offer, i) => (
              <motion.div
                key={offer.id}
                whileHover={{ y: -5 }}
                className={`shrink-0 w-[280px] h-[140px] rounded-[24px] p-5 bg-gradient-to-br ${offer.color} text-white shadow-sm flex items-center justify-between snap-start cursor-pointer`}
              >
                <div>
                  <h3 className="text-2xl font-black leading-tight mb-1">{offer.title}</h3>
                  <p className="text-white/80 font-medium text-sm">{offer.subtitle}</p>
                </div>
                <div className="text-6xl drop-shadow-md">
                  {offer.img}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── All Items Grid ── */}
        <div className="px-4 py-8">
          <div className="flex justify-between items-end mb-8 ml-2">
            <div>
              <h2 className="text-3xl font-black text-on-surface">Explore All Items</h2>
              <p className="text-secondary font-medium mt-1">Order fresh and delicious food right away</p>
            </div>
          </div>

          {menuItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-[32px] text-center border border-outline-variant/30 mx-2">
              <span className="text-6xl mb-6">🍽️</span>
              <h3 className="text-2xl font-black text-on-surface mb-2">Fetching amazing dishes...</h3>
              <p className="text-secondary font-medium mb-6">If this takes too long, our menu might be empty right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-2">
              {menuItems.map((item, i) => {
                const banner = item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 10) * 0.05 }}
                    whileHover={{ y: -6 }}
                    className="bg-white rounded-[24px] overflow-hidden group flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-300 border border-gray-100 relative cursor-pointer"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={banner} 
                        alt={item.name} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-out" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Top Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <div className="bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${item.isVeg ? "bg-green-500" : "bg-red-500"}`}></span> 
                          <span className="uppercase tracking-wider text-gray-700">{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
                        </div>
                        
                        <button className="w-8 h-8 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-colors">
                          <Heart className="w-4 h-4" />
                        </button>
                      </div>

                      {item.royalHighlight && (
                        <div className="absolute bottom-4 left-4 bg-gradient-to-r from-primary to-orange-400 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
                          Bestseller
                        </div>
                      )}
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h3 className="font-bold text-xl text-gray-900 line-clamp-1 leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-1.5 py-0.5 rounded-md text-xs font-bold shrink-0">
                            4.5 <Star className="w-3 h-3 fill-current" />
                          </div>
                        </div>
                        <p className="text-sm font-medium text-gray-500 line-clamp-2">{item.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex flex-col">
                          <span className="font-black text-2xl text-gray-900 tracking-tight">₹{item.price}</span>
                          {item.originalPrice && <span className="text-xs text-gray-400 line-through font-semibold">₹{item.originalPrice}</span>}
                        </div>
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound(SOUNDS.ADD_TO_CART);
                            addItem(item);
                          }}
                          className="bg-primary text-white font-bold px-7 py-3 rounded-2xl shadow-[0_8px_20px_rgba(255,107,53,0.25)] hover:shadow-[0_12px_25px_rgba(255,107,53,0.35)] hover:bg-orange-600 transition-all"
                        >
                          ADD
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      
      {/* ── Footer ── */}
      <footer className="bg-white border-t border-outline-variant/30 pt-16 pb-32 md:pb-12 mt-12">
        <div className="max-w-[1440px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-2xl font-black text-primary mb-4">Moms Magic</h3>
            <p className="text-secondary font-medium">Healthy Food Delivered Fast.</p>
          </div>
          <div>
            <h4 className="font-bold text-on-surface mb-4">Company</h4>
            <ul className="space-y-3 text-secondary text-sm font-medium">
              <li className="hover:text-primary cursor-pointer transition-colors">About Us</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Careers</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Blog</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-on-surface mb-4">Support</h4>
            <ul className="space-y-3 text-secondary text-sm font-medium">
              <li className="hover:text-primary cursor-pointer transition-colors">Help Center</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Safety</li>
              <li className="hover:text-primary cursor-pointer transition-colors">Terms of Service</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-on-surface mb-4">App</h4>
            <div className="flex flex-col gap-3">
              <div className="bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-black/80 transition-colors">
                <span className="material-symbols-outlined text-[20px]">apple</span> App Store
              </div>
              <div className="bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-black/80 transition-colors">
                <span className="material-symbols-outlined text-[20px]">android</span> Play Store
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
