import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface City {
  id: string;
  name: string;
  isActive: boolean;
}

export const CITIES: City[] = [
  { id: 'yellapur', name: 'Yellapur', isActive: true },
  { id: 'haliyal', name: 'Haliyal', isActive: false },
  { id: 'ankola', name: 'Ankola', isActive: false },
  { id: 'siddapur', name: 'Siddapur', isActive: false },
  { id: 'mundgod', name: 'Mundgod', isActive: false },
  { id: 'honnavar', name: 'Honnavar', isActive: false },
];

interface CityStore {
  selectedCity: City | null;
  setCity: (city: City) => void;
  resetCity: () => void;
}

export const useCityStore = create<CityStore>((set) => ({
  selectedCity: null,
  setCity: (city) => set({ selectedCity: city }),
  resetCity: () => set({ selectedCity: null }),
}));
