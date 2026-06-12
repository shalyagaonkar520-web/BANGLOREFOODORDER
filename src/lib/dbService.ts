import { ComboOffer } from '../types';

export interface AdminSettings {
  websiteStatus: 'ON' | 'OFF';
  maintenanceMessage: string;
  openTime: string; // e.g. "12:30"
  closeTime: string; // e.g. "22:30"
  reopenMessage: string;
  emergencyStop: boolean;
  festivalMode: boolean;
  deliveryPause: boolean;
  orderLimit: number;
  lastUpdated: string;
  whatsappNumber: string;
  whatsappAlertsEnabled: boolean;
  comboOffers: ComboOffer[];
}

const DEFAULT_SETTINGS: AdminSettings = {
  websiteStatus: 'ON',
  maintenanceMessage: "Mom's Magic is temporarily closed. We'll reopen soon ❤️",
  openTime: '00:00',
  closeTime: '23:59',
  reopenMessage: 'We will reopen normally on May 29, 2026.',
  emergencyStop: false,
  festivalMode: false,
  deliveryPause: false,
  orderLimit: 50,
  lastUpdated: new Date().toISOString(),
  whatsappNumber: '+917483187572',
  whatsappAlertsEnabled: true,
  comboOffers: [
    {
      id: "combo-chicken",
      name: "Chicken Feast Combo",
      regularPrice: 318,
      offerPrice: 279,
      savings: 39,
      items: [
        "Half Chicken Biryani",
        "Half Chicken Kabab",
        "Coke"
      ],
      badge: "BESTSELLER",
      isActive: true,
      isFeatured: true,
      expiryDate: "2026-06-30",
      image: "/chicken_biryani_new.png"
    },
    {
      id: "combo-veg",
      name: "Veg Delight Combo",
      regularPrice: 379,
      offerPrice: 289,
      savings: 90,
      items: [
        "Veg Kadai",
        "4 Chapati",
        "Coke"
      ],
      badge: "POPULAR",
      isActive: true,
      isFeatured: true,
      expiryDate: "2026-06-30",
      image: "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&q=80"
    }
  ]
};

export class DbService {
  private static STORAGE_KEY = 'moms_magic_admin_settings';

  /**
   * Fetch current system settings from secure API with local storage backup.
   */
  static async fetchSettings(): Promise<AdminSettings> {
    try {
      const response = await fetch(`/api/settings?t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Save copy in localStorage for immediate offline access/hydration
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    } catch (error) {
      console.warn('Backend settings fetch failed, pulling from offline storage cache:', error);
    }

    // Fallback to localStorage cache
    const cached = localStorage.getItem(this.STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        // Corrupted cache
      }
    }

    // Fallback to defaults
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * Save settings securely via API, fallback to local cache.
   */
  static async saveSettings(settings: AdminSettings, token: string): Promise<boolean> {
    // 1. Update offline cache immediately
    settings.lastUpdated = new Date().toISOString();
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));

    // 2. Perform backend secure push
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        return true;
      }
      console.error('Failed to save settings to backend server:', response.statusText);
    } catch (error) {
      console.error('Error communicating settings update to backend:', error);
    }

    return false;
  }
}
