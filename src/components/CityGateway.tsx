import React from 'react';
import { useCityStore, CITIES } from '../store/cityStore';
import { motion } from 'framer-motion';
import { MapPin, Navigation2, X, Sparkles, Locate, Lock } from 'lucide-react';
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
      <div className="fixed inset-0 z-[200] bg-matte-black flex items-center justify-center p-6 overflow-y-auto">
        {/* Ambient Luxury Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-brand/5 blur-[150px] rounded-full" />
          <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-gold/5 blur-[120px] rounded-full" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl luxury-card p-10 md:p-16 rounded-[50px] relative z-10"
        >
          <div className="text-center space-y-6 mb-16">
            <div className="w-24 h-24 bg-gold/10 rounded-[35px] flex items-center justify-center mx-auto text-gold border border-gold/20 shadow-2xl mb-8 rotate-12">
              <Navigation2 className="w-12 h-12" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
              Elite <br />
              <span className="text-luxury-gold drop-shadow-xl">Selection</span>
            </h1>
            <p className="text-white/60 font-bold uppercase tracking-[6px] text-[10px]">Select your delivery city</p>
          </div>

          <div className="mb-8">
            <button 
              onClick={handleAutoDetect}
              className="w-full py-6 rounded-[30px] border border-gold/30 bg-gold/5 flex items-center justify-center gap-4 group hover:bg-gold hover:text-matte-black transition-all"
            >
              <Locate className="w-6 h-6 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[4px]">Auto Detect My Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {CITIES.map((city) => (
              <button
                key={city.id}
                onClick={() => {
                  if (city.isActive) {
                    setCity(city);
                  } else {
                    toast.error(`Mom's Magic is currently only operating in Yellapur!`, { id: 'city-lock' });
                  }
                }}
                className={`p-8 rounded-[30px] border flex items-center justify-between transition-all group relative overflow-hidden ${
                  city.isActive 
                    ? 'border-gold/20 bg-white/5 hover:border-gold/40' 
                    : 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                }`}
              >
                <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/[0.02] transition-colors" />
                <div className="flex items-center gap-5 relative z-10">
                  <MapPin className={`w-7 h-7 ${city.isActive ? 'text-gold' : 'text-text-muted/30'}`} />
                  <span className={`font-black text-xl italic ${city.isActive ? 'text-white' : 'text-text-muted/50'}`}>
                    {city.name}
                  </span>
                </div>
                {city.isActive ? (
                  <Sparkles className="w-5 h-5 text-gold animate-pulse relative z-10" />
                ) : (
                  <Lock className="w-4 h-4 text-white/20 relative z-10" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!selectedCity.isActive) {
    return (
      <div className="fixed inset-0 z-[200] bg-matte-black flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg luxury-card p-12 md:p-16 rounded-[50px] relative z-10 text-center"
        >
          <button onClick={resetCity} className="absolute top-8 right-8 p-3 text-text-muted hover:text-white transition-colors">
            <X className="w-7 h-7" />
          </button>

          <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center mx-auto text-gold/20 border border-white/5 mb-10">
            <MapPin className="w-16 h-16" />
          </div>
          
          <h2 className="text-4xl font-black italic tracking-tighter mb-6 text-white uppercase leading-none">
            Coming to <br /><span className="text-luxury-gold">{selectedCity.name}</span>
          </h2>
          <p className="text-text-muted font-bold text-sm leading-relaxed mb-12 max-w-xs mx-auto uppercase tracking-widest opacity-60">
            We are curating an elite delivery network for your city.
          </p>

          <button 
            onClick={resetCity}
            className="w-full btn-luxury-red py-6"
          >
            Switch City
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
