import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect, Suspense, lazy } from 'react';
import { requestForToken, onMessageListener } from './firebase';

// Components
const LandingPage = lazy(() => import('./components/LandingPage'));
const CategoryPage = lazy(() => import('./components/CategoryPage'));
const CartPage = lazy(() => import('./components/CartPage'));
const Checkout = lazy(() => import('./components/Checkout'));
const ProfilePage = lazy(() => import('./components/ProfilePage'));
const TrackingPage = lazy(() => import('./components/TrackingPage'));
const DeliveryDashboard = lazy(() => import('./components/DeliveryDashboard'));
const BulkOrderPage = lazy(() => import('./components/BulkOrderPage'));
import BottomNav from './components/BottomNav';
import BottomCartBar from './components/BottomCartBar';
import OperatingHoursGate from './components/OperatingHoursGate';
import MaintenanceGate from './components/MaintenanceGate';
import CityGateway from './components/CityGateway';
import LocationPicker from './components/LocationPicker';
import UndoManager from './components/UndoManager';
import InstallPrompt from './components/InstallPrompt';
const FeedbackPage = lazy(() => import('./components/FeedbackPage'));
const AboutFounder = lazy(() => import('./components/AboutFounder'));
const CelebrationHub = lazy(() => import('./components/CelebrationHub'));
const CelebrationDesign = lazy(() => import('./components/CelebrationDesign'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const BarMenuPage = lazy(() => import('./components/BarMenuPage'));
const OrdersPage = lazy(() => import('./components/OrdersPage'));

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

  // Request notification permissions, register service worker, and setup foreground listener on mount
  useEffect(() => {
    // Request permission & save token to Firestore
    requestForToken();

    // Listen for foreground push notifications
    const unsubscribe = onMessageListener((payload) => {
      console.log('Foreground FCM notification received:', payload);
      
      // Render premium Swish-themed notification Toast matching app styles
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
            } transition-all duration-300 max-w-md w-full bg-[#0B0E14] border border-[#4CD964]/20 shadow-[0_12px_45px_rgba(76,217,100,0.15)] rounded-[20px] pointer-events-auto flex p-4 backdrop-blur-[10px]`}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img
                    className="h-10 w-10 rounded-full object-cover border border-[#4CD964]/20"
                    src={payload.notification?.image || '/logo.png'}
                    alt="Notification Icon"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-[#4CD964]">
                    {payload.notification?.title || 'Order Update'}
                  </p>
                  <p className="mt-1 text-xs text-white/80 font-medium">
                    {payload.notification?.body || 'You have a new notification.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-[#4CD964]/10 pl-3 ml-3 items-center">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-xs font-bold text-text-muted hover:text-[#4CD964] transition-colors uppercase tracking-[1px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

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
      <InstallPrompt />
      
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
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/track/:orderId" element={<TrackingPage />} />
                    <Route path="/delivery" element={<DeliveryDashboard />} />
                    <Route path="/bulk" element={<BulkOrderPage />} />
                    <Route path="/celebration" element={<CelebrationHub />} />
                    <Route path="/celebration/design" element={<CelebrationDesign />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/about" element={<AboutFounder />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/bar-menu" element={<BarMenuPage />} />
                    <Route path="/orders" element={<OrdersPage />} />
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
