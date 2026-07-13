import React from 'react';
import { useCityStore, CITIES } from '../store/cityStore';
import { motion } from 'framer-motion';
import { useLocationStore } from '../store/locationStore';
import toast from 'react-hot-toast';

export default function CityGateway({ children }: { children: React.ReactNode }) {
  const { selectedCity, setCity, resetCity } = useCityStore();
  const { detectLocation } = useLocationStore();

  const handleAutoDetect = async () => {
    try {
      toast.loading('Tracing your coordinates...', { id: 'loc-detect' });
      await detectLocation();
      
      // Auto-select the first active city if detection works
      const defaultCity = CITIES.find(c => c.isActive);
      if (defaultCity) {
        setCity(defaultCity);
        toast.success(`Welcome! Located in ${defaultCity.name}`, { id: 'loc-detect' });
      } else {
        toast.success('Location detected!', { id: 'loc-detect' });
      }
    } catch (err) {
      toast.error('Could not detect location. Please select manually.', { id: 'loc-detect' });
    }
  };

  if (!selectedCity) {
    return (
      <div className="fixed inset-0 z-[200] flex flex-col items-center p-6 sm:p-10 min-h-screen bg-background text-on-background overflow-y-auto">
        <header className="w-full max-w-md text-center mb-10 mt-4">
          <h1 className="text-5xl font-headline-lg tracking-tighter text-primary uppercase mb-2">
            SELECTION
          </h1>
          <p className="text-[10px] tracking-[0.3em] font-bold text-secondary uppercase">
            Select Your Delivery City
          </p>
        </header>

        <main className="w-full max-w-md space-y-4">
          <button 
            onClick={handleAutoDetect}
            className="w-full flex items-center justify-center gap-4 py-5 px-6 rounded-[40px] border border-primary bg-transparent hover:bg-primary/10 transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[24px] text-primary">my_location</span>
            <span className="text-[12px] font-bold tracking-[0.2em] uppercase text-on-background">
              Auto Detect My Location
            </span>
          </button>
          
          <div className="h-4"></div>

          {CITIES.map((city) => (
            <button
              key={city.id}
              onClick={() => setCity(city)}
              className={`w-full flex items-center py-6 px-8 rounded-[40px] transition-colors ${
                city.isActive 
                  ? 'justify-between border-2 border-primary bg-surface shadow-md' 
                  : 'border border-outline-variant/30 bg-surface-container-low hover:bg-surface-container opacity-40'
              }`}
            >
              <div className="flex items-center gap-5">
                <span className={`material-symbols-outlined text-[28px] ${city.isActive ? 'text-primary' : 'text-on-background'}`}>location_city</span>
                <span className={`text-2xl font-headline-lg ${city.isActive ? 'text-on-surface' : 'text-secondary'}`}>
                  {city.name}
                </span>
              </div>
              {city.isActive && (
                <span className="material-symbols-outlined text-[24px] text-primary opacity-80">arrow_forward</span>
              )}
            </button>
          ))}
        </main>

        <footer className="mt-auto w-full max-w-md pt-8 opacity-20 pointer-events-none">
          <div className="flex justify-around border-t border-outline-variant/30 py-4">
            <div className="w-6 h-6 bg-outline-variant/50 rounded-full"></div>
            <div className="w-6 h-6 bg-outline-variant/50 rounded-full"></div>
            <div className="w-12 h-12 bg-outline-variant/50 rounded-full -mt-4"></div>
            <div className="w-6 h-6 bg-outline-variant/50 rounded-full"></div>
            <div className="w-6 h-6 bg-outline-variant/50 rounded-full"></div>
          </div>
        </footer>
      </div>
    );
  }

  if (!selectedCity.isActive) {
    return (
      <div className="fixed inset-0 z-[200] bg-scrim flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg bg-surface p-12 md:p-16 rounded-[50px] relative z-10 text-center shadow-2xl border border-outline-variant/30"
        >
          <button onClick={resetCity} className="absolute top-8 right-8 p-3 text-secondary hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-[28px]">close</span>
          </button>

          <div className="w-32 h-32 bg-primary/5 rounded-[40px] flex items-center justify-center mx-auto text-primary/20 border border-primary/10 mb-10">
            <span className="material-symbols-outlined text-[64px]">location_on</span>
          </div>
          
          <h2 className="text-4xl font-headline-lg tracking-tighter mb-6 text-on-surface uppercase leading-none">
            Coming to <br /><span className="text-primary">{selectedCity.name}</span>
          </h2>
          <p className="text-secondary font-bold text-sm leading-relaxed mb-12 max-w-xs mx-auto uppercase tracking-widest opacity-80">
            We are curating an elite delivery network for your city.
          </p>

          <button 
            onClick={resetCity}
            className="w-full bg-primary text-on-primary py-6 rounded-[24px] font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition-colors shadow-md"
          >
            Switch City
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
