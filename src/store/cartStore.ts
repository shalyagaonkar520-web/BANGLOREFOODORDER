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

const applyOffers = (items: CartItem[]): CartItem[] => {
  const baseItems = items.filter(i => i.id !== 'free-coke' && i.id !== 'free-juice');
  
  // Free Coke offer: 1 free coke for every 2 eligible biryanis
  const eligibleIds = ['br-5', 'br-5-full', 'rn-2'];
  const eligibleCount = baseItems
    .filter(i => eligibleIds.includes(i.id))
    .reduce((sum, i) => sum + i.quantity, 0);
    
  const freeCokes = Math.floor(eligibleCount / 2);
  
  if (freeCokes > 0) {
    baseItems.push({
      id: 'free-coke',
      name: 'Free Coke 500ml',
      price: 0,
      category: 'Drinks',
      type: 'food',
      image: '/coke_range.png',
      quantity: freeCokes,
      subscriptionPlan: null as any
    } as CartItem);
  }

  // 🎁 Free Juice offer: 1 free Mango Juice with every order
  const realItemCount = baseItems.reduce((sum, i) => sum + i.quantity, 0);
  if (realItemCount > 0) {
    baseItems.push({
      id: 'free-juice',
      name: '🎁 Free Juice',
      price: 0,
      category: 'Drinks',
      type: 'food',
      image: '',
      quantity: 1,
      subscriptionPlan: null as any
    } as CartItem);
  }
  
  return baseItems;
};

export const useCartStore = create<CartStore>((set, get) => {
  const calculateTotal = (items: CartItem[]) => 
    items.reduce((acc, i) => acc + (i.price * i.quantity * getMultiplier(i.subscriptionPlan)), 0);

  const updateCart = (newItems: CartItem[]) => {
    const itemsWithOffers = applyOffers(newItems);
    set({ items: itemsWithOffers, total: calculateTotal(itemsWithOffers) });
  };

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
      updateCart(newItems);
    },
    removeItem: (productId) => {
      const itemToRemove = get().items.find(i => i.id === productId);
      if (itemToRemove) {
        const newItems = get().items.filter(i => i.id !== productId);
        set({ lastRemovedItem: itemToRemove });
        updateCart(newItems);
      }
    },
    undoRemove: () => {
      const lastItem = get().lastRemovedItem;
      if (lastItem) {
        const newItems = [...get().items, lastItem];
        set({ lastRemovedItem: null });
        updateCart(newItems);
      }
    },
    updateQuantity: (productId, quantity) => {
      if (quantity <= 0) {
        get().removeItem(productId);
        return;
      }
      const newItems = get().items.map(i => i.id === productId ? { ...i, quantity } : i);
      updateCart(newItems);
    },
    updateSubscriptionPlan: (productId, plan) => {
      const newItems = get().items.map(i => i.id === productId ? { ...i, subscriptionPlan: plan } : i);
      updateCart(newItems);
    },
    clearCart: () => set({ items: [], total: 0 }),
  };
});
