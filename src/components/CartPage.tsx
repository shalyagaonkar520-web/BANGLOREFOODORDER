import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getFakeOriginalPrice } from '../data/menuItems';
import { useLocationStore } from '../store/locationStore';
import { calculateDeliveryCharge } from '../types';
import { useSystemStore } from '../store/systemStore';
import toast from 'react-hot-toast';
import { useSEO } from '../utils/seo';

export default function CartPage() {
  useSEO("Your Cart", "Review your selected items, apply promo codes, and complete your order details at Moms Magic.");
  const { items, updateQuantity, removeItem, total } = useCartStore();
  const navigate = useNavigate();
  const { deliveryLocation } = useLocationStore();
  const settings = useSystemStore(state => state.settings);
  const distanceKm = deliveryLocation?.distance ?? 0;
  const deliveryCharge = calculateDeliveryCharge(distanceKm);
  const taxRate = settings.taxRate ?? 5;
  const taxAmount = (total * taxRate) / 100;
  const rainySeasonFee = 5;
  const grandTotal = total + deliveryCharge + rainySeasonFee + taxAmount;
  
  const adminToken = localStorage.getItem('moms_magic_admin_token');
  const userPhone = localStorage.getItem('moms_magic_user_phone');
  const isAdmin = adminToken === 'mock-jwt-admin-token-123456' || 
                  ['+917483187572', '+919606001790', '7483187572', '9606001790'].includes(userPhone || '');

  const isOrderingPaused = (settings.websiteStatus === 'OFF' || settings.emergencyStop) && !isAdmin;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 rounded-[32px] bg-surface-container flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[64px] text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>
            shopping_bag
          </span>
        </motion.div>

        <div className="space-y-2">
          <h2 className="font-headline-lg text-3xl text-on-surface">Your Cart is <span className="text-primary">Empty</span></h2>
          <p className="text-body-md text-secondary">Looks like you haven't added anything yet.</p>
        </div>

        <button 
          onClick={() => navigate('/food')}
          className="bg-primary text-on-primary font-label-lg px-8 py-4 rounded-xl hover:bg-surface-tint active:scale-95 transition-all shadow-sm"
        >
          Browse Food
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/food')}
            className="w-10 h-10 rounded-2xl border border-outline-variant bg-surface flex items-center justify-center hover:border-primary transition-colors shrink-0">
            <span className="material-symbols-outlined text-on-surface">chevron_left</span>
          </button>
          <h1 className="font-headline-md text-on-surface text-xl">Review Cart</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Cart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence mode="popLayout">
              {items.map((item, idx) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-surface rounded-2xl p-4 border border-outline-variant/30 flex flex-col md:flex-row gap-4 relative shadow-sm"
                >
                  {item.image && (
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container-low border border-outline-variant/30">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="text-label-sm text-secondary uppercase tracking-wider">{item.category}</span>
                      <h3 className="font-headline-md text-on-surface text-lg leading-tight">{item.name}</h3>
                      {item.items && item.items.length > 0 && (
                        <ul className="mt-1 space-y-1">
                          {item.items.map((subItem, sIdx) => (
                            <li key={sIdx} className="text-body-sm text-secondary flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                              {subItem}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <div className="flex items-center bg-surface-container-low rounded-xl border border-outline-variant/30">
                        <button 
                          onClick={() => updateQuantity(item.id!, item.quantity - 1)}
                          className="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-container transition-colors rounded-l-xl"
                        >
                          <span className="material-symbols-outlined font-bold text-[18px]">remove</span>
                        </button>
                        <span className="w-10 text-center font-bold text-on-surface">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id!, item.quantity + 1)}
                          className="w-10 h-10 flex items-center justify-center text-primary hover:bg-surface-container transition-colors rounded-r-xl"
                        >
                          <span className="material-symbols-outlined font-bold text-[18px]">add</span>
                        </button>
                      </div>

                      <button 
                        onClick={() => removeItem(item.id!)}
                        className="flex items-center gap-1.5 text-error text-label-md hover:bg-error-container hover:text-on-error-container px-3 py-2 rounded-xl transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span> Remove
                      </button>
                    </div>
                  </div>

                  <div className="md:text-right mt-2 md:mt-0 flex flex-col justify-between">
                    <p className="font-bold text-on-surface text-xl">₹{item.price * item.quantity}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <div className="bg-surface rounded-3xl p-6 border border-outline-variant/30 shadow-sm sticky top-[80px] space-y-6">
              <div>
                <h3 className="font-headline-md text-on-surface text-xl mb-1">Order Summary</h3>
                <p className="text-body-sm text-secondary">Review pricing details</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-body-md text-secondary">
                  <span>Subtotal</span>
                  <span className="font-bold text-on-surface">₹{total}</span>
                </div>
                <div className="flex justify-between items-center text-body-md text-secondary">
                  <span>Tax ({settings.taxRate ?? 5}%)</span>
                  <span className="font-bold text-on-surface">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-body-md text-secondary">
                  <span>Rainy Season Fee</span>
                  <span className="font-bold text-on-surface">₹{rainySeasonFee}</span>
                </div>
                <div className="flex justify-between items-center text-body-md text-secondary">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-primary">local_shipping</span>
                    <span>Delivery</span>
                  </div>
                  <span className="font-bold text-on-surface">₹{deliveryCharge}</span>
                </div>
                
                <hr className="border-outline-variant/30" />
                
                <div className="flex justify-between items-end pt-2">
                  <span className="font-headline-sm text-on-surface text-lg">Total</span>
                  <p className="font-headline-lg text-primary text-3xl">₹{grandTotal}</p>
                </div>
              </div>
              
              <div className="space-y-4 pt-2">
                <button 
                  onClick={() => {
                    if (isOrderingPaused) {
                      toast.error("Ordering is temporarily closed! Please check operating hours.", {
                        style: { background: 'var(--color-error-container)', color: 'var(--color-on-error-container)', border: '1px solid var(--color-error)' }
                      });
                      return;
                    }
                    navigate('/checkout');
                  }}
                  className={`w-full h-14 rounded-xl font-label-lg flex items-center justify-center gap-2 transition-all shadow-sm ${
                    isOrderingPaused 
                      ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed border border-outline-variant'
                      : 'bg-primary text-on-primary hover:bg-surface-tint active:scale-95'
                  }`}
                >
                  {isOrderingPaused ? 'ORDERING PAUSED' : 'PROCEED TO CHECKOUT'}
                  {!isOrderingPaused && <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_forward</span>}
                </button>
                <div className="flex items-center justify-center gap-2 text-label-sm text-secondary">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  Secure Checkout
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
