export interface Hotel {
  id: string;
  name: string;
  status: 'open' | 'closed';
  email: string;
  address: string;
  image?: string;
  autoOpenTime?: string; // e.g. "09:00"
  autoCloseTime?: string; // e.g. "22:00"
  phone: string;
  createdAt: number;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'hotel_admin';
  hotelId?: string; // For hotel admins
  name: string;
}

export interface Product {
  id?: string;
  hotelId?: string;
  name: string;
  price: number;
  gettingPrice?: number;
  hotelPrice?: number;
  profit?: number;
  image: string;
  category: string;
  subcategory?: string;
  type: 'food' | 'grocery' | 'milk';
  description?: string;
  rating?: number;
  originalPrice?: number;
  isTopPick?: boolean;
  fires?: number;
  isVeg?: boolean;
  isAvailable?: boolean;
  stockCount?: number;
  royalHighlight?: boolean;
  items?: string[]; // For combo offers containing multiple items
}

export interface ComboOffer {
  id: string;
  name: string;
  regularPrice: number;
  offerPrice: number;
  savings: number;
  items: string[];
  badge: string;
  isActive: boolean;
  isFeatured: boolean;
  expiryDate?: string;
  image?: string;
}

export interface Order {
  id?: string;
  hotelId: string;
  userName: string;
  userPhone: string;
  address: string;
  items: CartItem[];
  total: number;
  type: 'food' | 'grocery' | 'milk';
  status: 'pending' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'completed' | 'cancelled';
  prepTime?: string; // e.g. "20 mins"
  createdAt: any;
}

export type SubscriptionPlan = 'daily' | 'weekly' | 'monthly' | null;

export interface CartItem extends Product {
  quantity: number;
  subscriptionPlan?: SubscriptionPlan;
}

// ═══════════════════════════════════════════════════════════════
// DELIVERY CHARGE CALCULATION
// Up to 2 km = ₹20
// Above 2 km = ₹10 per km (e.g., 3km = ₹30, 4km = ₹40)
// ═══════════════════════════════════════════════════════════════
export function calculateDeliveryCharge(distanceKm: number): number {
  if (distanceKm <= 0) return 0;
  if (distanceKm <= 2) return 20;
  return Math.ceil(distanceKm) * 10;
}

// Free delivery is disabled
export function shouldWaiveDelivery(_items: CartItem[], _cartTotal: number, _distanceKm: number): boolean {
  return false;
}

export function isGlobalFreeDeliveryActive(): boolean {
  return false;
}
