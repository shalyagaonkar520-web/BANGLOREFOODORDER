import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Wallet, 
  MapPin, 
  Gift, 
  Bell, 
  LogOut, 
  ChevronRight, 
  Trash2, 
  Plus, 
  History, 
  Clock, 
  Map, 
  Compass,
  CheckCircle2,
  PackageSearch
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { useSEO } from '../utils/seo';

interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  orderId?: string;
  description: string;
  createdAt: string;
}

export default function ProfilePage() {
  useSEO("My Profile", "Manage your profile, saved addresses, reward points, and check your wallet balance at Mom's Magic.");
  const navigate = useNavigate();
  const { user, profile, logout, addAddress, deleteAddress } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'orders' | 'wallet' | 'addresses' | 'rewards' | 'notifications'>('orders');
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Address Form State
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home');
  const [addressText, setAddressText] = useState('');
  const [addressLat, setAddressLat] = useState('14.9667'); // Default Yellapur
  const [addressLng, setAddressLng] = useState('74.7167');

  // Push Notifications Settings State
  const [notifOrderUpdates, setNotifOrderUpdates] = useState(true);
  const [notifPromos, setNotifPromos] = useState(true);

  // Re-route if user is not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/');
      toast.error('Please log in to access this portal.');
    }
  }, [user, navigate]);

  // Load Wallet Transactions and local order history
  useEffect(() => {
    if (!user) return;

    const loadWalletData = async () => {
      setLoadingTransactions(true);
      try {
        const transRef = collection(db, 'walletTransactions');
        const q = query(transRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const list: WalletTransaction[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as WalletTransaction);
        });
        // Sort transactions descending by date
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTransactions(list);
      } catch (err) {
        console.error('Error loading wallet transactions:', err);
      } finally {
        setLoadingTransactions(false);
      }
    };

    const loadOrders = () => {
      try {
        const stored = JSON.parse(localStorage.getItem('moms_magic_orders') || '[]');
        const phone = profile?.phone || user.phoneNumber || '';
        
        // Clean utility to match digits
        const clean = (p: string) => p.replace(/\D/g, '').slice(-10);
        
        // Filter orders by phone number or userId (for logged in placements)
        const userOrders = stored.filter((o: any) => {
          const isPhoneMatch = phone ? clean(o.userPhone) === clean(phone) : false;
          const isUserMatch = o.userId === user.uid;
          return isPhoneMatch || isUserMatch;
        });

        userOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(userOrders);
      } catch (err) {
        console.error('Error loading local orders:', err);
      }
    };

    loadWalletData();
    loadOrders();
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully.');
      navigate('/');
    } catch (e) {
      toast.error('Logout failed.');
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressText.trim() || !addressLabel.trim()) {
      toast.error('Please enter address details.');
      return;
    }
    const lat = parseFloat(addressLat);
    const lng = parseFloat(addressLng);
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Invalid coordinates.');
      return;
    }

    try {
      await addAddress(addressLabel.trim(), addressText.trim(), lat, lng);
      toast.success('Address saved successfully! 📍');
      setAddressText('');
      setShowAddressForm(false);
    } catch (err) {
      toast.error('Failed to save address.');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteAddress(id);
      toast.success('Address deleted.');
    } catch (err) {
      toast.error('Failed to delete address.');
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="relative min-h-screen bg-[#050505] text-white pt-24 pb-48 px-4 md:px-6">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-[#4CD964]/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* User Card */}
        <div className="luxury-card rounded-[35px] p-6 sm:p-10 border-[#4CD964]/10 bg-gradient-to-r from-white/5 to-[#4CD964]/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <User className="w-32 h-32 text-[#4CD964]" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="w-20 h-20 rounded-full bg-[#4CD964]/10 border-2 border-[#4CD964]/30 flex items-center justify-center text-3xl text-[#4CD964] font-black uppercase shadow-lg shadow-[#4CD964]/20">
              {profile.name.charAt(0)}
            </div>
            
            <div className="space-y-1">
              <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                {profile.name}
              </h1>
              <p className="text-xs text-white/50 font-medium">{profile.email}</p>
              {profile.phone && <p className="text-xs text-[#4CD964] font-bold">{profile.phone}</p>}
            </div>

            <div className="sm:ml-auto flex items-center gap-6">
              <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-center">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Wallet</p>
                <p className="text-2xl font-black italic text-[#4CD964] mt-1">₹{profile.walletBalance}</p>
              </div>
              <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl text-center">
                <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Rewards</p>
                <p className="text-2xl font-black italic text-gold mt-1">{profile.rewardPoints} pts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/5">
          {[
            { id: 'orders', label: 'My Orders', icon: PackageSearch },
            { id: 'wallet', label: 'Wallet', icon: Wallet },
            { id: 'addresses', label: 'Addresses', icon: MapPin },
            { id: 'rewards', label: 'Rewards', icon: Gift },
            { id: 'notifications', label: 'Settings', icon: Bell }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-[#4CD964] text-black shadow-lg shadow-[#4CD964]/20' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="min-h-[300px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              
              {/* ORDERS TAB */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Order History</h3>
                    <span className="text-[#4CD964] text-[10px] font-black uppercase tracking-widest">{orders.length} orders found</span>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-16 bg-white/[0.02] rounded-3xl border border-white/5">
                      <PackageSearch className="w-16 h-16 text-white/10 mx-auto mb-4" />
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">No order history found</p>
                      <button onClick={() => navigate('/food')} className="mt-4 btn-luxury-gold px-8 text-[9px]">
                        Order Food
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 hover:border-[#4CD964]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Order ID: #{order.id.slice(0, 8)}</p>
                              <span className="bg-white/5 text-white/60 text-[8px] font-black uppercase px-2 py-0.5 rounded border border-white/10">
                                {order.orderType || 'regular'}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-white max-w-md truncate">
                              {order.items.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(', ')}
                            </h4>
                            <p className="text-white/40 text-[10px] font-medium">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                            <div className="text-left md:text-right">
                              <p className="text-[#4CD964] font-black italic text-xl">₹{order.grandTotal}</p>
                              <span className={`inline-block text-[8px] font-black uppercase tracking-widest mt-1 border px-2 py-0.5 rounded-full ${
                                order.status === 'delivered' || order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-orange-500/10 text-orange-400 border-orange-500/20 animate-pulse'
                              }`}>
                                {order.status}
                              </span>
                            </div>

                            <button
                              onClick={() => navigate(`/track/${order.id}`)}
                              className="bg-white/5 border border-white/10 hover:border-[#4CD964] text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:text-[#4CD964] flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                            >
                              📍 Track Live
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* WALLET TAB */}
              {activeTab === 'wallet' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-white/5 to-[#4CD964]/5 border border-[#4CD964]/20 rounded-3xl p-8 relative overflow-hidden">
                      <div className="absolute bottom-0 right-0 p-6 opacity-5 pointer-events-none">
                        <Wallet className="w-40 h-40 text-[#4CD964]" />
                      </div>
                      <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Available Balance</p>
                      <h3 className="text-5xl font-black italic text-[#4CD964] mt-2 tracking-tighter">₹{profile.walletBalance}</h3>
                      <p className="text-xs text-white/60 mt-4 leading-relaxed font-medium">
                        Use this balance during checkout to get instant discounts on any order.
                      </p>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex flex-col justify-center space-y-4">
                      <h4 className="font-black italic uppercase tracking-tighter text-lg text-white">Promotions & Offers</h4>
                      <p className="text-xs text-white/40 leading-relaxed font-medium">
                        Register today to receive our automatic ₹50 welcome gift! Refer friends or complete ordering benchmarks to earn credits.
                      </p>
                      <div className="flex items-center gap-2 text-[#4CD964] font-black text-[10px] uppercase tracking-widest">
                        <CheckCircle2 className="w-4 h-4 fill-current text-[#4CD964] stroke-[#050505]" /> Welcome Bonus Claimed
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                      <History className="w-5 h-5 text-[#4CD964]" /> Transaction History
                    </h4>

                    {loadingTransactions ? (
                      <div className="text-center py-12">
                        <span className="w-8 h-8 border-2 border-[#4CD964] border-t-transparent rounded-full animate-spin inline-block" />
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-12 bg-white/[0.02] rounded-3xl border border-white/5">
                        <p className="text-white/30 text-xs font-bold uppercase tracking-widest">No wallet transactions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((t) => (
                          <div key={t.id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-xs font-bold text-white">{t.description}</p>
                              <p className="text-[9px] text-white/40 uppercase tracking-wider mt-1">{new Date(t.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-lg font-black italic ${t.amount >= 0 ? 'text-[#4CD964]' : 'text-red-500'}`}>
                                {t.amount >= 0 ? `+₹${t.amount}` : `-₹${Math.abs(t.amount)}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SAVED ADDRESSES TAB */}
              {activeTab === 'addresses' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Saved Addresses</h3>
                    <button 
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="bg-[#4CD964] text-black px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-md shadow-[#4CD964]/10"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Address
                    </button>
                  </div>

                  {/* Add Address Form */}
                  {showAddressForm && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleAddAddress}
                      className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 overflow-hidden"
                    >
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#4CD964]">New Saved Address</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Label</label>
                          <select
                            value={addressLabel}
                            onChange={(e) => setAddressLabel(e.target.value)}
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-[#4CD964]/50"
                          >
                            <option value="Home">📍 Home</option>
                            <option value="Work">💼 Work</option>
                            <option value="Hostel">🏢 Hostel/PG</option>
                            <option value="Other">✨ Other</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Latitude</label>
                          <input
                            type="text"
                            value={addressLat}
                            onChange={(e) => setAddressLat(e.target.value)}
                            placeholder="e.g. 14.9667"
                            required
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-[#4CD964]/50"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Longitude</label>
                          <input
                            type="text"
                            value={addressLng}
                            onChange={(e) => setAddressLng(e.target.value)}
                            placeholder="e.g. 74.7167"
                            required
                            className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-bold outline-none focus:border-[#4CD964]/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/40">Address Details</label>
                        <input
                          type="text"
                          value={addressText}
                          onChange={(e) => setAddressText(e.target.value)}
                          placeholder="ENTER FULL DELIVERABLE ADDRESS"
                          required
                          className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white font-bold outline-none focus:border-[#4CD964]/50 uppercase tracking-[1px] placeholder:text-white/20"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="bg-gradient-to-r from-[#4CD964] to-[#3AC152] hover:brightness-105 active:scale-95 text-white font-black text-[10px] uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all shadow-md shadow-[#4CD964]/20 cursor-pointer"
                        >
                          Save Location
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* List Addresses */}
                  {profile.addresses.length === 0 ? (
                    <div className="text-center py-16 bg-white/[0.02] rounded-3xl border border-white/5">
                      <MapPin className="w-16 h-16 text-white/10 mx-auto mb-4" />
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest">No saved addresses yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.addresses.map((a) => (
                        <div key={a.id} className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-4 hover:border-white/15 transition-all">
                          <div className="space-y-1 text-left">
                            <span className="bg-[#4CD964]/10 text-[#4CD964] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-[#4CD964]/20">
                              {a.label}
                            </span>
                            <p className="text-xs font-extrabold text-white mt-2 leading-relaxed uppercase tracking-[0.5px]">
                              {a.address}
                            </p>
                            <p className="text-[9px] text-white/30 font-medium">
                              Coords: {a.lat.toFixed(4)}, {a.lng.toFixed(4)}
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteAddress(a.id)}
                            className="text-white/40 hover:text-red-500 font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 transition-colors self-end cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* REWARDS TAB */}
              {activeTab === 'rewards' && (
                <div className="space-y-8 text-center max-w-md mx-auto py-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-gold/30 to-yellow-500/10 rounded-[30px] flex items-center justify-center border border-gold/30 shadow-[0_0_40px_rgba(244,180,0,0.2)] mx-auto relative">
                    <Gift className="w-12 h-12 text-gold" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white">Reward points</h3>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Moms Magic Premium Loyalty Club</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                    <p className="text-sm font-bold text-white">Current Balance</p>
                    <h4 className="text-4xl font-black italic text-gold mt-2">{profile.rewardPoints} points</h4>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mt-6">
                      <div className="h-full bg-gold rounded-full" style={{ width: `${Math.min(100, (profile.rewardPoints / 500) * 100)}%` }} />
                    </div>
                    <p className="text-[9px] text-white/30 font-black uppercase tracking-wider mt-2.5">
                      Earn 500 points to unlock ₹50 wallet cash back!
                    </p>
                  </div>

                  <p className="text-xs text-white/50 leading-relaxed font-medium">
                    Every ₹100 spent on Moms Magic earns you 10 reward points automatically. Loyalty points are synced directly to your account.
                  </p>
                </div>
              )}

              {/* SETTINGS / NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">System Settings</h3>

                  <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="text-sm font-black uppercase tracking-wide text-white">Order Status Alerts</h4>
                        <p className="text-xs text-white/40 font-medium">Receive real-time push alerts on order confirming and rider assignment.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifOrderUpdates}
                        onChange={(e) => setNotifOrderUpdates(e.target.checked)}
                        className="w-5 h-5 accent-[#4CD964] cursor-pointer"
                      />
                    </div>

                    <div className="h-px bg-white/5" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="text-sm font-black uppercase tracking-wide text-white">Promotional Alerts</h4>
                        <p className="text-xs text-white/40 font-medium">Receive daily notifications on exclusive combos and magic deals.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifPromos}
                        onChange={(e) => setNotifPromos(e.target.checked)}
                        className="w-5 h-5 accent-[#4CD964] cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Account De-Auth */}
                  <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-left space-y-1">
                      <h4 className="text-sm font-black uppercase tracking-wide text-white">End Session</h4>
                      <p className="text-xs text-white/40 font-medium">Safely sign out from your account and delete browser cache storage.</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="bg-red-600/10 border border-red-600/30 hover:bg-red-600 hover:text-white text-red-400 px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" /> Logout Session
                    </button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
