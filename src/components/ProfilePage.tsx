import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuthStore } from '../store/authStore';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import toast from 'react-hot-toast';
import { useSEO } from '../utils/seo';
import { User, Wallet, Gift, Package, MapPin, Settings, CheckCircle2, History, Plus, Trash2, LogOut, Loader2 } from 'lucide-react';

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
  const { user, profile, loading, logout, addAddress, deleteAddress } = useAuthStore();
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
          const isPhoneMatch = (phone && typeof o.userPhone === 'string') ? clean(o.userPhone) === clean(phone) : false;
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


  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-primary mt-4 font-bold uppercase tracking-widest text-label-sm">Loading Profile...</p>
      </div>
    );
  }

  if (!user) return null;

  if (!profile) {
    return (
      <div className="min-h-screen bg-background text-on-surface flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-headline-md font-bold text-error mb-4">Profile Sync Error</h2>
        <p className="text-body-md text-secondary mb-8 max-w-sm">We couldn't load your profile data. Please check your connection and try again.</p>
        <button
          onClick={handleLogout}
          className="bg-error/10 border border-error/30 text-error px-6 py-3 rounded-xl font-bold uppercase text-label-sm hover:bg-error/20 transition-all cursor-pointer"
        >
          Force Logout
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-on-surface pt-24 pb-48 px-4 md:px-6">
      <div className="max-w-4xl mx-auto space-y-12 relative z-10">
        
        {/* User Card */}
        <div className="bg-white rounded-[32px] p-6 sm:p-10 border border-gray-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <User className="w-[120px] h-[120px] text-primary" />
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left relative z-10">
            <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-headline-lg text-primary font-bold uppercase shadow-sm">
              {profile.name.charAt(0)}
            </div>
            
            <div className="space-y-1">
              <h1 className="font-headline-lg text-on-surface">
                {profile.name}
              </h1>
              <p className="text-label-sm text-secondary font-medium">{profile.email}</p>
              {profile.phone && <p className="text-label-sm text-primary font-bold">{profile.phone}</p>}
            </div>

            <div className="sm:ml-auto flex items-center gap-6">
              <div className="bg-surface-container-low border border-outline-variant px-6 py-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Wallet</p>
                <p className="text-headline-md font-bold text-primary mt-1">₹{profile.walletBalance}</p>
              </div>
              <div className="bg-surface-container-low border border-outline-variant px-6 py-4 rounded-2xl text-center">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-widest">Rewards</p>
                <p className="text-headline-md font-bold text-tertiary mt-1">{profile.rewardPoints} pts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 p-1.5 bg-surface-container rounded-2xl border border-outline-variant/50">
          {[ 
            { id: 'orders', label: 'My Orders', icon: <Package className="w-5 h-5" /> },
            { id: 'wallet', label: 'Wallet', icon: <Wallet className="w-5 h-5" /> },
            { id: 'addresses', label: 'Addresses', icon: <MapPin className="w-5 h-5" /> },
            { id: 'rewards', label: 'Rewards', icon: <Gift className="w-5 h-5" /> },
            { id: 'notifications', label: 'Settings', icon: <Settings className="w-5 h-5" /> }
          ].map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-[16px] font-bold text-[13px] uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-primary text-white shadow-[0_4px_12px_rgba(255,107,53,0.3)]' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
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
                    <h3 className="font-headline-lg text-on-surface">Order History</h3>
                    <span className="text-primary text-label-sm font-bold uppercase tracking-widest">{orders.length} orders found</span>
                  </div>

                  {orders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-secondary text-label-md font-bold uppercase tracking-widest">No order history found</p>
                      <button onClick={() => navigate('/food')} className="mt-4 px-6 py-2.5 bg-primary text-on-primary font-bold uppercase tracking-widest text-label-sm rounded-xl hover:bg-primary/90 transition-all shadow-sm">
                        Order Food
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-surface border border-outline-variant/50 rounded-3xl p-6 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <p className="text-secondary text-label-sm font-bold uppercase tracking-widest">Order ID: #{order.id.slice(0, 8)}</p>
                              <span className="bg-surface-container text-on-surface text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-outline-variant">
                                {order.orderType || 'regular'}
                              </span>
                            </div>
                            <h4 className="text-body-lg font-bold text-on-surface max-w-md truncate">
                              {order.items.map((i: any) => `${i.quantity || 1}x ${i.name}`).join(', ')}
                            </h4>
                            <p className="text-secondary text-label-md font-medium mt-1">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                            {order.deliveryLocation?.address && (
                              <p className="text-secondary text-label-md font-medium mt-1.5 border-l-2 border-primary/30 pl-2 max-w-sm truncate" title={order.deliveryLocation.address}>
                                📍 {order.deliveryLocation.address}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-outline-variant/50 pt-4 md:pt-0">
                            <div className="text-left md:text-right">
                              <p className="text-on-surface font-headline-lg text-xl">₹{order.grandTotal}</p>
                              <span className={`inline-block text-[10px] font-bold uppercase tracking-widest mt-1 border px-2 py-0.5 rounded-full ${
                                order.status === 'delivered' || order.status === 'completed' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                                order.status === 'cancelled' ? 'bg-error-container text-on-error-container border-error/20' :
                                'bg-primary/10 text-primary border-primary/20 animate-pulse'
                              }`}>
                                {order.status}
                              </span>
                            </div>

                            <button
                              onClick={() => navigate(`/track/${order.id}`)}
                              className="bg-surface-container border border-outline-variant hover:border-primary text-on-surface px-5 py-3 rounded-xl text-label-sm font-bold uppercase tracking-widest transition-all hover:text-primary flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                            >
                              <MapPin className="w-4 h-4" /> Track Live
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
                    <div className="bg-surface border border-outline-variant/50 rounded-3xl p-8 relative overflow-hidden shadow-sm">
                      <div className="absolute bottom-0 right-0 p-6 opacity-5 pointer-events-none">
                        <Wallet className="w-[120px] h-[120px] text-primary" />
                      </div>
                      <p className="text-label-sm font-bold text-secondary uppercase tracking-widest">Available Balance</p>
                      <h3 className="text-headline-lg font-bold text-primary mt-2">₹{profile.walletBalance}</h3>
                      <p className="text-body-sm text-secondary mt-4 leading-relaxed font-medium">
                        Use this balance during checkout to get instant discounts on any order.
                      </p>
                    </div>

                    <div className="bg-surface border border-outline-variant/50 rounded-3xl p-8 flex flex-col justify-center space-y-4 shadow-sm">
                      <h4 className="font-headline-sm text-on-surface">Promotions & Offers</h4>
                      <p className="text-body-sm text-secondary leading-relaxed font-medium">
                        Register today to receive our automatic ₹50 welcome gift! Refer friends or complete ordering benchmarks to earn credits.
                      </p>
                      <div className="flex items-center gap-2 text-primary font-bold text-label-sm uppercase tracking-widest">
                        <CheckCircle2 className="w-5 h-5 text-primary" /> Welcome Bonus Claimed
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="font-headline-sm text-on-surface flex items-center gap-2">
                      <History className="w-5 h-5 text-primary" /> Transaction History
                    </h4>

                    {loadingTransactions ? (
                      <div className="text-center py-12">
                        <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
                      </div>
                    ) : transactions.length === 0 ? (
                      <div className="text-center py-12 bg-surface rounded-3xl border border-outline-variant/50 shadow-sm">
                        <p className="text-secondary text-label-sm font-bold uppercase tracking-widest">No wallet transactions yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {transactions.map((t) => (
                          <div key={t.id} className="bg-surface border border-outline-variant/50 rounded-2xl p-5 flex items-center justify-between gap-4 shadow-sm">
                            <div>
                              <p className="text-body-md font-bold text-on-surface">{t.description}</p>
                              <p className="text-label-sm text-secondary uppercase tracking-wider mt-1">{new Date(t.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <span className={`text-headline-md font-bold ${t.amount >= 0 ? 'text-primary' : 'text-error'}`}>
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
                    <h3 className="font-headline-lg text-on-surface">Saved Addresses</h3>
                    <button 
                      onClick={() => setShowAddressForm(!showAddressForm)}
                      className="bg-primary text-on-primary px-4 py-2.5 rounded-xl text-label-sm font-bold uppercase tracking-widest flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-5 h-5" /> Add Address
                    </button>
                  </div>

                  {/* Add Address Form */}
                  {showAddressForm && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleAddAddress}
                      className="bg-surface-container border border-outline-variant rounded-3xl p-6 space-y-4 overflow-hidden"
                    >
                      <h4 className="text-label-sm font-bold uppercase tracking-widest text-primary">New Saved Address</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5 text-left">
                          <label className="text-label-sm font-bold uppercase tracking-widest text-secondary">Label</label>
                          <select
                            value={addressLabel}
                            onChange={(e) => setAddressLabel(e.target.value)}
                            className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-sm text-on-surface font-bold outline-none focus:border-primary"
                          >
                            <option value="Home">📍 Home</option>
                            <option value="Work">💼 Work</option>
                            <option value="Hostel">🏢 Hostel/PG</option>
                            <option value="Other">✨ Other</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-label-sm font-bold uppercase tracking-widest text-secondary">Latitude</label>
                          <input
                            type="text"
                            value={addressLat}
                            onChange={(e) => setAddressLat(e.target.value)}
                            placeholder="e.g. 14.9667"
                            required
                            className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-sm text-on-surface font-bold outline-none focus:border-primary"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-label-sm font-bold uppercase tracking-widest text-secondary">Longitude</label>
                          <input
                            type="text"
                            value={addressLng}
                            onChange={(e) => setAddressLng(e.target.value)}
                            placeholder="e.g. 74.7167"
                            required
                            className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-sm text-on-surface font-bold outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 text-left">
                        <label className="text-label-sm font-bold uppercase tracking-widest text-secondary">Address Details</label>
                        <input
                          type="text"
                          value={addressText}
                          onChange={(e) => setAddressText(e.target.value)}
                          placeholder="ENTER FULL DELIVERABLE ADDRESS"
                          required
                          className="w-full bg-surface border border-outline-variant rounded-xl px-4 py-3.5 text-body-sm text-on-surface font-bold outline-none focus:border-primary uppercase tracking-[1px] placeholder:text-outline-variant"
                        />
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="bg-primary hover:brightness-105 active:scale-95 text-on-primary font-bold text-label-sm uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          Save Location
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="bg-surface-container border border-outline-variant hover:bg-surface-container-high text-on-surface font-bold text-label-sm uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* List Addresses */}
                  {profile.addresses.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                      <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-secondary text-label-sm font-bold uppercase tracking-widest">No saved addresses yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.addresses.map((a) => (
                        <div key={a.id} className="bg-surface border border-outline-variant/50 rounded-3xl p-6 flex flex-col justify-between gap-4 hover:border-outline-variant transition-all shadow-sm">
                          <div className="space-y-1 text-left">
                            <span className="bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded border border-primary/20">
                              {a.label}
                            </span>
                            <p className="text-body-md font-bold text-on-surface mt-2 leading-relaxed uppercase tracking-[0.5px]">
                              {a.address}
                            </p>
                            <p className="text-label-sm text-secondary font-medium">
                              Coords: {a.lat.toFixed(4)}, {a.lng.toFixed(4)}
                            </p>
                          </div>

                          <button
                            onClick={() => handleDeleteAddress(a.id)}
                            className="text-secondary hover:text-error font-bold text-label-sm uppercase tracking-widest flex items-center gap-1.5 transition-colors self-end cursor-pointer"
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
                  <div className="w-24 h-24 bg-orange-50 rounded-[30px] flex items-center justify-center border border-orange-100 mx-auto relative shadow-sm">
                    <Gift className="w-12 h-12 text-primary" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-headline-lg text-on-surface">Reward points</h3>
                    <p className="text-secondary text-label-sm font-bold uppercase tracking-widest">Moms Magic Premium Loyalty Club</p>
                  </div>

                  <div className="bg-surface-container border border-outline-variant/50 rounded-3xl p-6 shadow-sm">
                    <p className="text-body-md font-bold text-on-surface">Current Balance</p>
                    <h4 className="font-headline-lg text-tertiary mt-2">{profile.rewardPoints} points</h4>
                    <div className="h-2 w-full bg-outline-variant/30 rounded-full overflow-hidden mt-6">
                      <div className="h-full bg-tertiary rounded-full" style={{ width: `${Math.min(100, (profile.rewardPoints / 500) * 100)}%` }} />
                    </div>
                    <p className="text-label-sm text-secondary font-bold uppercase tracking-wider mt-2.5">
                      Earn 500 points to unlock ₹50 wallet cash back!
                    </p>
                  </div>

                  <p className="text-body-sm text-secondary leading-relaxed font-medium">
                    Every ₹100 spent on Moms Magic earns you 10 reward points automatically. Loyalty points are synced directly to your account.
                  </p>
                </div>
              )}

              {/* SETTINGS / NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="space-y-8">
                  <h3 className="font-headline-lg text-on-surface">System Settings</h3>

                  <div className="bg-surface border border-outline-variant/50 rounded-3xl p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="text-body-md font-bold uppercase tracking-wide text-on-surface">Order Status Alerts</h4>
                        <p className="text-label-sm text-secondary font-medium">Receive real-time push alerts on order confirming and rider assignment.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifOrderUpdates}
                        onChange={(e) => setNotifOrderUpdates(e.target.checked)}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </div>

                    <div className="h-px bg-outline-variant/30" />

                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-left">
                        <h4 className="text-body-md font-bold uppercase tracking-wide text-on-surface">Promotional Alerts</h4>
                        <p className="text-label-sm text-secondary font-medium">Receive daily notifications on exclusive combos and magic deals.</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifPromos}
                        onChange={(e) => setNotifPromos(e.target.checked)}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Account De-Auth */}
                  <div className="bg-error-container/30 border border-error/20 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="text-left space-y-1">
                      <h4 className="text-body-md font-bold uppercase tracking-wide text-on-surface">End Session</h4>
                      <p className="text-label-sm text-secondary font-medium">Safely sign out from your account and delete browser cache storage.</p>
                    </div>

                    <button
                      onClick={handleLogout}
                      className="bg-error-container border border-error hover:bg-error hover:text-on-error text-error px-6 py-3.5 rounded-xl text-label-sm font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 shadow-sm"
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
