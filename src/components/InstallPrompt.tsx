import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

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

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show the install banner immediately
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the app is already installed/running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Hide our custom install UI
    setIsVisible(false);
    
    // Show the browser install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!isVisible || !deferredPrompt) return null;

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
              <Download className="w-5 h-5 text-[#4CD964] animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Add Mom's Magic to home screen</p>
              <p className="text-xs text-white/50">Install our app for faster ordering and instant tracking</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="bg-gradient-to-br from-[#4CD964] to-[#3AC152] hover:brightness-105 active:scale-95 text-white font-bold text-xs uppercase tracking-[1px] px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(76,217,100,0.2)] whitespace-nowrap"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/50 hover:text-white p-2 transition-colors rounded-xl hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
