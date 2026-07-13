import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useLocationStore } from '../store/locationStore';
import { useNavigate, Link } from 'react-router-dom';
import { useSystemStore } from '../store/systemStore';
import { useAuthStore } from '../store/authStore';
import AuthModal from './AuthModal';
import { MapPin, ChevronDown, Bell, User } from 'lucide-react';

export default function Header() {
  const { deliveryLocation, openLocationPicker } = useLocationStore();
  const navigate = useNavigate();
  const settings = useSystemStore(state => state.settings);
  const { user, profile } = useAuthStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const isStoreOpen = () => {
    if (settings.websiteStatus === 'OFF' || settings.emergencyStop) return false;
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    const t = `${h}:${m}`;
    if (settings.openTime <= settings.closeTime) {
      return t >= settings.openTime && t <= settings.closeTime;
    }
    return t >= settings.openTime || t <= settings.closeTime;
  };

  const displayLocation = deliveryLocation?.address || "Yellapur, Karnataka";

  return (
    <>
      <header className="sticky top-0 z-[100] bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 py-4 flex items-center justify-between gap-3">

          {/* Left — Deliver To */}
          <button
            onClick={openLocationPicker}
            className="flex items-start gap-2 group outline-none text-left"
          >
            <MapPin className="text-primary w-5 h-5 shrink-0 group-hover:scale-110 transition-transform mt-0.5" />
            <div className="flex flex-col">
              <span className="text-label-sm text-secondary uppercase tracking-wider">
                Deliver to
              </span>
              <div className="flex items-center gap-1">
                <span className="text-body-lg font-headline-sm text-on-surface max-w-[160px] sm:max-w-[220px] truncate leading-tight">
                  {displayLocation}
                </span>
                <ChevronDown className="text-primary w-4 h-4 shrink-0" />
              </div>
            </div>
          </button>

          {/* Right — Actions */}
          <div className="flex items-center gap-2">
            {/* Desktop nav links */}
            <nav className="hidden md:flex items-center gap-6 mr-6">
              <Link to="/" className="text-body-md font-medium text-on-surface hover:text-primary transition-colors">Home</Link>
              <Link to="/food" className="text-body-md font-medium text-secondary hover:text-primary transition-colors">Food</Link>
              <Link to="/orders" className="text-body-md font-medium text-secondary hover:text-primary transition-colors">Orders</Link>
              <Link to="/profile#wallet" className="text-body-md font-medium text-secondary hover:text-primary transition-colors">Wallet</Link>
              <Link to="/support" className="text-body-md font-medium text-secondary hover:text-primary transition-colors">Support</Link>
            </nav>

            {/* Store Status dot */}
            <div className="hidden sm:flex items-center gap-1.5 bg-surface-container-low border border-outline-variant/50 px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 rounded-full ${isStoreOpen() ? 'bg-tertiary animate-pulse' : 'bg-error'}`} />
              <span className={`text-label-sm font-bold ${isStoreOpen() ? 'text-tertiary' : 'text-error'}`}>
                {isStoreOpen() ? 'Open' : 'Closed'}
              </span>
            </div>

            {/* Notification Bell */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              className="relative w-9 h-9 rounded-full bg-surface-container-low border border-outline-variant/50 flex items-center justify-center hover:border-primary transition-colors"
              onClick={() => navigate('/orders')}
            >
              <Bell className="text-gray-600 w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            </motion.button>

            {/* Profile / Auth */}
            {user ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/profile')}
                className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary text-xs font-bold shadow-md hover:bg-primary/90 transition-colors"
              >
                {profile?.name?.charAt(0)?.toUpperCase() || user.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1.5 bg-primary text-on-primary font-bold text-label-md px-4 py-2 rounded-xl shadow-md hover:bg-primary/90 transition-all"
              >
                <User className="w-4 h-4" />
                Login
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
}
