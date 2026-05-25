import { Product } from '../types';
import { MENU_ITEMS } from '../data/menuItems';

// ─── CATEGORY GROUPS ───────────────────────────────────────────────────────
const MEAL_CATEGORIES = ['Biryani', 'Rice & Noodles', 'Burgers & Rolls', 'Pizzas & Momos', 'Fast Food'];
const STARTER_CATEGORIES = ['Starters', 'Mutton'];
const DRINK_CATEGORIES = ['Drinks'];
const COMBO_CATEGORIES = ['Combos'];
const DESSERT_CATEGORIES = ['Desserts'];

// ─── ITEM IDS ───────────────────────────────────────────────────────────────
const COKE_ID = 'drink-coke';
const SPRITE_ID = 'drink-sprite';
const FRIES_ID = 'main-3';
const PAPAD_ID = 'ff-1';
const BUTTERSCOTCH_ID = 'drink-special-2';
const MANGO_SHAKE_ID = 'drink-special-1';
const CANDLE_ID = 'party-3';
const SPRAY_ID = 'party-1';
const POPPER_ID = 'party-2';
const CAP_ID = 'party-4';
const BALLOONS_ID = 'party-5';
const VEG_PUFFS_ID = 'snack-1';
const EGG_PUFFS_ID = 'snack-2';
const NAAN_ID = 'rt-7';
const CHAPATI_ID = 'rt-1';

