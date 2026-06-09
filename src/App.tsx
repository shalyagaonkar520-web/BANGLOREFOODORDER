import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { useEffect, Suspense, lazy } from 'react';

// Components
const LandingPage = lazy(() => import('./components/LandingPage'));
const CategoryPage = lazy(() => import('./components/CategoryPage'));
const CartPage = lazy(() => import('./components/CartPage'));
const Checkout = lazy(() => import('./components/Checkout'));
const OffersPage = lazy(() => import('./components/OffersPage'));
const BulkOrderPage = lazy(() => import('./components/BulkOrderPage'));
import BottomNav from './components/BottomNav';
import BottomCartBar from './components/BottomCartBar';
import OperatingHoursGate from './components/OperatingHoursGate';
import MaintenanceGate from './components/MaintenanceGate';
import CityGateway from './components/CityGateway';
import LocationPicker from './components/LocationPicker';
import UndoManager from './components/UndoManager';
const FeedbackPage = lazy(() => import('./components/FeedbackPage'));
const AboutFounder = lazy(() => import('./components/AboutFounder'));
const CelebrationHub = lazy(() => import('./components/CelebrationHub'));
const CelebrationDesign = lazy(() => import('./components/CelebrationDesign'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const BarMenuPage = lazy(() => import('./components/BarMenuPage'));

// Store
import { useSystemStore } from './store/systemStore';

function GoldenParticles() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <div className="hidden md:block">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 bg-[#4CD964]/20 rounded-full blur-[0.5px]"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: 0 
            }}
            animate={{ 
              y: [null, "-10%"],
              opacity: [0, 0.4, 0]
            }}
            transition={{ 
              duration: Math.random() * 8 + 8, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 15
            }}
          />
        ))}
      </div>
      {/* Pizza and Biryani Watermark Mix Background */}
      <div className="absolute top-[10%] right-[-100px] w-96 h-96 rounded-full overflow-hidden opacity-[0.025] rotate-12 shrink-0 hidden md:block">
        <img src="https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80" className="w-full h-full object-cover" alt="Biryani" />
      </div>
      <div className="absolute bottom-[10%] left-[-100px] w-[450px] h-[450px] rounded-full overflow-hidden opacity-[0.025] -rotate-12 shrink-0 hidden md:block">
        <img src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80" className="w-full h-full object-cover" alt="Pizza" />
      </div>

      {/* Ambient Brand Glow */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-[#4CD964]/5 blur-[80px] md:blur-[150px] rounded-full" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-[#4CD964]/5 blur-[80px] md:blur-[150px] rounded-full" />
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
          <div className="min-h-screen bg-matte-black text-text-main font-sans relative flex flex-col selection:bg-brand/30">
            <GoldenParticles />

            <main className="flex-1 relative z-10">
              <PageTransition>
                <Suspense fallback={
                  <div className="min-h-screen flex items-center justify-center bg-matte-black text-brand">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-brand"></div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/food" element={<CategoryPage type="food" />} />
                    <Route path="/grocery" element={<CategoryPage type="grocery" />} />
                    <Route path="/cart" element={<Navigate to="/checkout" replace />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/offers" element={<OffersPage />} />
                    <Route path="/bulk" element={<BulkOrderPage />} />
                    <Route path="/celebration" element={<CelebrationHub />} />
                    <Route path="/celebration/design" element={<CelebrationDesign />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/about" element={<AboutFounder />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/bar-menu" element={<BarMenuPage />} />
                  </Routes>
                </Suspense>
              </PageTransition>
            </main>

            <BottomCartBar />
            <BottomNav />
          </div>
        </OperatingHoursGate>
      </MaintenanceGate>
    </Router>
  );
}
