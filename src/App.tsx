import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';

// Components
import LandingPage from './components/LandingPage';
import CategoryPage from './components/CategoryPage';
import CartPage from './components/CartPage';
import Checkout from './components/Checkout';
import OffersPage from './components/OffersPage';
import BulkOrderPage from './components/BulkOrderPage';
import BottomNav from './components/BottomNav';
import BottomCartBar from './components/BottomCartBar';
import OperatingHoursGate from './components/OperatingHoursGate';
import MaintenanceGate from './components/MaintenanceGate';
import CityGateway from './components/CityGateway';
import LocationPicker from './components/LocationPicker';
import UndoManager from './components/UndoManager';
import FeedbackPage from './components/FeedbackPage';
import AboutFounder from './components/AboutFounder';
import CelebrationHub from './components/CelebrationHub';
import CelebrationDesign from './components/CelebrationDesign';
import AdminPage from './components/AdminPage';

// Store
import { useSystemStore } from './store/systemStore';

function GoldenParticles() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {[...Array(25)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gold/30 rounded-full blur-[1px]"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: 0 
          }}
          animate={{ 
            y: [null, "-10%"],
            opacity: [0, 0.6, 0]
          }}
          transition={{ 
            duration: Math.random() * 8 + 8, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 15
          }}
        />
      ))}
      {/* Ambient Red Glow */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-brand/5 blur-[150px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gold/5 blur-[150px] rounded-full" />
    </div>
  );
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const loadSettings = useSystemStore(state => state.loadSettings);

  // Synchronize dynamic admin settings on app initialization and poll every 3s for real-time reflection
  useEffect(() => {
    loadSettings();
    const interval = setInterval(() => {
      loadSettings();
    }, 3000); // Poll every 3 seconds for instant reflection
    return () => clearInterval(interval);
  }, [loadSettings]);

  return (
    <Router>
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#1E1E1E',
            color: '#FAFAFA',
            border: '1px solid rgba(244, 180, 0, 0.2)',
            borderRadius: '20px',
            padding: '16px 24px',
            fontWeight: '600',
            backdropFilter: 'blur(10px)',
          }
        }}
      />
      <LocationPicker />
      <UndoManager />
      
      <MaintenanceGate>
        <OperatingHoursGate>
          <CityGateway>
              <div className="min-h-screen bg-matte-black text-text-main font-sans relative flex flex-col selection:bg-brand/30">
                <GoldenParticles />
    
              <main className="flex-1 relative z-10">
                <PageTransition>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/food" element={<CategoryPage type="food" />} />
                    <Route path="/grocery" element={<CategoryPage type="grocery" />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/offers" element={<OffersPage />} />
                    <Route path="/bulk" element={<BulkOrderPage />} />
                    <Route path="/celebration" element={<CelebrationHub />} />
                    <Route path="/celebration/design" element={<CelebrationDesign />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/about" element={<AboutFounder />} />
                    <Route path="/admin" element={<AdminPage />} />
                  </Routes>
                </PageTransition>
              </main>
  
              <BottomCartBar />
              <BottomNav />
            </div>
          </CityGateway>
        </OperatingHoursGate>
      </MaintenanceGate>
    </Router>
  );
}