// Party items (defined inline since they come from partyItems.ts)
const PARTY_SUGGESTION_ITEMS: Product[] = [
  { id: CANDLE_ID, name: 'Spark Candle', price: 25, category: 'Party Items', type: 'food', image: 'https://images.unsplash.com/photo-1550995166-5c5dfa1f7cd7?w=800&q=80', description: 'Perfect for Birthday!', isVeg: true },
  { id: SPRAY_ID, name: 'Party Spray', price: 69, category: 'Party Items', type: 'food', image: 'https://images.unsplash.com/photo-1530103862676-de8892b12af6?w=800&q=80', description: 'Perfect for Birthday!', isVeg: true },
  { id: POPPER_ID, name: 'Party Popper', price: 99, category: 'Party Items', type: 'food', image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', description: 'Perfect for Birthday!', isVeg: true },
  { id: CAP_ID, name: 'Party Cap', price: 20, category: 'Party Items', type: 'food', image: 'https://images.unsplash.com/photo-1561569424-9b5cc04a5f60?w=800&q=80', description: 'Perfect for Birthday!', isVeg: true },
  { id: BALLOONS_ID, name: '5 Balloons Pack', price: 20, category: 'Party Items', type: 'food', image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=800&q=80', description: 'Perfect for Birthday!', isVeg: true },
];

const SNACK_SUGGESTION_ITEMS: Product[] = [
  { id: VEG_PUFFS_ID, name: 'Veg Puffs', price: 25, category: 'Snacks', type: 'food', image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=800&q=80', description: 'Crispy and hot veg puffs.', isVeg: true },
  { id: EGG_PUFFS_ID, name: 'Egg Puffs', price: 30, category: 'Snacks', type: 'food', image: 'https://images.unsplash.com/photo-1608039755401-742074f0548f?w=800&q=80', description: 'Delicious hot egg puffs.', isVeg: false },
];

// ─── DRINK IDS ───────────────────────────────────────────────────────────────
const DRINK_SUGGESTION_IDS = [
  'drink-coke',       // Coke 500ml
  'drink-sprite',     // Sprite 500ml
  'drink-special-1',  // Jaipur Mango Milkshake
  'drink-special-2',  // Butterscotch Milkshake
  'drink-special-3',  // Vanilla Milkshake
];

function getById(id: string): Product | undefined {
  return MENU_ITEMS.find(i => i.id === id);
}

export type RecommendationType = 'drinks' | 'chicken_combo';

export interface RecommendationResult {
  type: RecommendationType;
  title: string;
  subtitle: string;
  emoji: string;
  items: Product[];
  triggerMessage?: string;
}

// ─── SIMPLE COMBO LEARNING (localStorage) ──────────────────────────────────
const COMBO_KEY = 'mm_combo_learns';

export function recordComboClick(triggerId: string, suggestedId: string) {
  try {
    const raw = localStorage.getItem(COMBO_KEY);
    const map: Record<string, Record<string, number>> = raw ? JSON.parse(raw) : {};
    if (!map[triggerId]) map[triggerId] = {};
    map[triggerId][suggestedId] = (map[triggerId][suggestedId] || 0) + 1;
    localStorage.setItem(COMBO_KEY, JSON.stringify(map));
  } catch {}
}

export function getLearnedTopPicks(triggerId: string, allSuggestions: Product[]): Product[] {
  try {
    const raw = localStorage.getItem(COMBO_KEY);
    if (!raw) return allSuggestions;
    const map: Record<string, Record<string, number>> = JSON.parse(raw);
    const counts = map[triggerId] || {};
    return [...allSuggestions].sort((a, b) => (counts[b.id!] || 0) - (counts[a.id!] || 0));
  } catch {
    return allSuggestions;
  }
}

// ─── CHICKEN STARTER IDS ────────────────────────────────────────────────────
const CHICKEN_STARTER_IDS = [
  'st-3',   // Chicken Kabab
  'st-7',   // Chicken Kabab Half
  'st-1',   // Chicken Crispy
  'st-2',   // Chicken 65
  'st-4',   // Chicken Lollipop
  'ff-samosa', // Chicken Samosa (2 pcs) ₹39
];

// ─── VEG STARTER IDS ────────────────────────────────────────────────────────
const VEG_STARTER_IDS = [
  'ff-1',       // Masala Papad ₹69
  'main-3',     // French Fries ₹74
  'rn-3',       // Gobi Manchurian ₹109
  'rn-8',       // Gobi Chilli ₹149
];

// Detect if the item name contains "chicken" (case-insensitive)
function isChickenItem(product: Product): boolean {
  return product.name.toLowerCase().includes('chicken');
}

// ─── MAIN RECOMMENDATION FUNCTION ──────────────────────────────────────────
export function getRecommendations(product: Product, cartTotal: number): RecommendationResult | null {
  // Don't show popup when user already adds a drink
  if (product.category === 'Drinks') return null;

  const allDrinks = DRINK_SUGGESTION_IDS
    .map(id => getById(id))
    .filter(Boolean) as Product[];

  const cartMsg = cartTotal >= 499 ? '🔥 Add a drink and complete your meal!' : undefined;

  // For chicken items → show chicken starters + drinks
  if (isChickenItem(product)) {
    const starterSuggestions = CHICKEN_STARTER_IDS
      .filter(id => id !== product.id)
      .map(id => getById(id))
      .filter(Boolean) as Product[];

    const combined = [...starterSuggestions, ...allDrinks];

    return {
      type: 'chicken_combo',
      title: 'Perfect with Your Chicken',
      subtitle: 'Starters & drinks customers love to pair',
      emoji: '🍗',
      triggerMessage: cartMsg,
      items: getLearnedTopPicks(product.id!, combined),
    };
  }

  // For veg items → show veg starters + drinks
  if (product.isVeg) {
    const vegStarterSuggestions = VEG_STARTER_IDS
      .filter(id => id !== product.id)
      .map(id => getById(id))
      .filter(Boolean) as Product[];

    const combined = [...vegStarterSuggestions, ...allDrinks];

    return {
      type: 'drinks',
      title: 'Goes Great Together',
      subtitle: 'Popular veg combos our customers love',
      emoji: '🥦',
      triggerMessage: cartMsg,
      items: getLearnedTopPicks(product.id!, combined),
    };
  }

  // All other non-veg / non-chicken items → drinks only
  return {
    type: 'drinks',
    title: 'Frequently Bought Together',
    subtitle: 'Customers also added a drink to their order',
    emoji: '🥤',
    triggerMessage: cartMsg,
    items: getLearnedTopPicks(product.id!, allDrinks),
  };
}
