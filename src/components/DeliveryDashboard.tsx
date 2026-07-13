import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db, rtdb } from '../firebase';
import { ref as rtdbRef, set as rtdbSet, onValue, onDisconnect, serverTimestamp as rtdbTimestamp } from 'firebase/database';
import toast from 'react-hot-toast';
import { playSound, SOUNDS } from '../utils/audio';
import { useSEO } from '../utils/seo';

export default function DeliveryDashboard() {
  useSEO("Rider Portal", "Delivery Partner dashboard for live tracking, routing, and earnings updates.");
  const navigate = useNavigate();

  // Auth States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [riderId, setRiderId] = useState<string | null>(null);
  const [riderProfile, setRiderProfile] = useState<any>(null);

  // Status Toggles
  const [isOnline, setIsOnline] = useState(false);

  // Active / History Orders State
  const [assignedOrders, setAssignedOrders] = useState<any[]>([]);
  const [pastDeliveries, setPastDeliveries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'assigned' | 'history'>('assigned');
  const [offerTimers, setOfferTimers] = useState<Record<string, number>>({});

  // Verify Auth State on mount
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Verify this user is actually registered as a rider
        const riderRef = doc(db, 'riders', user.uid);
        const riderSnap = await getDoc(riderRef);
        if (riderSnap.exists()) {
          setRiderId(user.uid);
          const data = riderSnap.data();
          setRiderProfile(data);
          setIsOnline(data.status === 'online');
        } else {
          // Sign out immediately if not authorized
          await signOut(auth);
          toast.error("Access Denied: This account is not registered as a delivery partner.");
          setRiderId(null);
        }
      } else {
        setRiderId(null);
        setRiderProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 1. Live Geolocation GPS Tracking while Online
  useEffect(() => {
    if (!isOnline || !riderId) return;

    let watchId: number | null = null;
    
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Update Firestore
            const riderRef = doc(db, 'riders', riderId);
            await updateDoc(riderRef, {
              'currentLocation.lat': latitude,
              'currentLocation.lng': longitude,
              'currentLocation.lastUpdated': new Date().toISOString()
            });

            // Update RTDB for map animations
            const locationRef = rtdbRef(rtdb, `riderLocations/${riderId}`);
            await rtdbSet(locationRef, {
              lat: latitude,
              lng: longitude,
              timestamp: Date.now()
            });
          } catch (err) {
            console.error("GPS coordinates sync failed:", err);
          }
        },
        (error) => {
          console.error("GPS position watch error:", error);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
      );
    } else {
      toast.error("GPS location not supported on this browser.");
    }

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isOnline, riderId]);

  // 1.5. Online Presence Monitoring with RTDB onDisconnect()
  useEffect(() => {
    if (!riderId || !isOnline) return;

    const connectedRef = rtdbRef(rtdb, '.info/connected');
    const statusRef = rtdbRef(rtdb, `riders/${riderId}/status`);

    const unsubscribe = onValue(connectedRef, async (snap) => {
      if (snap.val() === true) {
        // Set online status in RTDB
        await rtdbSet(statusRef, 'online');

        // Configure onDisconnect status fallback to offline
        onDisconnect(statusRef).set('offline');

        // Also update status in Firestore for list queries
        await updateDoc(doc(db, 'riders', riderId), { status: 'online' });
      }
    });

    return () => {
      unsubscribe();
      // Set status offline when turning off or component unmounts
      rtdbSet(statusRef, 'offline').catch(() => {});
      updateDoc(doc(db, 'riders', riderId), { status: 'offline' }).catch(() => {});
    };
  }, [riderId, isOnline]);

  // 1.7. 30-Second Countdown for New Assigned Order Offers
  useEffect(() => {
    const assigned = assignedOrders.filter(o => !o.riderStatus || o.riderStatus === 'assigned');
    if (assigned.length === 0) return;

    const interval = setInterval(() => {
      setOfferTimers(prev => {
        const next = { ...prev };
        let updated = false;

        assigned.forEach(order => {
          if (next[order.id] === undefined) {
            next[order.id] = 30;
            updated = true;
            playSound(SOUNDS.NOTIFICATION);
          } else if (next[order.id] > 0) {
            next[order.id] = next[order.id] - 1;
            updated = true;
            playSound(SOUNDS.CLICK);
          } else if (next[order.id] === 0) {
            handleRejectOrder(order.id);
            delete next[order.id];
            updated = true;
            playSound(SOUNDS.ERROR);
            toast.error(`Offer for order #${order.id.slice(0, 8)} expired.`);
          }
        });

        // Clean up stale timers
        Object.keys(next).forEach(id => {
          if (!assigned.some(o => o.id === id)) {
            delete next[id];
            updated = true;
          }
        });

        return updated ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [assignedOrders]);

  // 2. Real-Time Listeners for Assigned Orders (Pending/Preparing/Delivering)
  useEffect(() => {
    if (!riderId) return;

    const ordersQuery = query(
      collection(db, 'orders'),
      where('riderId', '==', riderId)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      const active: any[] = [];
      const past: any[] = [];
      
      snapshot.forEach((docSnap) => {
        const o = { id: docSnap.id, ...docSnap.data() } as any;
        if (o.status === 'delivered' || o.status === 'completed' || o.status === 'cancelled') {
          past.push(o);
        } else {
          active.push(o);
        }
      });

      // Sort
      active.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      past.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAssignedOrders(active);
      setPastDeliveries(past);
    });

    return () => unsubscribe();
  }, [riderId]);

  // Login handler
  const handleRiderLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error("Please enter email and password.");
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      toast.success("Rider session initialized! 🛵");
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRiderLogout = async () => {
    if (riderId) {
      // Set offline on logout
      const riderRef = doc(db, 'riders', riderId);
      await updateDoc(riderRef, { status: 'offline' });
    }
    await signOut(auth);
    toast.success("Signed out successfully.");
  };

  // Toggle Online/Offline State
  const toggleOnlineStatus = async () => {
    if (!riderId) return;
    const nextStatus = !isOnline;
    setIsOnline(nextStatus);

    try {
      const riderRef = doc(db, 'riders', riderId);
      await updateDoc(riderRef, { status: nextStatus ? 'online' : 'offline' });
      toast.success(`You are now ${nextStatus ? 'ONLINE 🟢' : 'OFFLINE 🔴'}`);
    } catch (err) {
      toast.error("Failed to update status.");
      setIsOnline(isOnline); // revert
    }
  };

  // Accept Order
  const handleAcceptOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'Preparing', // Move to preparing/accepted state
        riderStatus: 'accepted'
      });
      toast.success("Order accepted! 📦");
    } catch (err) {
      toast.error("Failed to accept order.");
    }
  };

  // Reject Order
  const handleRejectOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        riderId: '', // Release rider
        riderStatus: 'rejected'
      });
      toast.success("Order rejected.");
    } catch (err) {
      toast.error("Failed to reject order.");
    }
  };

  // Start Delivery
  const handleStartDelivery = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'Out For Delivery',
        riderStatus: 'delivering'
      });
      toast.success("Delivery run started! Drive safe. 🛵");
    } catch (err) {
      toast.error("Failed to update order.");
    }
  };

  // Complete Delivery (Crediting ₹40 commission automatically)
  const handleCompleteDelivery = async (orderId: string) => {
    if (!riderId) return;
    try {
      const orderRef = doc(db, 'orders', orderId);
      const riderRef = doc(db, 'riders', riderId);

      await updateDoc(orderRef, {
        status: 'delivered',
        riderStatus: 'delivered',
        deliveredAt: new Date().toISOString()
      });

      // Update rider earnings (+₹40 per delivery commission)
      const newEarnings = (riderProfile?.earnings || 0) + 40;
      await updateDoc(riderRef, {
        earnings: newEarnings
      });

      setRiderProfile((prev: any) => ({ ...prev, earnings: newEarnings }));
      toast.success("Order Delivered successfully! +₹40 earned. 💵");
    } catch (err) {
      toast.error("Failed to complete delivery.");
    }
  };

  // Render Login Panel
  if (!riderId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#0B0E14] border border-white/10 rounded-[35px] w-full max-w-md p-8 shadow-[0_20px_50px_rgba(76,217,100,0.15)] space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-500 to-orange-500" />
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/5 blur-[80px] rounded-full pointer-events-none" />

          <div className="space-y-2 mt-4 text-center">
            <span className="material-symbols-outlined w-12 h-12 text-[#4CD964] mx-auto animate-pulse">local_shipping</span>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mt-4">
              RIDER <span className="text-[#4CD964]">PORTAL</span>
            </h2>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">
              Authorized Delivery Login Required
            </p>
          </div>

          <form onSubmit={handleRiderLogin} className="space-y-4">
            <input
              type="email"
              placeholder="RIDER EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-[#4CD964]/50 transition-all font-bold text-xs text-white placeholder:text-white/20 tracking-[1px]"
            />
            <input
              type="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 outline-none focus:border-[#4CD964]/50 transition-all font-bold text-xs text-white placeholder:text-white/20 tracking-[1px]"
            />
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:brightness-105 active:scale-95 text-white font-black text-xs uppercase tracking-[2px] py-4 rounded-2xl transition-all shadow-[0_6px_20px_rgba(239,68,68,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <>Log In Partner <span className="material-symbols-outlined w-4 h-4">login</span></>}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Calculate earnings
  const completedCount = pastDeliveries.filter(o => o.status === 'delivered').length;

  // Show Verification pending/rejected status page
  if (riderProfile && riderProfile.verificationStatus !== 'approved') {
    const isRejected = riderProfile.verificationStatus === 'rejected';
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-lg">
          {isRejected ? '❌' : '⏳'}
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
            {isRejected ? 'Account Rejected' : 'Verification Pending'}
          </h2>
          <p className="text-white/40 text-xs font-semibold uppercase tracking-[3px]">
            {isRejected ? 'Your delivery partner registration was rejected' : 'Platform owner authorization required'}
          </p>
          <p className="text-white/60 text-sm max-w-sm mx-auto leading-relaxed">
            {isRejected 
              ? 'Please contact platform administration if you believe this was in error.' 
              : 'Our administration team is currently reviewing your uploaded profile credentials. We will notify you once approved!'}
          </p>
        </div>
        <button
          onClick={handleRiderLogout}
          className="bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
        >
          Sign Out / Exit
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-24 pb-48 px-4 md:px-6">
      
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header Dashboard Info */}
        <div className="luxury-card rounded-[35px] p-6 sm:p-10 border-[#4CD964]/10 bg-gradient-to-br from-[#0B0E14] to-black flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className={`w-12 h-12 rounded-full border flex items-center justify-center shadow-lg text-lg font-black shrink-0 ${
              isOnline ? 'bg-[#4CD964]/10 border-[#4CD964]/30 text-[#4CD964] shadow-[#4CD964]/20' : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {isOnline ? '🟢' : '🔴'}
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase text-white tracking-tighter">{riderProfile?.name}</h2>
              <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mt-0.5">Delivery Partner Active Session</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Status Switcher */}
            <button
              onClick={toggleOnlineStatus}
              className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-md ${
                isOnline 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white' 
                  : 'bg-[#4CD964] text-black hover:brightness-105 shadow-[#4CD964]/10'
              }`}
            >
              <span className="material-symbols-outlined w-4 h-4">power_settings_new</span>
              {isOnline ? "Go Offline" : "Go Online"}
            </button>

            {/* Logout button */}
            <button
              onClick={handleRiderLogout}
              className="bg-white/5 border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Earning Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl text-left">
            <span className="material-symbols-outlined w-5 h-5 text-[#4CD964] mb-2">trending_up</span>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Earnings</p>
            <h3 className="text-3xl font-black italic text-white mt-1">₹{riderProfile?.earnings || 0}</h3>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl text-left">
            <span className="material-symbols-outlined w-5 h-5 text-emerald-400 mb-2">check_circle</span>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Deliveries Done</p>
            <h3 className="text-3xl font-black italic text-white mt-1">{completedCount} Orders</h3>
          </div>
          <div className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl text-left col-span-2 sm:col-span-1">
            <span className="material-symbols-outlined w-5 h-5 text-gold mb-2">schedule</span>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Commission Rate</p>
            <h3 className="text-xl font-black italic text-gold mt-2">₹40 / order</h3>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`flex-1 py-3.5 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              activeTab === 'assigned' ? 'bg-[#4CD964] text-black shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            Assigned Deliveries ({assignedOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3.5 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              activeTab === 'history' ? 'bg-[#4CD964] text-black shadow-md' : 'text-white/50 hover:text-white'
            }`}
          >
            History & Earnings ({pastDeliveries.length})
          </button>
        </div>

        {/* Dynamic tabs content */}
        <div>
          {activeTab === 'assigned' ? (
            <div className="space-y-6">
              {!isOnline && (
                <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold">
                  <span className="material-symbols-outlined w-5 h-5 shrink-0">error</span>
                  Please toggle status to ONLINE to activate Geolocation GPS tracking and receive order assignments.
                </div>
              )}

              {assignedOrders.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
                  <span className="material-symbols-outlined w-12 h-12 text-white/10 mx-auto mb-4 animate-bounce">local_shipping</span>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-widest">No active deliveries assigned</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedOrders.map((order) => {
                    const customerLoc = order.deliveryLocation;
                    const mapLink = `https://www.google.com/maps/dir/?api=1&destination=${customerLoc?.lat || 14.9667},${customerLoc?.lng || 74.7167}`;
                    
                    return (
                      <div key={order.id} className="bg-[#0B0E14] border border-white/10 rounded-3xl p-6 text-left space-y-6 hover:border-[#4CD964]/20 transition-all">
                        {/* Status bar */}
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                          <div>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Order ID: #{order.id.slice(0, 8)}</p>
                            <p className="text-white text-xs font-semibold mt-1">Items: {order.items.map((i: any) => `${i.quantity || i.finalQuantity || 1}x ${i.name}`).join(', ')}</p>
                          </div>
                          
                          <div className="text-right">
                            <span className="bg-[#4CD964]/10 border border-[#4CD964]/25 text-[#4CD964] text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded">
                              {order.status}
                            </span>
                          </div>
                        </div>

                        {/* Customer & address details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Customer Details</p>
                            <h4 className="text-base font-extrabold text-white">{order.userName}</h4>
                            <p className="text-xs text-white/60 font-semibold">{order.userPhone}</p>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Delivery Address</p>
                            <h4 className="text-xs font-bold text-white uppercase leading-relaxed">{customerLoc?.address}</h4>
                            {customerLoc?.distance && (
                              <p className="text-[10px] text-[#4CD964] font-black uppercase tracking-wider">Distance: {customerLoc.distance} km</p>
                            )}
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-white/5">
                          {/* Unconfirmed riderStatus: Accept/Reject */}
                          {(!order.riderStatus || order.riderStatus === 'assigned') && (
                            <div className="w-full space-y-4">
                              <div className="w-full bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">⏳</span>
                                  <div>
                                    <p className="text-[10px] font-black uppercase tracking-wider">New Order Offer</p>
                                    <p className="text-[9px] text-white/50 font-bold mt-0.5 text-left">Accept before countdown expires</p>
                                  </div>
                                </div>
                                <span className="text-xl font-black italic animate-pulse">
                                  {offerTimers[order.id] ?? 30}s
                                </span>
                              </div>
                              <div className="flex gap-3 w-full">
                                <button
                                  onClick={() => handleAcceptOrder(order.id)}
                                  className="flex-1 bg-[#4CD964] text-black font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl hover:brightness-105 active:scale-95 transition-all cursor-pointer"
                                >
                                  Accept Order
                                </button>
                                <button
                                  onClick={() => handleRejectOrder(order.id)}
                                  className="flex-1 bg-white/5 border border-white/10 text-red-400 font-black uppercase text-[10px] tracking-widest py-3.5 rounded-xl hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                                >
                                  Reject Order
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Accepted order status: Start Delivery */}
                          {order.riderStatus === 'accepted' && (
                            <button
                              onClick={() => handleStartDelivery(order.id)}
                              className="flex-1 bg-[#4CD964] text-black font-black uppercase text-[10px] tracking-widest py-4 rounded-xl hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined w-4 h-4">navigation</span> Start Delivery Run
                            </button>
                          )}

                          {/* Out for Delivery status: Complete Delivery */}
                          {order.riderStatus === 'delivering' && (
                            <button
                              onClick={() => handleCompleteDelivery(order.id)}
                              className="flex-1 bg-gradient-to-r from-emerald-500 to-[#4CD964] text-black font-black uppercase text-[10px] tracking-widest py-4 rounded-xl hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined w-4 h-4 fill-black stroke-emerald-500">check_circle</span> Complete Delivery
                            </button>
                          )}

                          {/* Navigation Link Launcher */}
                          {order.riderStatus !== 'delivered' && (
                            <a
                              href={mapLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white/5 border border-white/10 hover:border-blue-400 text-blue-400 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                            >
                              <span className="material-symbols-outlined w-4 h-4">explore</span> Navigate
                            </a>
                          )}

                          <a
                            href={`tel:${order.userPhone}`}
                            className="bg-white/5 border border-white/10 hover:border-[#4CD964] text-white px-4 py-4 rounded-xl flex items-center justify-center transition-all"
                          >
                            <span className="material-symbols-outlined w-4 h-4 text-[#4CD964]">add_call</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Earnings Analytics Dashboard
            (() => {
              const today = new Date().toDateString();
              const todayDeliveries = pastDeliveries.filter(o => {
                const d = o.deliveredAt ? new Date(o.deliveredAt).toDateString() : null;
                return d === today;
              });
              const todayEarnings = todayDeliveries.length * 40;
              const totalEarnings = riderProfile?.earnings || (completedCount * 40);
              const weekDeliveries = pastDeliveries.filter(o => {
                if (!o.deliveredAt) return false;
                const diff = (Date.now() - new Date(o.deliveredAt).getTime()) / (1000 * 60 * 60 * 24);
                return diff <= 7;
              });

              return (
                <div className="space-y-6">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 bg-gradient-to-br from-[#4CD964]/10 to-emerald-500/5 border border-[#4CD964]/20 rounded-3xl p-6 text-left">
                      <p className="text-[9px] font-black text-[#4CD964]/70 uppercase tracking-widest mb-1">Today's Earnings</p>
                      <h2 className="text-5xl font-black italic text-white">₹{todayEarnings}</h2>
                      <p className="text-white/30 text-[10px] font-bold mt-2">{todayDeliveries.length} deliveries completed today</p>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Total Earnings</p>
                      <h3 className="text-2xl font-black italic text-[#4CD964] mt-1">₹{totalEarnings}</h3>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">This Week</p>
                      <h3 className="text-2xl font-black italic text-amber-400 mt-1">{weekDeliveries.length} orders</h3>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">All-Time Orders</p>
                      <h3 className="text-2xl font-black italic text-white mt-1">{completedCount}</h3>
                    </div>
                    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-left">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Rating</p>
                      <h3 className="text-2xl font-black italic text-amber-400 mt-1">⭐ {riderProfile?.rating || '5.0'}</h3>
                    </div>
                  </div>

                  {/* Delivery Log */}
                  <div>
                    <h3 className="text-xs font-black italic uppercase tracking-widest text-white/40 mb-3">Delivery Log</h3>
                    {pastDeliveries.length === 0 ? (
                      <div className="text-center py-16 bg-white/[0.02] rounded-3xl border border-white/5">
                        <p className="text-white/30 text-xs font-bold uppercase tracking-widest">No delivery history found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pastDeliveries.map((order) => (
                          <div key={order.id} className="bg-[#0B0E14]/60 border border-white/5 rounded-2xl p-4 flex items-center justify-between gap-4 text-left hover:border-[#4CD964]/15 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#4CD964]/10 border border-[#4CD964]/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined w-4 h-4 text-[#4CD964]">check_circle</span>
                              </div>
                              <div>
                                <p className="text-white text-sm font-bold leading-none">{order.userName}</p>
                                <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-1">
                                  #{order.id.slice(0, 8)} • {order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'Completed'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[#4CD964] font-black italic text-lg">+₹40</span>
                              <p className="text-white/20 text-[8px] font-black uppercase tracking-widest mt-0.5">Commission</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          )}
        </div>

      </div>
    </div>
  );
}
