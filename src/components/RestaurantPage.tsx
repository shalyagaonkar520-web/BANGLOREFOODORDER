import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RestaurantPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Recommended');

  const tabs = ['Recommended', 'Bestsellers', 'Bowl Combos', 'Salads'];

  const menuItems = [
    {
      id: '1',
      name: 'Peri Peri Chicken Bowl',
      tags: 'High Protein • Low Carb',
      price: 249,
      originalPrice: 349,
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
      isVeg: false,
    },
    {
      id: '2',
      name: 'Paneer Power Bowl',
      tags: 'High Protein • Veg',
      price: 219,
      originalPrice: 299,
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80',
      isVeg: true,
    },
    {
      id: '3',
      name: 'Quinoa Veg Bowl',
      tags: 'High Fiber • Vegan',
      price: 199,
      originalPrice: 279,
      image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&q=80',
      isVeg: true,
    }
  ];

  return (
    <div className="relative min-h-screen bg-background text-on-background font-sans pb-32">
      
      {/* Restaurant Header Image */}
      <div className="relative w-full h-64">
        <img 
          src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&q=80" 
          alt="The Good Bowl" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-surface/70 backdrop-blur-md pointer-events-none" />
        
        {/* Top Actions */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-surface/20 backdrop-blur-md flex items-center justify-center text-on-surface border border-outline-variant shadow-sm cursor-pointer hover:bg-surface/40 transition-colors">
            <span className="material-symbols-outlined text-[24px]">chevron_left</span>
          </button>
          <div className="flex gap-3">
            <button className="w-10 h-10 rounded-full bg-surface/20 backdrop-blur-md flex items-center justify-center text-on-surface border border-outline-variant shadow-sm cursor-pointer hover:bg-surface/40 transition-colors">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
            <button className="w-10 h-10 rounded-full bg-surface/20 backdrop-blur-md flex items-center justify-center text-on-surface border border-outline-variant shadow-sm cursor-pointer hover:bg-surface/40 transition-colors">
              <span className="material-symbols-outlined text-[20px]">favorite</span>
            </button>
          </div>
        </div>

        {/* Pagination Dots (Mock) */}
        <div className="absolute bottom-6 right-4 bg-inverse-surface/40 backdrop-blur-sm px-2 py-1 rounded-lg text-inverse-on-surface text-[10px] font-bold tracking-wider border border-inverse-surface/20">
          1/8
        </div>
      </div>

      <main className="max-w-[1400px] mx-auto bg-surface rounded-t-3xl -mt-6 relative z-20 overflow-hidden shadow-sm pt-6 pb-20">
        
        {/* Restaurant Info */}
        <div className="px-4 space-y-3 border-b border-outline-variant/30 pb-5">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-headline-lg tracking-tight flex items-center gap-2">
                The Good Bowl
                <span className="bg-primary text-on-primary text-[10px] px-1.5 py-0.5 rounded-md font-bold tracking-widest leading-none translate-y-0.5">PRO</span>
              </h1>
              <p className="text-xs font-semibold text-secondary mt-1">Healthy Food, Salads, Bowls</p>
            </div>
            <div className="flex items-center gap-1 bg-primary text-on-primary px-2 py-1 rounded-lg text-[11px] font-bold shadow-sm">
              4.6 <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 text-xs font-bold text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[10px]">schedule</span>
              </span> 30-35 mins
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant" />
            <span>₹40 Delivery</span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-medium text-tertiary">
            <span className="material-symbols-outlined text-[14px]">location_on</span> Koramangala, Bengaluru
          </div>
        </div>

        {/* Offers Carousel */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 py-4 border-b border-outline-variant/30">
          <div className="shrink-0 bg-primary-fixed/20 border border-primary-fixed rounded-xl p-3 min-w-[140px]">
            <p className="text-primary text-xs font-bold uppercase">50% OFF</p>
            <p className="text-[10px] font-semibold text-secondary uppercase">UPTO ₹120</p>
          </div>
          <div className="shrink-0 bg-tertiary-container border border-tertiary-container/30 rounded-xl p-3 min-w-[140px]">
            <p className="text-on-tertiary-container text-xs font-bold uppercase">Use code</p>
            <p className="text-[10px] font-bold text-tertiary uppercase">MAGIC30</p>
          </div>
          <div className="shrink-0 bg-primary-fixed/20 border border-primary-fixed rounded-xl p-3 min-w-[140px]">
            <p className="text-on-surface text-xs font-bold uppercase">10% Cashback</p>
            <p className="text-[10px] font-semibold text-secondary">For Pro Members</p>
          </div>
        </div>

        {/* Menu Tabs */}
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar px-4 pt-4 border-b border-outline-variant/30 pb-0 sticky top-0 bg-surface z-30">
          {tabs.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold whitespace-nowrap transition-colors relative ${
                activeTab === tab ? 'text-primary' : 'text-secondary hover:text-on-surface'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Menu Items List */}
        <div className="px-4 py-4">
          <h2 className="text-sm font-headline-sm uppercase tracking-wider mb-4">Recommended for you</h2>
          
          <div className="space-y-6">
            {menuItems.map((item) => (
              <div key={item.id} className="flex gap-4 border-b border-outline-variant/30 pb-6 last:border-0 last:pb-0">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-3 h-3 rounded-sm border flex items-center justify-center ${item.isVeg ? 'border-tertiary' : 'border-error'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-tertiary' : 'bg-error'}`} />
                    </span>
                    {item.id === '1' && (
                      <span className="text-primary text-[8px] font-bold bg-primary-fixed px-1.5 py-0.5 rounded uppercase tracking-wider">Bestseller</span>
                    )}
                  </div>
                  <h3 className="font-headline-sm text-sm text-on-surface">{item.name}</h3>
                  <p className="text-[11px] font-medium text-secondary">{item.tags}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="font-bold text-sm text-on-surface">₹{item.price}</span>
                    <span className="text-xs text-outline line-through">₹{item.originalPrice}</span>
                  </div>
                </div>
                
                <div className="w-[110px] shrink-0 flex flex-col items-center">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-sm relative">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <button className="bg-surface border border-primary text-primary font-bold text-xs px-5 py-1.5 rounded-xl shadow-sm -mt-3 relative z-10 hover:bg-primary-fixed active:scale-95 transition-all uppercase tracking-wide">
                    Add +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface border-t border-outline-variant/30 p-4 z-[100] pb-safe">
        <div className="bg-primary-fixed border border-primary/20 rounded-2xl p-4 flex items-center justify-between text-primary shadow-sm cursor-pointer" onClick={() => navigate('/cart')}>
          <div className="flex flex-col">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary/80">3 Items</span>
            <span className="font-headline-md text-lg">₹657</span>
          </div>
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-sm text-primary">
            View Cart <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </div>
        </div>
      </div>
      
    </div>
  );
}
