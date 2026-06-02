import React from 'react';
import { useSystemStore } from '../store/systemStore';
import { useCartStore } from '../store/cartStore';
import { motion } from 'framer-motion';
import { Flame, ShoppingBag, Sparkles, Gift } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product, ComboOffer } from '../types';

export default function ComboOffersSection() {
  const settings = useSystemStore(state => state.settings);
  const { addItem, items: cartItems } = useCartStore();

  const combos = settings.comboOffers || [];

  // Filter only active and unexpired combos
  const activeCombos = combos.filter(combo => {
    if (!combo.isActive) return false;
    
    // Check expiry
    if (combo.expiryDate) {
      const now = new Date();
      const expiry = new Date(combo.expiryDate);
      expiry.setHours(23, 59, 59, 999);
      if (now > expiry) return false;
    }
    
    return true;
  });

  if (activeCombos.length === 0) return null;

  const mapComboToProduct = (combo: ComboOffer): Product => {
    return {
      id: combo.id,
      name: combo.name,
      price: combo.offerPrice,
      originalPrice: combo.regularPrice,
      image: combo.image || '/chicken_biryani_new.png',
      category: 'Combos',
      type: 'food',
      description: combo.items.join(' + '),
      isVeg: combo.name.toLowerCase().includes('veg'),
      isAvailable: combo.isActive,
      items: combo.items
    };
  };

  return (
    <section className="relative z-20 py-8 px-4 max-w-[1400px] mx-auto space-y-8">
      {/* Section Title */}
      <div className="text-left space-y-2 px-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#4CD964]/10 border border-[#4CD964]/20 text-[9px] font-black uppercase tracking-wider text-[#4CD964]">
          <Flame className="w-3.5 h-3.5 fill-[#4CD964] text-[#4CD964] animate-pulse" />
          ⚡ Special Combos
        </div>
        <h2 className="text-2xl md:text-4xl font-black italic uppercase tracking-tight text-white">
          🔥 Special <span className="animate-blink-glow">Combo Offers</span>
        </h2>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[9px]">
          Bundled culinary perfection crafted for extreme value
        </p>
      </div>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeCombos.map((combo, idx) => {
          const product = mapComboToProduct(combo);
          const inCart = cartItems.some(i => i.id === combo.id);

          return (
            <motion.div
              key={combo.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ 
                y: -6, 
                rotateX: 2, 
                rotateY: -2,
                scale: 1.015,
                z: 15
              }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="relative bg-[#0B0E14] rounded-[28px] overflow-hidden group transition-all duration-500 flex flex-col sm:flex-row h-full w-full perspective-1000 preserve-3d animate-gold-blink cursor-pointer"
            >
              {/* Limited Time Ribbon */}
              <div className="absolute top-3 left-3 bg-[#4CD964]/10 border border-[#4CD964]/30 text-[#4CD964] text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1 z-10">
                <Flame className="w-3 h-3 fill-[#4CD964]" />
                Limited Offer
              </div>

              {/* Badges Column (Bestseller/Popular) */}
              {combo.badge && (
                <div className="absolute top-3 right-3 bg-[#4CD964] text-[#050505] text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl shadow-md z-10">
                  ★ {combo.badge}
                </div>
              )}

              {/* Cover Image */}
              <div className="w-full sm:w-[42%] aspect-[16/10] sm:aspect-auto relative overflow-hidden bg-black/40 shrink-0">
                <img
                  src={combo.image || '/chicken_biryani_new.png'}
                  alt={combo.name}
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-[#0B0E14] via-transparent to-transparent opacity-95" />
              </div>

              {/* Content Panel */}
              <div className="flex-1 p-5 flex flex-col justify-between gap-4 relative">
                <div>
                  {/* Veg/Non-veg Dot */}
                  <div className="flex items-center gap-2 mb-2 pt-1 sm:pt-0">
                    <span className={`px-2 py-0.5 rounded-md border text-[7px] font-black uppercase tracking-wider ${
                      product.isVeg 
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                        : 'border-red-500/30 bg-red-500/10 text-red-400'
                    }`}>
                      {product.isVeg ? 'Veg' : 'Non-Veg'}
                    </span>
                  </div>

                  <h3 className="text-xl font-black italic uppercase tracking-tight text-white drop-shadow-sm flex items-center gap-2">
                    {combo.name}
                  </h3>

                  {/* Included Items list */}
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[8px] font-black uppercase text-white/40 tracking-widest mb-1">Includes:</p>
                    <ul className="space-y-1">
                      {combo.items.map((item, subIdx) => (
                        <li key={subIdx} className="text-white/80 text-[11px] font-semibold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#4CD964] shrink-0 shadow-[0_0_8px_rgba(76,217,100,0.4)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Pricing & CTA */}
                <div className="space-y-4 pt-3 border-t border-white/5 mt-auto">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-black italic text-[#4CD964] tracking-tight leading-none">
                        ₹{combo.offerPrice}
                      </p>
                    </div>
                  </div>

                  {/* Order Button */}
                  <button
                    onClick={() => {
                      addItem(product);
                      toast.success(`${combo.name} added to cravings plate! 🍳`, {
                        style: {
                          background: '#0B0E14',
                          color: '#FFFFFF',
                          border: '1px solid rgba(76, 217, 100, 0.2)',
                          borderRadius: '20px',
                          padding: '16px 24px',
                          fontWeight: '600'
                        }
                      });
                    }}
                    className={`w-full py-3.5 rounded-[18px] font-black text-[9px] uppercase tracking-[2px] flex items-center justify-center gap-2 transition-all duration-300 animate-shine-sweep ${
                      inCart 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : 'bg-[#4CD964] hover:bg-[#3AC152] text-[#050505] shadow-lg shadow-brand/10 hover:scale-[1.01] active:scale-95'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {inCart ? 'ADD ANOTHER' : 'ORDER NOW'}
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
