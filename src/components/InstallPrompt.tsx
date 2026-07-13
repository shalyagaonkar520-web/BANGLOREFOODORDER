import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import toast from 'react-hot-toast';
import { useLocation } from 'react-router-dom';
import { trackPWAInstallation } from '../utils/pwaTracking';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Check if the app is already installed/running in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    // If running in standalone mode, trigger installation tracking immediately
    if (isStandalone) {
      trackPWAInstallation();
    } else {
      setIsVisible(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser from automatically showing prompt
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      console.log('PWA installation event fired');
      trackPWAInstallation();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Re-trigger visibility of the banner on any internal route transition if not in standalone mode
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (!isStandalone) {
      setIsVisible(true);
    }
  }, [location.pathname]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Hide banner
      setIsVisible(false);
      // Trigger native browser install dialog
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to PWA install prompt: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      // Trigger helpful guide toast if the browser event is not supported or throttled
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isiOS) {
        toast('To install: Tap the Safari Share button (📤) and select "Add to Home Screen" 📲', {
          duration: 6000,
          icon: '📱',
          style: {
            background: '#0B0E14',
            color: '#FFFFFF',
            border: '1px solid #4CD964',
            borderRadius: '20px',
          }
        });
      } else {
        toast('To install: Tap the browser menu (⋮) in the top-right corner and select "Install app" or "Add to Home Screen" 📲', {
          duration: 6000,
          icon: '📱',
          style: {
            background: '#0B0E14',
            color: '#FFFFFF',
            border: '1px solid #4CD964',
            borderRadius: '20px',
          }
        });
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:max-w-md z-[9999] pointer-events-auto"
      >
        <div className="bg-[#0B0E14] border border-[#4CD964]/20 shadow-[0_12px_45px_rgba(76,217,100,0.15)] rounded-[20px] p-4 flex items-center justify-between gap-4 backdrop-blur-[10px]">
          <div className="flex items-center gap-3">
            <div className="bg-[#4CD964]/10 p-2.5 rounded-xl border border-[#4CD964]/10 shrink-0">
              <span className="material-symbols-outlined w-5 h-5 text-[#4CD964] animate-bounce">download</span>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Add Mom's Magic to home screen</p>
              <p className="text-xs text-white/50">
                {deferredPrompt ? "Install our app for faster ordering" : "Tap menu & Add to Home Screen"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-br from-[#4CD964] to-[#3AC152] hover:brightness-105 active:scale-95 text-white font-bold text-xs uppercase tracking-[1px] px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(76,217,100,0.2)] whitespace-nowrap cursor-pointer"
            >
              {deferredPrompt ? "Install" : "How to Add"}
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/50 hover:text-white p-2 transition-colors rounded-xl hover:bg-white/5 cursor-pointer"
            >
              <span className="material-symbols-outlined w-4 h-4">close</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
