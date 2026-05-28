import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Power, ShieldAlert, Clock, Save, Phone, Bell, Loader2, 
  Lock, AlertCircle, Calendar, TrendingUp, LogOut, Sliders, 
  Sparkles, CheckCircle2, ChevronRight, Activity, Moon, Sun, Laptop
} from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import { useSystemStore } from '../store/systemStore';
import toast from 'react-hot-toast';

// Define simulated live orders to populate feed
const MOCK_LIVE_ORDERS = [
  { id: 'MM-4029', name: 'Shalya Gaonkar', items: '2x Donne Biryani, 1x Kiwi Cake', total: 640, time: 'Just now', status: 'Pending' },
  { id: 'MM-4028', name: 'Akshata N.', items: '1x Kaju Masala, 2x Butter Kulcha', total: 320, time: '3 mins ago', status: 'Preparing' },
  { id: 'MM-4027', name: 'Rohit Shenoy', items: '1x Blue Curacao, 1x Classic Mojito', total: 460, time: '10 mins ago', status: 'Ready' },
  { id: 'MM-4026', name: 'Priya K.', items: '1x Triple Schezwan Rice, 1x Gobi Manchurian', total: 420, time: '18 mins ago', status: 'Delivered' }
];

export default function AdminPage() {
  const { user, setUser, logout } = useAdminStore();
  const { settings, isLoading, loadSettings, updateSettings, triggerEmergencyStop, resetEmergencyStop } = useSystemStore();

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Form local editing states (to prevent lag during typing, saved to store on Save)
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [isSaving, setIsSaving] = useState(false);
  const [liveOrders, setLiveOrders] = useState(MOCK_LIVE_ORDERS);

  // Daily Schedule state (Mock database schema details)
  const [schedule, setSchedule] = useState({
    Monday: { open: '12:30', close: '22:30', closed: false },
    Tuesday: { open: '12:30', close: '22:30', closed: false },
    Wednesday: { open: '12:30', close: '22:30', closed: false },
    Thursday: { open: '12:30', close: '22:30', closed: false },
    Friday: { open: '12:30', close: '23:00', closed: false },
    Saturday: { open: '11:00', close: '23:30', closed: false },
    Sunday: { open: '11:00', close: '22:30', closed: false }
  });

  // Fetch settings when admin logs in
  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  // Sync local editing states with store changes
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  // Simulated live feed additions
  useEffect(() => {
    if (!user || settings.websiteStatus === 'OFF') return;
    const interval = setInterval(() => {
      const names = ['Vivek Bhat', 'Sneha M.', 'Girish R.', 'Kavya Hegde', 'Prasanna P.'];
      const items = ['1x Black Forest Cake', '2x Chapati, 1x Dal Tadka', '1x Paneer Chilli, 1x Veg Noodles', '2x Donne Biryani', '1x Strawberry Mojito'];
      const price = [230, 290, 310, 410, 220];
      const newOrder = {
        id: `MM-${Math.floor(Math.random() * 900) + 4100}`,
        name: names[Math.floor(Math.random() * names.length)],
        items: items[Math.floor(Math.random() * items.length)],
        total: price[Math.floor(Math.random() * price.length)],
        time: 'Just now',
        status: 'Pending'
      };
      setLiveOrders(prev => [newOrder, ...prev.slice(0, 4)]);
      toast.success(`New order received: ${newOrder.id}! 📦`, { duration: 2500 });
    }, 45000); // add simulated orders periodically

    return () => clearInterval(interval);
  }, [user, settings.websiteStatus]);

  // Handle Authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser(data.user);
        // Save mock JWT token in localStorage for DB headers
        localStorage.setItem('moms_magic_admin_token', data.token);
        toast.success(`Welcome back, ${data.user.name}!`);
      } else {
        toast.error(data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      toast.error('Network error during authentication');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Secure Settings Save Handler
  const handleSaveSettings = async (updates: Partial<typeof settings> = {}) => {
    setIsSaving(true);
    const token = localStorage.getItem('moms_magic_admin_token') || 'mock-jwt-admin-token-123456';
    
    // Combine edits
    const activeUpdates = { ...localSettings, ...updates };
    
    const success = await updateSettings(activeUpdates, token);
    setIsSaving(false);
    if (success) {
      toast.success('System settings saved successfully!');
    } else {
      toast.error('Failed to save settings. Please try again.');
    }
  };

  // Toggling operational shortcuts directly
  const handleToggleState = async (key: keyof typeof settings, value: any) => {
    const token = localStorage.getItem('moms_magic_admin_token') || 'mock-jwt-admin-token-123456';
    
    // UI optimistic update first
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    const success = await updateSettings({ [key]: value }, token);
    
    if (success) {
      toast.success(`${key.replace(/([A-Z])/g, ' $1')} updated!`);
    } else {
      toast.error('Sync failed.');
    }
  };

  // Emergency lockdown trigger
  const handleEmergencyTrigger = async () => {
    const token = localStorage.getItem('moms_magic_admin_token') || 'mock-jwt-admin-token-123456';
    const success = await triggerEmergencyStop(token);
    if (success) {
      toast.error('SYSTEM SHUTDOWN ACTIVATED! All ordering pipelines locked.', { icon: '🚨', duration: 4000 });
    }
  };

  // Emergency lockdown reset
  const handleEmergencyReset = async () => {
    const token = localStorage.getItem('moms_magic_admin_token') || 'mock-jwt-admin-token-123456';
    const success = await resetEmergencyStop(token);
    if (success) {
      toast.success('System restored. Ordering channels online.', { icon: '✅' });
    }
  };

  // Determine global live status details
  const getLiveStatus = () => {
    if (settings.emergencyStop) return { text: 'Emergency Stop Active', color: 'bg-red-500 shadow-red-500/50', border: 'border-red-500/20' };
    if (settings.websiteStatus === 'OFF') return { text: 'Website Offline', color: 'bg-orange-500 shadow-orange-500/50', border: 'border-orange-500/20' };
    if (settings.festivalMode) return { text: 'Festival Mode Active', color: 'bg-purple-500 shadow-purple-500/50', border: 'border-purple-500/20' };
    if (settings.deliveryPause) return { text: 'Delivery Paused', color: 'bg-amber-500 shadow-amber-500/50', border: 'border-amber-500/20' };
    return { text: 'Accepting Orders', color: 'bg-emerald-500 shadow-emerald-500/50', border: 'border-emerald-500/20' };
  };

  const statusInfo = getLiveStatus();

  // Format local dates nicely
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    } catch (e) {
      return dateStr;
    }
  };

  // RENDER LOGIN GATE IF NOT LOGGED IN
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0B0E14] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Glow Spheres */}
        <div className="absolute top-[-30%] right-[-10%] w-[70%] h-[70%] bg-[#FF4D00]/10 rounded-full blur-[250px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-[-30%] left-[-10%] w-[60%] h-[60%] bg-[#FFB700]/10 rounded-full blur-[250px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          {/* Brand Logo & Name */}
          <div className="text-center mb-10 space-y-4">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-[#FF4D00] to-[#FFB700] opacity-20 blur-md" />
              <div className="w-18 h-18 rounded-[24px] bg-gradient-to-br from-[#FF4D00] to-[#FFB700] flex items-center justify-center border border-white/10 shadow-2xl relative rotate-6">
                <Lock className="w-8 h-8 text-matte-black" />
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                Moms <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] to-[#FFB700]">Magic</span>
              </h1>
              <p className="text-white/40 text-[9px] font-black uppercase tracking-[4px]">Secure Admin Portal</p>
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-[#121620]/80 backdrop-blur-2xl border border-white/5 rounded-[35px] p-8 shadow-[0_30px_60px_rgba(0,0,0,0.6)] space-y-8">
            <div className="space-y-2 border-b border-white/5 pb-5">
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#FFB700]" /> Sign In Required
              </h2>
              <p className="text-white/40 text-xs font-semibold leading-relaxed">Access is restricted to verified restaurant operators.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#FFB700]/60 uppercase tracking-[3px] ml-1">Operator Email</label>
                <input 
                  required
                  type="email" 
                  placeholder="name@momsmagic.com" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-6 py-4.5 bg-white/5 rounded-2xl border border-white/10 focus:border-[#FFB700]/30 outline-none font-bold text-sm text-white transition-all placeholder:text-white/15"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-[#FFB700]/60 uppercase tracking-[3px] ml-1">Security Key</label>
                <input 
                  required
                  type="password" 
                  placeholder="••••••••••••" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-6 py-4.5 bg-white/5 rounded-2xl border border-white/10 focus:border-[#FFB700]/30 outline-none font-bold text-sm text-white transition-all placeholder:text-white/15"
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isLoggingIn}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-[#FF4D00] to-[#FFB700] text-matte-black font-black text-xs uppercase tracking-[3px] shadow-lg shadow-[#FF4D00]/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-matte-black" />
                    Verifying Identity...
                  </>
                ) : (
                  <>
                    Verify & Unlock
                    <ChevronRight className="w-4 h-4 text-matte-black" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest">Authorized Operations Only</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // MAIN ADMIN CONTROL INTERFACE
  return (
    <div className="min-h-screen bg-[#0B0E14] text-white font-sans pb-32 relative">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#161B2A]/40 to-transparent pointer-events-none" />
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-[#FF4D00]/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[50%] h-[50%] bg-[#FFB700]/5 rounded-full blur-[200px] pointer-events-none" />

      {/* Header Container */}
      <header className="sticky top-0 z-[50] bg-[#0F121C]/90 backdrop-blur-2xl border-b border-white/5 py-5 px-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#FF4D00] to-[#FFB700] flex items-center justify-center border border-white/10 shadow-lg shrink-0">
              <Sliders className="w-6 h-6 text-matte-black" />
            </div>
            <div>
              <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] to-[#FFB700]">Desk</span>
              </h1>
              <p className="text-white/40 text-[8px] font-black uppercase tracking-[3px] mt-1">Moms Magic Operator Portal</p>
            </div>
          </div>

          {/* Quick Stats Panel & Profile */}
          <div className="flex items-center gap-4">
            {/* Live Indicator */}
            <div className={`hidden sm:flex items-center gap-2.5 px-4 py-2 bg-white/5 border ${statusInfo.border} rounded-full text-[9px] font-black uppercase tracking-wider`}>
              <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.color} animate-pulse`} />
              {statusInfo.text}
            </div>

            {/* Logout Button */}
            <div className="flex items-center gap-3 bg-white/5 rounded-2xl p-1.5 border border-white/5">
              <div className="px-3.5 py-1.5 text-left hidden md:block">
                <p className="text-xs font-black uppercase tracking-wider leading-none text-white">{user.name}</p>
                <p className="text-[8px] font-bold text-white/30 tracking-widest mt-1 uppercase">Super Admin</p>
              </div>
              <button 
                onClick={() => {
                  logout();
                  localStorage.removeItem('moms_magic_admin_token');
                  toast.success('Logged out successfully');
                }}
                className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-all border border-red-500/15"
                title="Logout Operator Session"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="max-w-[1400px] mx-auto p-6 md:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        
        {/* LEFT COLUMN: PRIMARY TOGGLES & CORE CONTROLS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Live Status Indicators Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* Status card 1 */}
            <div className="bg-[#121624] border border-white/5 rounded-3xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none">Accepting Orders</p>
                <p className="text-2xl font-black italic tracking-tighter mt-1 text-white uppercase">{settings.websiteStatus}</p>
              </div>
            </div>

            {/* Status card 2 */}
            <div className="bg-[#121624] border border-white/5 rounded-3xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none">Emergency Stop</p>
                <p className="text-2xl font-black italic tracking-tighter mt-1 text-white uppercase">{settings.emergencyStop ? 'ACTIVE' : 'INACTIVE'}</p>
              </div>
            </div>

            {/* Status card 3 */}
            <div className="bg-[#121624] border border-white/5 rounded-3xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />
              <Calendar className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none">Festival Mode</p>
                <p className="text-2xl font-black italic tracking-tighter mt-1 text-white uppercase">{settings.festivalMode ? 'ON' : 'OFF'}</p>
              </div>
            </div>

            {/* Status card 4 */}
            <div className="bg-[#121624] border border-white/5 rounded-3xl p-5 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest leading-none">Schedule Window</p>
                <p className="text-base font-black italic tracking-tighter mt-1 text-white uppercase">{settings.openTime} - {settings.closeTime}</p>
              </div>
            </div>

          </div>

          {/* PRIMARY SWITCHES PANEL */}
          <div className="bg-[#121620]/50 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10 space-y-8 relative">
            <div className="flex items-center justify-between border-b border-white/5 pb-5">
              <div>
                <h3 className="text-xl font-black italic uppercase tracking-tight">Core System Switches</h3>
                <p className="text-white/40 text-[9px] font-semibold tracking-wider mt-1">Changes propagate instantly to all user sessions</p>
              </div>
              <Sparkles className="w-6 h-6 text-[#FFB700] animate-pulse" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* TOGGLE 1: Website Status ON/OFF */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex flex-col justify-between gap-6 transition-all hover:bg-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white tracking-tight">Website Ordering</h4>
                    <p className="text-white/40 text-[10px] font-semibold max-w-[200px]">Instantly toggle website ordering status online/offline.</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-white/5 ${settings.websiteStatus === 'ON' ? 'text-emerald-400 bg-emerald-500/10' : 'text-white/30'}`}>
                    <Power className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${settings.websiteStatus === 'ON' ? 'text-emerald-400' : 'text-white/30'}`}>
                    Status: {settings.websiteStatus === 'ON' ? 'Online' : 'Offline'}
                  </span>
                  
                  {/* Large Toggle Custom */}
                  <button 
                    onClick={() => handleToggleState('websiteStatus', settings.websiteStatus === 'ON' ? 'OFF' : 'ON')}
                    className={`w-16 h-9 rounded-full p-1 transition-colors duration-300 outline-none shrink-0 ${settings.websiteStatus === 'ON' ? 'bg-emerald-500' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      layout
                      className="w-7 h-7 rounded-full bg-matte-black shadow-lg"
                      animate={{ x: settings.websiteStatus === 'ON' ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* TOGGLE 2: Delivery Pause Mode */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex flex-col justify-between gap-6 transition-all hover:bg-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white tracking-tight">Delivery Pause</h4>
                    <p className="text-white/40 text-[10px] font-semibold max-w-[200px]">Temporarily stop new delivery orders without taking menu offline.</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-white/5 ${settings.deliveryPause ? 'text-amber-400 bg-amber-500/10' : 'text-white/30'}`}>
                    <Clock className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${settings.deliveryPause ? 'text-amber-400' : 'text-white/30'}`}>
                    Status: {settings.deliveryPause ? 'Paused' : 'Active'}
                  </span>
                  
                  {/* Toggle */}
                  <button 
                    onClick={() => handleToggleState('deliveryPause', !settings.deliveryPause)}
                    className={`w-16 h-9 rounded-full p-1 transition-colors duration-300 outline-none shrink-0 ${settings.deliveryPause ? 'bg-amber-500' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      layout
                      className="w-7 h-7 rounded-full bg-matte-black shadow-lg"
                      animate={{ x: settings.deliveryPause ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* TOGGLE 3: Festival Closure Mode */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex flex-col justify-between gap-6 transition-all hover:bg-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white tracking-tight">Festival Closure Mode</h4>
                    <p className="text-white/40 text-[10px] font-semibold max-w-[200px]">Declare holiday/festival closures with unique theme & announcements.</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-white/5 ${settings.festivalMode ? 'text-purple-400 bg-purple-500/10' : 'text-white/30'}`}>
                    <Calendar className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${settings.festivalMode ? 'text-purple-400' : 'text-white/30'}`}>
                    Status: {settings.festivalMode ? 'Holiday Mode' : 'Normal'}
                  </span>
                  
                  {/* Toggle */}
                  <button 
                    onClick={() => handleToggleState('festivalMode', !settings.festivalMode)}
                    className={`w-16 h-9 rounded-full p-1 transition-colors duration-300 outline-none shrink-0 ${settings.festivalMode ? 'bg-purple-500' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      layout
                      className="w-7 h-7 rounded-full bg-matte-black shadow-lg"
                      animate={{ x: settings.festivalMode ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

              {/* TOGGLE 4: WhatsApp Notification Toggles */}
              <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex flex-col justify-between gap-6 transition-all hover:bg-white/[0.04]">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-white tracking-tight">WhatsApp Alerts</h4>
                    <p className="text-white/40 text-[10px] font-semibold max-w-[200px]">Send structured receipt details automatically on checkout submission.</p>
                  </div>
                  <div className={`p-3 rounded-2xl bg-white/5 ${settings.whatsappAlertsEnabled ? 'text-[#25D366] bg-[#25D366]/10' : 'text-white/30'}`}>
                    <Bell className="w-6 h-6" />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 pt-4 border-t border-white/5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${settings.whatsappAlertsEnabled ? 'text-[#25D366]' : 'text-white/30'}`}>
                    Status: {settings.whatsappAlertsEnabled ? 'Alerting ON' : 'Alerting OFF'}
                  </span>
                  
                  {/* Toggle */}
                  <button 
                    onClick={() => handleToggleState('whatsappAlertsEnabled', !settings.whatsappAlertsEnabled)}
                    className={`w-16 h-9 rounded-full p-1 transition-colors duration-300 outline-none shrink-0 ${settings.whatsappAlertsEnabled ? 'bg-[#25D366]' : 'bg-white/10'}`}
                  >
                    <motion.div 
                      layout
                      className="w-7 h-7 rounded-full bg-matte-black shadow-lg"
                      animate={{ x: settings.whatsappAlertsEnabled ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
              </div>

            </div>

            {/* EMERGENCY LOCKDOWN BUTTON */}
            <div className="border-t border-white/5 pt-8">
              <div className="bg-red-500/5 border border-red-500/20 rounded-[30px] p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black italic uppercase text-red-400 tracking-tight">🚨 Emergency “Stop All Orders”</h4>
                    <p className="text-white/40 text-xs font-semibold max-w-lg leading-relaxed">
                      locks the entire food checkout interface, clears the operational statuses, and redirects all active sessions to the emergency banner. Use in case of chef shortage, power cuts, or weather lockdowns.
                    </p>
                  </div>
                </div>
                <div>
                  {settings.emergencyStop ? (
                    <button 
                      onClick={handleEmergencyReset}
                      className="px-8 h-14 rounded-2xl bg-white text-matte-black font-black text-xs uppercase tracking-[2px] shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" /> Reset Operations
                    </button>
                  ) : (
                    <button 
                      onClick={handleEmergencyTrigger}
                      className="px-8 h-14 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-[2px] shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4 animate-bounce" /> STOP ALL ORDERS
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* TIMINGS & OPERATIONAL CONTROLS */}
          <div className="bg-[#121620]/50 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10 space-y-8">
            <h3 className="text-xl font-black italic uppercase tracking-tight border-b border-white/5 pb-5">Operating Schedule & Limits</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Daily opening and closing hours selector */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-[#FFB700] uppercase tracking-[3px] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FFB700]" /> Working Hour Bounds
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">Opening Time</label>
                    <input 
                      type="time" 
                      value={localSettings.openTime}
                      onChange={e => setLocalSettings({ ...localSettings, openTime: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-[#FFB700]/30 transition-all text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">Closing Time</label>
                    <input 
                      type="time" 
                      value={localSettings.closeTime}
                      onChange={e => setLocalSettings({ ...localSettings, closeTime: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-[#FFB700]/30 transition-all text-center"
                    />
                  </div>
                </div>
                <p className="text-white/30 text-[10px] font-medium leading-relaxed italic">
                  Ordering pipelines will lock down automatically outside these limits.
                </p>
              </div>

              {/* Order limit & WhatsApp configs */}
              <div className="space-y-6">
                <h4 className="text-xs font-black text-[#FFB700] uppercase tracking-[3px] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#FFB700]" /> Capacity & Alert Config
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">Order Limit / Hr</label>
                    <input 
                      type="number" 
                      min="5"
                      max="500"
                      value={localSettings.orderLimit}
                      onChange={e => setLocalSettings({ ...localSettings, orderLimit: parseInt(e.target.value) || 50 })}
                      className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-[#FFB700]/30 transition-all text-center"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">Alert Phone No.</label>
                    <input 
                      type="text" 
                      placeholder="+91..."
                      value={localSettings.whatsappNumber}
                      onChange={e => setLocalSettings({ ...localSettings, whatsappNumber: e.target.value })}
                      className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-[#FFB700]/30 transition-all text-center placeholder:text-white/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SAVE BUTTON FOR CONTROLS */}
            <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-4">
              <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Save changes to commit updates
              </span>
              <button 
                onClick={() => handleSaveSettings()}
                disabled={isSaving}
                className="px-10 h-14 rounded-2xl bg-white text-matte-black font-black text-xs uppercase tracking-[2px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-matte-black" /> : <Save className="w-4 h-4 text-matte-black" />}
                Commit Schedule Changes
              </button>
            </div>
          </div>

          {/* MON-SUN SCHEDULER BOARD */}
          <div className="bg-[#121620]/50 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 md:p-10 space-y-8">
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight">Weekly Timing Calendar</h3>
              <p className="text-white/40 text-[9px] font-semibold tracking-wider mt-1">Configure individual working parameters per calendar day</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(schedule).map(([day, details]) => (
                <div key={day} className={`border rounded-3xl p-5 space-y-4 transition-all relative ${details.closed ? 'bg-red-500/5 border-red-500/10' : 'bg-white/[0.02] border-white/5'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider">{day.slice(0, 3)}</span>
                    <button 
                      onClick={() => {
                        setSchedule(prev => ({
                          ...prev,
                          [day]: { ...details, closed: !details.closed }
                        }));
                        toast.success(`${day} updated!`);
                      }}
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all ${details.closed ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}
                    >
                      {details.closed ? 'Closed' : 'Active'}
                    </button>
                  </div>
                  
                  {!details.closed && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] font-bold text-white/30 uppercase block mb-1">Open</span>
                        <span className="text-xs font-black bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 text-white block text-center">{details.open}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-bold text-white/30 uppercase block mb-1">Close</span>
                        <span className="text-xs font-black bg-white/5 rounded-lg px-2.5 py-1.5 border border-white/5 text-white block text-center">{details.close}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MESSAGING EDITORS & LIVE FEED SIMULATOR */}
        <div className="space-y-8">
          
          {/* ANNOUNCEMENT MESSAGE EDITORS */}
          <div className="bg-[#121620]/50 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 space-y-6">
            <h3 className="text-lg font-black italic uppercase tracking-tight border-b border-white/5 pb-4">Operator Messages</h3>

            {/* Maintenance Message */}
            <div className="space-y-2.5">
              <label className="text-[9px] font-black text-[#FFB700]/60 uppercase tracking-[3px] ml-1">Custom Maintenance Announcement</label>
              <textarea 
                rows={3} 
                value={localSettings.maintenanceMessage}
                onChange={e => setLocalSettings({ ...localSettings, maintenanceMessage: e.target.value })}
                className="w-full px-6 py-4.5 bg-white/5 rounded-2xl border border-white/10 text-white font-semibold text-sm outline-none focus:border-[#FFB700]/30 transition-all placeholder:text-white/10"
                placeholder="Message users will see during maintenance..."
              />
            </div>

            {/* Reopening Time message */}
            <div className="space-y-2.5">
              <label className="text-[9px] font-black text-[#FFB700]/60 uppercase tracking-[3px] ml-1">Display Reopening / Return Message</label>
              <textarea 
                rows={2} 
                value={localSettings.reopenMessage}
                onChange={e => setLocalSettings({ ...localSettings, reopenMessage: e.target.value })}
                className="w-full px-6 py-4.5 bg-white/5 rounded-2xl border border-white/10 text-white font-semibold text-sm outline-none focus:border-[#FFB700]/30 transition-all placeholder:text-white/10"
                placeholder="E.g. Reopening May 29, 2026."
              />
            </div>

            <button 
              onClick={() => handleSaveSettings()}
              disabled={isSaving}
              className="w-full h-14 rounded-2xl bg-white text-matte-black font-black text-xs uppercase tracking-[2px] shadow-xl hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-matte-black" /> : <Save className="w-4 h-4 text-matte-black" />}
              Update Banner Announcements
            </button>
          </div>

          {/* LIVE ORDER LOG MONITOR */}
          <div className="bg-[#121620]/50 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-lg font-black italic uppercase tracking-tight flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400 animate-pulse" /> Live Order Stream
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            </div>

            <div className="space-y-4">
              {settings.emergencyStop ? (
                <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-6 text-center space-y-3">
                  <ShieldAlert className="w-10 h-10 text-red-500 mx-auto animate-bounce" />
                  <p className="text-xs font-black uppercase text-red-400 tracking-wider">Stream Suspended</p>
                  <p className="text-white/40 text-[10px] leading-relaxed">No new checkouts will be processed while emergency lock is activated.</p>
                </div>
              ) : settings.websiteStatus === 'OFF' ? (
                <div className="bg-white/5 border border-white/5 rounded-2xl p-6 text-center space-y-3">
                  <Moon className="w-10 h-10 text-white/30 mx-auto" />
                  <p className="text-xs font-black uppercase text-white/40 tracking-wider">Website Offline</p>
                  <p className="text-white/30 text-[10px] leading-relaxed">The restaurant ordering services are closed. Ordering is disabled.</p>
                </div>
              ) : (
                liveOrders.map(order => (
                  <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4.5 space-y-2 transition-all hover:bg-white/[0.04]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#FFB700] uppercase tracking-wider">{order.id}</span>
                      <span className="text-[8px] font-bold text-white/30 tracking-widest uppercase">{order.time}</span>
                    </div>
                    <p className="text-sm font-black uppercase italic tracking-tighter text-white">{order.name}</p>
                    <p className="text-[10px] font-semibold text-white/50 leading-relaxed truncate">{order.items}</p>
                    
                    <div className="flex items-center justify-between border-t border-white/5 pt-2 mt-1">
                      <span className="text-xs font-black text-[#FFB700] italic">₹{order.total}</span>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'Pending' ? 'bg-amber-400' :
                          order.status === 'Preparing' ? 'bg-blue-400' :
                          order.status === 'Ready' ? 'bg-purple-400' : 'bg-emerald-400'
                        }`} />
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{order.status}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-white/5 text-center">
              <span className="text-white/20 text-[9px] font-bold uppercase tracking-widest">Last updated: {formatDate(settings.lastUpdated)}</span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
