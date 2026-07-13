import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '../store/cartStore';
import { playSound, SOUNDS } from '../utils/audio';

/**
 * QuickBite-style food item card.
 * Horizontal layout: image on right, details on left, Add/stepper button.
 */
export default function RestaurantCard({ product }: { product: any }) {
  const { addItem, items, updateQuantity } = useCartStore();
  const inCart = items.find((i: any) => i.id === product.id);

  const handleAdd = () => {
    playSound(SOUNDS.ADD_TO_CART);
    addItem(product);
  };
  const handleInc = () => {
    playSound(SOUNDS.QUANTITY_TICK);
    updateQuantity(product.id, (inCart?.quantity || 0) + 1);
  };
  const handleDec = () => {
    playSound(SOUNDS.QUANTITY_TICK);
    updateQuantity(product.id, inCart && inCart.quantity > 1 ? inCart.quantity - 1 : 0);
  };

  return (
    <motion.div
      layout
      className="bg-surface border-b border-outline-variant/30 last:border-b-0 py-4 flex gap-3 items-start"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* ── Details ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        {/* Veg / Non-veg indicator */}
        <div className="flex items-center gap-1.5">
          {product.isVeg ? (
            <span className="inline-flex items-center justify-center border border-tertiary rounded px-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary block" />
            </span>
          ) : (
            <span className="inline-flex items-center justify-center border border-error rounded px-1 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-error block" />
            </span>
          )}
          {product.royalHighlight && (
            <span className="text-[10px] font-semibold text-primary bg-primary-fixed px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span> Bestseller
            </span>
          )}
        </div>

        {/* Name */}
        <h4 className="font-headline-md text-on-surface leading-snug line-clamp-1">
          {product.name}
        </h4>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-[15px] text-on-surface">₹{product.price}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-secondary line-through">₹{product.originalPrice}</span>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <p className="text-xs text-secondary leading-relaxed line-clamp-2">
            {product.description}
          </p>
        )}
      </div>

      {/* ── Image + Add Button ── */}
      <div className="relative shrink-0 flex flex-col items-center gap-2">
        <div className="w-24 h-24 rounded-2xl overflow-hidden bg-surface-container-low border border-outline-variant/30">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
        </div>

        {/* Add / Stepper */}
        <AnimatePresence mode="wait">
          {inCart ? (
            <motion.div
              key="stepper"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center bg-primary rounded-xl overflow-hidden shadow-sm"
            >
              <button
                onClick={handleDec}
                className="w-8 h-8 flex items-center justify-center text-on-primary hover:bg-surface-tint transition-colors"
              >
                <span className="material-symbols-outlined text-[14px] font-bold">remove</span>
              </button>
              <span className="w-8 text-center text-sm font-bold text-on-primary">
                {inCart.quantity}
              </span>
              <button
                onClick={handleInc}
                className="w-8 h-8 flex items-center justify-center text-on-primary hover:bg-surface-tint transition-colors"
              >
                <span className="material-symbols-outlined text-[14px] font-bold">add</span>
              </button>
            </motion.div>
          ) : (
            <motion.button
              key="add"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAdd}
              className="w-24 h-8 bg-surface border-2 border-primary text-primary text-sm font-bold rounded-xl flex items-center justify-center gap-1 hover:bg-primary-fixed transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px] font-bold">add</span>
              Add
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
