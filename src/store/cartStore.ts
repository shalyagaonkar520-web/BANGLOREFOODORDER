import { create } from 'zustand';
import { CartItem, Product, SubscriptionPlan } from '../types';

interface CartStore {
  items: CartItem[];
  lastRemovedItem: CartItem | null;
  addItem: (product: Product, subscriptionPlan?: SubscriptionPlan, quantity?: number) => void;
  removeItem: (productId: string) => void;
  undoRemove: () => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateSubscriptionPlan: (productId: string, plan: SubscriptionPlan) => void;
  clearCart: () => void;
  total: number;
}

const getMultiplier = (plan: SubscriptionPlan) => {
  if (plan === 'weekly') return 7;
  if (plan === 'monthly') return 30;
  return 1;
};

export const useCartStore = create<CartStore>((set, get) => {
  const calculateTotal = (items: CartItem[]) => 
    items.reduce((acc, i) => acc + (i.price * i.quantity * getMultiplier(i.subscriptionPlan)), 0);

  return {
    items: [],
    lastRemovedItem: null,
    total: 0,
    addItem: (product, subscriptionPlan = null, quantity = 1) => {
      const items = get().items;
      const existingIndex = items.findIndex(i => i.id === product.id);
      let newItems;
      if (existingIndex > -1) {
        newItems = items.map((item, idx) => 
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity, subscriptionPlan } : item
        );
      } else {
        newItems = [...items, { ...product, quantity, subscriptionPlan }];
      }
      set({ items: newItems, total: calculateTotal(newItems) });
    },
    removeItem: (productId) => {
      const itemToRemove = get().items.find(i => i.id === productId);
      if (itemToRemove) {
        const newItems = get().items.filter(i => i.id !== productId);
        set({ 
          lastRemovedItem: itemToRemove,
          items: newItems,
          total: calculateTotal(newItems)
        });
      }
    },
    undoRemove: () => {
      const lastItem = get().lastRemovedItem;
      if (lastItem) {
        const newItems = [...get().items, lastItem];
        set({ 
          items: newItems,
          lastRemovedItem: null,
          total: calculateTotal(newItems)
        });
      }
    },
    updateQuantity: (productId, quantity) => {
      if (quantity <= 0) {
        get().removeItem(productId);
        return;
      }
      const newItems = get().items.map(i => i.id === productId ? { ...i, quantity } : i);
      set({ items: newItems, total: calculateTotal(newItems) });
    },
    updateSubscriptionPlan: (productId, plan) => {
      const newItems = get().items.map(i => i.id === productId ? { ...i, subscriptionPlan: plan } : i);
      set({ items: newItems, total: calculateTotal(newItems) });
    },
    clearCart: () => set({ items: [], total: 0 }),
  };
});
