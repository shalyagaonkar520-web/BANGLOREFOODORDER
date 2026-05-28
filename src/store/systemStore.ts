import { create } from 'zustand';
import { DbService, AdminSettings } from '../lib/dbService';

interface SystemState {
  settings: AdminSettings;
  isLoading: boolean;
  error: string | null;
  
  // Operations
  loadSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<AdminSettings>, token?: string) => Promise<boolean>;
  triggerEmergencyStop: (token: string) => Promise<boolean>;
  resetEmergencyStop: (token: string) => Promise<boolean>;
}

const DEFAULT_SETTINGS: AdminSettings = {
  websiteStatus: 'ON',
  maintenanceMessage: "Mom's Magic is temporarily closed. We'll reopen soon ❤️",
  openTime: '12:30',
  closeTime: '22:30',
  reopenMessage: 'We will reopen normally on May 29, 2026.',
  emergencyStop: false,
  festivalMode: false,
  deliveryPause: false,
  orderLimit: 50,
  lastUpdated: new Date().toISOString(),
  whatsappNumber: '+919606001790',
  whatsappAlertsEnabled: true
};

export const useSystemStore = create<SystemState>((set, get) => ({
  settings: { ...DEFAULT_SETTINGS },
  isLoading: false,
  error: null,

  loadSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await DbService.fetchSettings();
      set({ settings, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load system settings', isLoading: false });
    }
  },

  updateSettings: async (newSettings, token) => {
    const updatedSettings = { ...get().settings, ...newSettings };
    
    // Optimistically update frontend UI first for instant changes
    set({ settings: updatedSettings });

    if (token) {
      // Synchronize securely with backend
      const success = await DbService.saveSettings(updatedSettings, token);
      if (!success) {
        // If save failed, reload settings from API to revert UI to server state
        console.warn('System settings push failed, reverting local state.');
        await get().loadSettings();
        return false;
      }
    }
    return true;
  },

  triggerEmergencyStop: async (token) => {
    return get().updateSettings({
      emergencyStop: true,
      websiteStatus: 'OFF',
      deliveryPause: true,
      maintenanceMessage: "Mom's Magic order lines are currently locked down due to an emergency. We'll be back shortly! 🚨"
    }, token);
  },

  resetEmergencyStop: async (token) => {
    return get().updateSettings({
      emergencyStop: false,
      websiteStatus: 'ON',
      deliveryPause: false,
      maintenanceMessage: "Mom's Magic is temporarily closed. We'll reopen soon ❤️"
    }, token);
  }
}));
