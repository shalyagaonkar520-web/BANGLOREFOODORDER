import { create } from 'zustand';
import { Product } from '../types';

export interface BulkCartItem extends Product {
  baseQty: number;       // base quantity per person (internal)
  finalQuantity: number;  // baseQty × peopleCount (auto-calculated)
  manualAdjust: number;   // manual +/- offset
}

export interface CakeSelection {
  required: boolean;
  text: string;
  size: '0.5kg' | '1kg' | '2kg';
  price: number;
}

export interface DecorationSelection {
  balloons: number;
  spray: number;
  candles: number;
}

export interface AdditionalServices {
  disposablePlates: boolean;
  setupServing: boolean;
  specialInstructions: string;
}

interface BulkOrderStore {
  // Step tracking
  currentStep: number;
  setStep: (step: number) => void;

  // Event details
  eventDate: string;
  eventTime: string;
  setEventDate: (date: string) => void;
  setEventTime: (time: string) => void;

  // People count
  peopleCount: number;
  setPeopleCount: (count: number) => void;

  // Bulk cart
  bulkItems: BulkCartItem[];
  addBulkItem: (product: Product) => void;
  removeBulkItem: (productId: string) => void;
  adjustQuantity: (productId: string, delta: number) => void;

  // Add-ons
  cake: CakeSelection;
  setCake: (cake: Partial<CakeSelection>) => void;
  decoration: DecorationSelection;
  setDecoration: (decoration: Partial<DecorationSelection>) => void;

  // Additional services
  additionalServices: AdditionalServices;
  setAdditionalServices: (services: Partial<AdditionalServices>) => void;

  // Add-on popup
  showAddOnPopup: boolean;
  setShowAddOnPopup: (show: boolean) => void;
  addOnPopupShown: boolean; // only show once per session

  // Totals
  getItemTotal: (item: BulkCartItem) => number;
  getSubtotal: () => number;
  getAddOnsTotal: () => number;
  getServicesTotal: () => number;
  getGrandTotal: () => number;

  // Reset
  resetBulkOrder: () => void;
}

// Base quantity mapping per person for different categories
const BASE_QTY_MAP: Record<string, number> = {
  'Fast Food': 2,
  'Rice & Noodles': 1,
  'Biryani': 1,
  'Starters': 2,
  'Veg/Gravy': 1,
  'Roti': 3,
  'Burgers & Rolls': 1,
  'Pizzas & Momos': 1,
  'Drinks': 1,
  'Combos': 1,
  'Mutton': 1,
};

const CAKE_PRICES: Record<string, number> = {
  '0.5kg': 350,
  '1kg': 600,
  '2kg': 1100,
};

const DECORATION_PRICES = {
  balloons: 150,
  spray: 50,
  candles: 30,
};

const SERVICES_PRICES = {
  disposablePlates: 5,  // per person
  setupServing: 500,    // flat
};

export const useBulkOrderStore = create<BulkOrderStore>((set, get) => ({
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),

  eventDate: '',
  eventTime: '',
  setEventDate: (date) => set({ eventDate: date }),
  setEventTime: (time) => set({ eventTime: time }),

  peopleCount: 10,
  setPeopleCount: (count) => {
    const finalCount = Math.max(3, count);
    const bulkItems = get().bulkItems.map(item => ({
      ...item,
      finalQuantity: item.baseQty * finalCount + item.manualAdjust,
    }));
    set({ peopleCount: finalCount, bulkItems });
  },

  bulkItems: [],
  addBulkItem: (product) => {
    const { bulkItems, peopleCount } = get();
    const exists = bulkItems.find(i => i.id === product.id);
    if (exists) return; // already added

    const baseQty = BASE_QTY_MAP[product.category] || 1;
    const newItem: BulkCartItem = {
      ...product,
      baseQty,
      finalQuantity: baseQty * peopleCount,
      manualAdjust: 0,
    };
    set({ bulkItems: [...bulkItems, newItem] });
  },

  removeBulkItem: (productId) => {
    set({ bulkItems: get().bulkItems.filter(i => i.id !== productId) });
  },

  adjustQuantity: (productId, delta) => {
    const { bulkItems, peopleCount } = get();
    set({
      bulkItems: bulkItems.map(item => {
        if (item.id !== productId) return item;
        const newAdjust = item.manualAdjust + delta;
        const newFinal = item.baseQty * peopleCount + newAdjust;
        if (newFinal < 1) return item; // don't go below 1
        return { ...item, manualAdjust: newAdjust, finalQuantity: newFinal };
      }),
    });
  },

  cake: { required: false, text: '', size: '1kg', price: 600 },
  setCake: (cake) => {
    const current = get().cake;
    const newCake = { ...current, ...cake };
    if (cake.size) {
      newCake.price = CAKE_PRICES[cake.size] || 600;
    }
    set({ cake: newCake });
  },

  decoration: { balloons: 0, spray: 0, candles: 0 },
  setDecoration: (decoration) => {
    set({ decoration: { ...get().decoration, ...decoration } });
  },

  additionalServices: {
    disposablePlates: false,
    setupServing: false,
    specialInstructions: '',
  },
  setAdditionalServices: (services) => {
    set({ additionalServices: { ...get().additionalServices, ...services } });
  },

  showAddOnPopup: false,
  setShowAddOnPopup: (show) => set({ showAddOnPopup: show }),
  addOnPopupShown: false,

  getItemTotal: (item) => item.finalQuantity * item.price,
  getSubtotal: () => get().bulkItems.reduce((acc, item) => acc + item.finalQuantity * item.price, 0),
  getAddOnsTotal: () => {
    const { cake, decoration } = get();
    let total = 0;
    if (cake.required) total += cake.price;
    total += decoration.balloons * DECORATION_PRICES.balloons;
    total += decoration.spray * DECORATION_PRICES.spray;
    total += decoration.candles * DECORATION_PRICES.candles;
    return total;
  },
  getServicesTotal: () => {
    const { additionalServices, peopleCount } = get();
    let total = 0;
    if (additionalServices.disposablePlates) total += SERVICES_PRICES.disposablePlates * peopleCount;
    if (additionalServices.setupServing) total += SERVICES_PRICES.setupServing;
    return total;
  },
  getGrandTotal: () => get().getSubtotal() + get().getAddOnsTotal() + get().getServicesTotal(),

  resetBulkOrder: () => set({
    currentStep: 1,
    eventDate: '',
    eventTime: '',
    peopleCount: 10,
    bulkItems: [],
    cake: { required: false, text: '', size: '1kg', price: 600 },
    decoration: { balloons: 0, spray: 0, candles: 0 },
    additionalServices: { disposablePlates: false, setupServing: false, specialInstructions: '' },
    showAddOnPopup: false,
    addOnPopupShown: false,
  }),
}));
