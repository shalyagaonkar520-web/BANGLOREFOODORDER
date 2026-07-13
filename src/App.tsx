import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { useEffect, Suspense, lazy, useState } from 'react';
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
const FeedbackPage = lazy(() => import('./components/FeedbackPage'));
const AboutFounder = lazy(() => import('./components/AboutFounder'));
const CelebrationHub = lazy(() => import('./components/CelebrationHub'));
const CelebrationDesign = lazy(() => import('./components/CelebrationDesign'));
const AdminPage = lazy(() => import('./components/AdminPage'));
const OrdersPage = lazy(() => import('./components/OrdersPage'));
const LuckyWheelPage = lazy(() => import('./components/LuckyWheelPage'));
const KitchenPage = lazy(() => import('./components/HotelDashboard'));
const SeedPage = lazy(() => import('./components/SeedPage'));
import RouteGuard from './components/RouteGuard';

// Store
import { useSystemStore } from './store/systemStore';
import { useMenuStore } from './store/menuStore';
import { useLocationStore } from './store/locationStore';

function BackgroundDecor() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background">
      <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
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
  const listenSettings = useSystemStore(state => state.listenSettings);
  const listenToMenu = useMenuStore(state => state.listenToMenu);
  const { deliveryLocation, openLocationPicker } = useLocationStore();

  useEffect(() => {
    if (!deliveryLocation) {
      openLocationPicker();
    }
  }, [deliveryLocation, openLocationPicker]);

  // Synchronize dynamic admin settings and menu on app initialization
  useEffect(() => {
    const unsubscribeSettings = listenSettings();
    const unsubscribeMenu = listenToMenu();
    return () => {
      unsubscribeSettings();
      unsubscribeMenu();
    };
  }, [listenSettings, listenToMenu]);

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
            } transition-all duration-300 max-w-md w-full bg-white/90 border border-zinc-100 shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-[24px] pointer-events-auto flex p-4 backdrop-blur-xl`}
          >
            <div className="flex-1 w-0">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img
                    className="h-10 w-10 rounded-full object-cover border border-zinc-100"
                    src={payload.notification?.image || '/logo.png'}
                    alt="Notification Icon"
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-zinc-900">
                    {payload.notification?.title || 'Order Update'}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500 font-medium">
                    {payload.notification?.body || 'You have a new notification.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-zinc-100 pl-3 ml-3 items-center">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="text-xs font-bold text-zinc-400 hover:text-brand transition-colors uppercase tracking-[1px]"
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

  // ── Offline / Reconnect Banner ───────────────────────────────────────────
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3500);
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return (
    <Router>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-surface-container-lowest)',
            color: 'var(--color-on-surface)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
            borderRadius: '16px',
            padding: '14px 20px',
            fontWeight: '500',
            fontFamily: 'var(--font-body-md)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: 'var(--color-tertiary)', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: 'var(--color-error)', secondary: '#fff' },
          },
        }}
      />
      <LocationPicker />
      <UndoManager />

      {/* ── Offline / Reconnect Banner ── */}
      <AnimatePresence>
        {(isOffline || showReconnected) && (
          <motion.div
            key={isOffline ? 'offline' : 'reconnected'}
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 py-3 px-4 text-[11px] font-black uppercase tracking-widest ${
              isOffline
                ? 'bg-red-500 text-white shadow-[0_4px_20px_rgba(239,68,68,0.4)]'
                : 'bg-emerald-500 text-white shadow-[0_4px_20px_rgba(52,211,153,0.4)]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-white/60 animate-pulse' : 'bg-white'}`} />
            {isOffline ? '⚠️ No Internet Connection — Some features may be unavailable' : '✅ Back Online!'}
          </motion.div>
        )}
      </AnimatePresence>
      
      <CityGateway>
        <MaintenanceGate>
          <OperatingHoursGate>
          <div className="min-h-screen bg-background text-on-background font-body-md relative flex flex-col">
            <BackgroundDecor />

            <main className="flex-1 relative z-10">
              <PageTransition>
                <Suspense fallback={
                  <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg animate-pulse">
                      <span className="text-2xl">🍽️</span>
                    </div>
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                }>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/food" element={<CategoryPage type="food" />} />
                    <Route path="/grocery" element={<CategoryPage type="grocery" />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/track/:orderId" element={<TrackingPage />} />
                    <Route path="/delivery" element={<RouteGuard allowedRoles={['admin', 'delivery_partner']}><DeliveryDashboard /></RouteGuard>} />
                    <Route path="/kitchen" element={<RouteGuard allowedRoles={['admin', 'kitchen_staff']}><KitchenPage /></RouteGuard>} />
                    <Route path="/bulk" element={<BulkOrderPage />} />
                    <Route path="/celebration" element={<CelebrationHub />} />
                    <Route path="/celebration/design" element={<CelebrationDesign />} />
                    <Route path="/feedback" element={<FeedbackPage />} />
                    <Route path="/about" element={<AboutFounder />} />
                    <Route path="/admin" element={<RouteGuard allowedRoles={['admin']}><AdminPage /></RouteGuard>} />
                    <Route path="/orders" element={<OrdersPage />} />
                    <Route path="/spin" element={<LuckyWheelPage />} />
                    <Route path="/seed" element={<SeedPage />} />
                  </Routes>
                </Suspense>
              </PageTransition>
            </main>

            <BottomCartBar />
            <BottomNav />
          </div>
        </OperatingHoursGate>
      </MaintenanceGate>
      </CityGateway>
    </Router>
  );
}
