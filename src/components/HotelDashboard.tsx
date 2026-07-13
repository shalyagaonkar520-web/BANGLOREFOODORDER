import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  doc, getDoc, collection, query, where, onSnapshot,
  updateDoc, addDoc, deleteDoc, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';
import { useSEO } from '../utils/seo';
import { playSound, SOUNDS } from '../utils/audio';

// ─── Types ──────────────────────────────────────────────────────────────────

interface HotelOrder {
  id: string;
  userName: string;
  userPhone: string;
  address: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  grandTotal?: number;
  status: string;
  createdAt: any;
  prepTime?: string;
  riderId?: string;
  type?: string;
  paymentMethod?: string;
}

interface MenuItem {
  id?: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  image: string;
  isAvailable: boolean;
  isVeg?: boolean;
  type: 'food' | 'grocery' | 'milk';
}

// ─── Status Config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; next?: string; nextLabel?: string }> = {
  pending: {
    label: 'New Order',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
    next: 'Preparing',
    nextLabel: '🍳 Start Preparing'
  },
  Preparing: {
    label: 'Preparing',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
    next: 'ready',
    nextLabel: '✅ Mark Ready'
  },
  preparing: {
    label: 'Preparing',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
    next: 'ready',
    nextLabel: '✅ Mark Ready'
  },
  ready: {
    label: 'Ready for Pickup',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
  },
  picked_up: {
    label: 'Picked Up',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/20',
  },
  'Out For Delivery': {
    label: 'Out for Delivery',
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10 border-cyan-400/20',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10 border-emerald-400/20',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/20',
  },
};

const EMPTY_ITEM: MenuItem = {
  name: '',
  price: 0,
  category: 'Main Course',
  description: '',
  image: '',
  isAvailable: true,
  isVeg: true,
  type: 'food',
};

const CATEGORIES = ['Starters', 'Main Course', 'Breads', 'Rice & Biryani', 'Desserts', 'Beverages', 'Combos', 'Snacks', 'Other'];

// ─── Helper ──────────────────────────────────────────────────────────────────

function timeAgo(ts: any): string {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HotelDashboard() {
  useSEO('Hotel Portal', "Hotel admin dashboard to manage orders and menu for Mom's Magic partner hotels.");

  // Auth
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [hotelData, setHotelData] = useState<any>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

  // Orders
  const [orders, setOrders] = useState<HotelOrder[]>([]);
  const [orderFilter, setOrderFilter] = useState<'active' | 'completed'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

  // Riders and Item Checked States (KDS features)
  const [riders, setRiders] = useState<any[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, Record<number, boolean>>>({});

  const toggleItemCheck = (orderId: string, itemIdx: number) => {
    playSound(SOUNDS.CLICK);
    setCheckedItems(prev => {
      const orderChecks = prev[orderId] || {};
      return {
        ...prev,
        [orderId]: {
          ...orderChecks,
          [itemIdx]: !orderChecks[itemIdx]
        }
      };
    });
  };

  // Menu
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menuSearch, setMenuSearch] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState<MenuItem>({ ...EMPTY_ITEM });
  const [savingItem, setSavingItem] = useState(false);
  const [deletingItem, setDeletingItem] = useState<string | null>(null);

  // ── Auth listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.role === 'kitchen_staff' || userData.role === 'admin') {
              const restId = userData.restaurantId || 'res_1';
              const restSnap = await getDoc(doc(db, 'restaurants', restId));
              if (restSnap.exists()) {
                setHotelId(restId);
                setHotelData(restSnap.data());
                toast.success(`Logged in to ${restSnap.data().name} 👨‍🍳`);
                return;
              } else {
                toast.error(`Restaurant ${restId} not found in database.`);
              }
            } else {
              toast.error(`Access denied: User does not have kitchen staff privileges.`);
            }
          } else {
            toast.error('User profile not found in database.');
          }
        } catch (err: any) {
          console.error("Auth error in kitchen dashboard:", err);
          toast.error('Error fetching user metadata: ' + err.message);
        }
        // If checks fail, sign out
        await signOut(auth);
        setHotelId(null);
        setHotelData(null);
      } else {
        setHotelId(null);
        setHotelData(null);
      }
    });
    return () => unsub();
  }, []);

  // ── Orders listener ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hotelId) return;
    const q = query(collection(db, 'orders'), where('restaurantId', '==', hotelId));
    let isInitialLoad = true;
    
    const unsub = onSnapshot(q, (snap) => {
      const fetched: HotelOrder[] = [];
      let playAlert = false;

      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const docData = change.doc.data();
          if (!isInitialLoad && docData.status === 'pending') {
            playAlert = true;
          }
        }
      });
      isInitialLoad = false;

      snap.forEach((d) => fetched.push({ id: d.id, ...d.data() } as HotelOrder));
      fetched.sort((a, b) => {
        const ta = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime();
        const tb = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime();
        return tb - ta;
      });
      setOrders(fetched);

      if (playAlert) {
        playSound(SOUNDS.ORDER_SUCCESS);
        toast('New Order Received! 🔔', { icon: '🔔', duration: 4000 });
      }
    }, (err) => console.error('Orders listener error:', err));
    return () => unsub();
  }, [hotelId]);

  // ── Menu listener ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!hotelId) return;
    const q = query(collection(db, 'menuItems'), where('restaurantId', '==', hotelId));
    const unsub = onSnapshot(q, (snap) => {
      const fetched: MenuItem[] = [];
      snap.forEach((d) => fetched.push({ id: d.id, ...d.data() } as MenuItem));
      setMenuItems(fetched);
    }, (err) => console.error('Menu listener error:', err));
    return () => unsub();
  }, [hotelId]);

  // ── Riders listener ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!hotelId) return;
    const unsub = onSnapshot(collection(db, 'riders'), (snapshot) => {
      const fetched: any[] = [];
      snapshot.forEach(docSnap => {
        fetched.push({ uid: docSnap.id, ...docSnap.data() });
      });
      setRiders(fetched);
    }, (err) => console.error('Riders listener error:', err));
    return () => unsub();
  }, [hotelId]);

  // ── Login ─────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Enter email and password.'); return; }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      toast.success('Welcome back, Chef! 👨‍🍳');
    } catch (err: any) {
      toast.error(err.message || 'Login failed.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Signed out.');
  };

  // ── Order status update ───────────────────────────────────────────────────
  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrder(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      toast.success(`Order marked as ${newStatus} ✅`);
    } catch {
      toast.error('Failed to update status.');
    } finally {
      setUpdatingOrder(null);
    }
  };

  // ── Menu CRUD ─────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingItem(null);
    setItemForm({ ...EMPTY_ITEM });
    setShowItemModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({ ...item });
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!itemForm.name.trim() || itemForm.price <= 0) {
      toast.error('Name and valid price are required.');
      return;
    }
    setSavingItem(true);
    try {
      const data = {
        ...itemForm,
        restaurantId: hotelId,
        updatedAt: serverTimestamp(),
      };

      if (editingItem?.id) {
        await updateDoc(doc(db, 'menuItems', editingItem.id), data);
        toast.success('Menu item updated ✅');
      } else {
        await addDoc(collection(db, 'menuItems'), { ...data, createdAt: serverTimestamp() });
        toast.success('Menu item added 🍽️');
      }
      setShowItemModal(false);
    } catch (err: any) {
      toast.error('Failed to save item.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Delete this menu item?')) return;
    setDeletingItem(itemId);
    try {
      await deleteDoc(doc(db, 'menuItems', itemId));
      toast.success('Item removed from menu.');
    } catch {
      toast.error('Failed to delete item.');
    } finally {
      setDeletingItem(null);
    }
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    if (!item.id) return;
    try {
      await updateDoc(doc(db, 'menuItems', item.id), { isAvailable: !item.isAvailable });
      toast.success(item.isAvailable ? 'Item marked unavailable.' : 'Item now available!');
    } catch {
      toast.error('Failed to toggle availability.');
    }
  };

  const renderOrderCard = (order: HotelOrder) => {
    const cfg = STATUS_CONFIG[order.status] || {
      label: order.status,
      color: 'text-white/55',
      bg: 'bg-white/5 border-white/10'
    };
    const isUpdating = updatingOrder === order.id;
    const assignedRider = riders.find(r => r.uid === order.riderId);
    const orderChecks = checkedItems[order.id] || {};

    return (
      <motion.div
        key={order.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="bg-[#111118] border border-white/6 rounded-3xl p-5 space-y-4 hover:border-orange-500/20 transition-all flex flex-col justify-between"
      >
        <div className="space-y-4">
          {/* Order header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">#{order.id.slice(0, 8)}</p>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
                {order.type && (
                  <span className="text-[8px] font-black text-white/20 uppercase tracking-wider">
                    {order.type === 'food' ? '🍽️' : order.type === 'grocery' ? '🛒' : '🥛'} {order.type}
                  </span>
                )}
              </div>
              <p className="text-white text-sm font-bold mt-1 text-left">{order.userName}</p>
              <p className="text-white/40 text-[10px] font-bold text-left">{order.userPhone}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-orange-400 font-black italic text-lg">₹{order.grandTotal || order.total}</p>
              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mt-0.5">{timeAgo(order.createdAt)}</p>
            </div>
          </div>

          {/* Items checklist */}
          <div className="bg-white/[0.02] rounded-2xl p-3 border border-white/5 text-left">
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Order Items (Chefs Checklist)</p>
            <div className="space-y-1.5">
              {order.items.map((item: any, idx: number) => {
                const isChecked = !!orderChecks[idx];
                return (
                  <button
                    key={idx}
                    onClick={() => toggleItemCheck(order.id, idx)}
                    className="w-full flex items-center justify-between hover:bg-white/5 p-1.5 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <p className={`text-xs font-semibold flex items-center gap-2 transition-all ${isChecked ? 'line-through opacity-45 text-[#4CD964]' : 'text-white/80'}`}>
                      <span>{isChecked ? '✅' : '⬜'}</span>
                      <span>{item.quantity || item.finalQuantity || 1}× {item.name}</span>
                    </p>
                    <p className="text-white/40 text-[10px] font-bold">₹{item.price}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-2 text-left">
            <div className="w-5 h-5 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-2.5 h-2.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-white/50 text-[10px] font-semibold leading-relaxed">{order.address}</p>
          </div>

          {/* Rider Info Stats Strip */}
          {assignedRider && (
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-3 flex items-center justify-between gap-3 text-left">
              <div>
                <p className="text-white/30 text-[8px] font-black uppercase tracking-widest">Delivery Partner</p>
                <p className="text-white font-extrabold text-[11px] mt-0.5">🛵 {assignedRider.name}</p>
                <p className="text-white/40 text-[9px] font-medium mt-0.5">{assignedRider.vehicleType || 'Motorcycle'} • ⭐{assignedRider.rating || '5.0'}</p>
              </div>
              <div>
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${assignedRider.status === 'online' ? 'bg-[#4CD964]/10 text-[#4CD964] border border-[#4CD964]/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {assignedRider.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/5 space-y-3">
          {/* Prep time input for Preparing state */}
          {(order.status === 'Preparing' || order.status === 'preparing') && (
            <div className="flex items-center gap-2 text-left">
              <span className="material-symbols-outlined w-3.5 h-3.5 text-blue-400 shrink-0">schedule</span>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Prep time:</p>
              <select
                defaultValue={order.prepTime || '20 mins'}
                onChange={(e) => updateDoc(doc(db, 'orders', order.id), { prepTime: e.target.value })}
                className="bg-white/4 border border-white/8 rounded-lg px-2 py-1 text-white text-[10px] outline-none"
              >
                {['10 mins','15 mins','20 mins','25 mins','30 mins','40 mins','45 mins'].map(t =>
                  <option key={t} value={t} className="bg-[#13131C]">{t}</option>
                )}
              </select>
            </div>
          )}

          {/* Action buttons */}
          {cfg.next && (
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusUpdate(order.id, cfg.next!)}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? <span className="material-symbols-outlined w-4 h-4 animate-spin">sync</span> : cfg.nextLabel}
              </button>

              {order.status === 'pending' && (
                <button
                  onClick={() => handleStatusUpdate(order.id, 'cancelled')}
                  disabled={isUpdating}
                  className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // ── Filtered data ────────────────────────────────────────────────────────
  const isActive = (o: HotelOrder) => !['delivered', 'cancelled', 'completed'].includes(o.status.toLowerCase());
  const filteredOrders = orders
    .filter(o => orderFilter === 'active' ? isActive(o) : !isActive(o))
    .filter(o => !searchQuery || o.userName?.toLowerCase().includes(searchQuery.toLowerCase()) || o.id.includes(searchQuery));

  const filteredMenu = menuItems.filter(i =>
    !menuSearch || i.name.toLowerCase().includes(menuSearch.toLowerCase()) || i.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  // Stats
  const activeCount = orders.filter(isActive).length;
  const todayRevenue = orders
    .filter(o => {
      const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return d.toDateString() === new Date().toDateString() && o.status !== 'cancelled';
    })
    .reduce((s, o) => s + (o.grandTotal || o.total || 0), 0);
  const completedToday = orders.filter(o => {
    const d = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
    return d.toDateString() === new Date().toDateString() && o.status === 'delivered';
  }).length;

  // ─────────────────────────────────────────────────────────────────────────
  // LOGIN SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (!hotelId) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-md relative"
        >
          {/* Ambient glow */}
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-amber-500/8 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative bg-[#111118] border border-white/8 rounded-[32px] p-8 shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
            {/* Top accent */}
            <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-orange-500/60 to-transparent rounded-full" />

            <div className="text-center space-y-3 mb-8 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center mx-auto shadow-[0_8px_24px_rgba(249,115,22,0.4)]">
                <span className="material-symbols-outlined w-8 h-8 text-white">restaurant_menu</span>
              </div>
              <h1 className="text-3xl font-black italic uppercase tracking-tight text-white">
                Hotel <span className="text-orange-400">Portal</span>
              </h1>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[2px]">
                Partner Restaurant Login
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="email"
                placeholder="HOTEL EMAIL ADDRESS"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/4 border border-white/8 rounded-2xl py-4 px-5 text-white placeholder:text-white/20 text-xs font-bold tracking-wide outline-none focus:border-orange-500/40 focus:bg-white/6 transition-all"
              />
              <input
                type="password"
                placeholder="PASSWORD"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/4 border border-white/8 rounded-2xl py-4 px-5 text-white placeholder:text-white/20 text-xs font-bold tracking-wide outline-none focus:border-orange-500/40 focus:bg-white/6 transition-all"
              />
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-black text-[11px] uppercase tracking-[2px] py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all shadow-[0_8px_24px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loginLoading
                  ? <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><span className="material-symbols-outlined w-4 h-4">login</span> Sign In to Dashboard</>
                }
              </button>
            </form>

            <p className="text-center text-[10px] text-white/20 font-bold mt-6 uppercase tracking-widest">
              Only registered hotel partners can access this portal
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN DASHBOARD
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white pb-32">
      {/* Item Modal */}
      <AnimatePresence>
        {showItemModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowItemModal(false); }}
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-lg bg-[#13131C] border border-white/8 rounded-[28px] p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">
                  {editingItem ? '✏️ Edit Item' : '➕ Add Menu Item'}
                </h3>
                <button onClick={() => setShowItemModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all cursor-pointer">
                  <span className="material-symbols-outlined w-4 h-4 text-white/60">close</span>
                </button>
              </div>

              <div className="space-y-3">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">Item Name *</label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Butter Chicken"
                    className="w-full bg-white/4 border border-white/8 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-orange-500/40 transition-all"
                  />
                </div>

                {/* Price + Category row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">Price (₹) *</label>
                    <input
                      type="number"
                      value={itemForm.price || ''}
                      onChange={(e) => setItemForm(f => ({ ...f, price: Number(e.target.value) }))}
                      placeholder="0"
                      min={0}
                      className="w-full bg-white/4 border border-white/8 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-orange-500/40 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">Category</label>
                    <select
                      value={itemForm.category}
                      onChange={(e) => setItemForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full bg-white/4 border border-white/8 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-orange-500/40 transition-all"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#13131C]">{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">Description</label>
                  <textarea
                    value={itemForm.description || ''}
                    onChange={(e) => setItemForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Describe this dish..."
                    rows={2}
                    className="w-full bg-white/4 border border-white/8 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-orange-500/40 transition-all resize-none"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">Image URL</label>
                  <input
                    type="url"
                    value={itemForm.image}
                    onChange={(e) => setItemForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="https://..."
                    className="w-full bg-white/4 border border-white/8 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-orange-500/40 transition-all"
                  />
                </div>

                {/* Type + Veg row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">Item Type</label>
                    <select
                      value={itemForm.type}
                      onChange={(e) => setItemForm(f => ({ ...f, type: e.target.value as any }))}
                      className="w-full bg-white/4 border border-white/8 rounded-xl py-3 px-4 text-white text-sm outline-none focus:border-orange-500/40 transition-all"
                    >
                      <option value="food" className="bg-[#13131C]">🍽️ Food</option>
                      <option value="grocery" className="bg-[#13131C]">🛒 Grocery</option>
                      <option value="milk" className="bg-[#13131C]">🥛 Milk</option>
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1.5 block">Dietary</label>
                    <button
                      type="button"
                      onClick={() => setItemForm(f => ({ ...f, isVeg: !f.isVeg }))}
                      className={`flex-1 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${itemForm.isVeg ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}
                    >
                      <span className="material-symbols-outlined w-3.5 h-3.5">eco</span>
                      {itemForm.isVeg ? 'Vegetarian' : 'Non-Veg'}
                    </button>
                  </div>
                </div>

                {/* Available Toggle */}
                <button
                  type="button"
                  onClick={() => setItemForm(f => ({ ...f, isAvailable: !f.isAvailable }))}
                  className={`w-full py-3 rounded-xl border text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer ${itemForm.isAvailable ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/4 border-white/10 text-white/40'}`}
                >
                  {itemForm.isAvailable ? <span className="material-symbols-outlined w-4 h-4">toggle_on</span> : <span className="material-symbols-outlined w-4 h-4">toggle_off</span>}
                  {itemForm.isAvailable ? 'Available on Menu' : 'Currently Unavailable'}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/8 text-white/50 text-xs font-black uppercase tracking-widest hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveItem}
                  disabled={savingItem}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-white text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {savingItem ? <span className="material-symbols-outlined w-4 h-4 animate-spin">sync</span> : editingItem ? '💾 Save Changes' : '➕ Add Item'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
              <span className="material-symbols-outlined w-5 h-5 text-white">restaurant_menu</span>
            </div>
            <div>
              <h1 className="text-base font-black italic uppercase tracking-tight text-white leading-none">
                {hotelData?.name || 'Hotel Dashboard'}
              </h1>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[2px] mt-0.5">
                Hotel Admin Portal
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white/50 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined w-3.5 h-3.5">logout</span> Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6 space-y-6">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-4 text-left">
            <span className="material-symbols-outlined w-4 h-4 text-amber-400 mb-2">shopping_bag</span>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Active Orders</p>
            <h3 className="text-3xl font-black italic text-white mt-1">{activeCount}</h3>
          </div>
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-4 text-left">
            <span className="material-symbols-outlined w-4 h-4 text-emerald-400 mb-2">currency_rupee</span>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Today Revenue</p>
            <h3 className="text-3xl font-black italic text-white mt-1">₹{todayRevenue}</h3>
          </div>
          <div className="bg-[#111118] border border-white/5 rounded-2xl p-4 text-left">
            <span className="material-symbols-outlined w-4 h-4 text-green-400 mb-2">check_circle</span>
            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Delivered Today</p>
            <h3 className="text-3xl font-black italic text-white mt-1">{completedToday}</h3>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex gap-2 p-1 bg-white/[0.03] rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'orders' ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md' : 'text-white/40 hover:text-white'}`}
          >
            <span className="material-symbols-outlined w-3.5 h-3.5">content_paste</span> Orders
            {activeCount > 0 && <span className="bg-white/20 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">{activeCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 py-3 text-center text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${activeTab === 'menu' ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-white shadow-md' : 'text-white/40 hover:text-white'}`}
          >
            <span className="material-symbols-outlined w-3.5 h-3.5">restaurant</span> Menu
            <span className="bg-white/10 text-white/60 text-[8px] font-black px-1.5 py-0.5 rounded-full">{menuItems.length}</span>
          </button>
        </div>

        {/* ─────────────────── ORDERS TAB ─────────────────── */}
        {activeTab === 'orders' && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Filter row */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex gap-1.5 p-1 bg-white/[0.03] rounded-xl border border-white/5">
                <button
                  onClick={() => setOrderFilter('active')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${orderFilter === 'active' ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => setOrderFilter('completed')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${orderFilter === 'completed' ? 'bg-orange-500 text-white' : 'text-white/40 hover:text-white'}`}
                >
                  Completed
                </button>
              </div>

              <div className="flex-1 flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl px-4">
                <span className="material-symbols-outlined w-3.5 h-3.5 text-white/30 shrink-0">search</span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or order ID..."
                  className="flex-1 bg-transparent text-white text-xs outline-none py-2.5 placeholder:text-white/20"
                />
              </div>
            </div>

            {/* Orders list */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
                <span className="material-symbols-outlined w-12 h-12 text-white/10 mx-auto mb-3">content_paste</span>
                <p className="text-white/30 text-xs font-black uppercase tracking-widest">
                  {orderFilter === 'active' ? 'No active orders right now' : 'No completed orders'}
                </p>
              </div>
            ) : orderFilter === 'active' ? (
              /* Kanban view dashboard for active orders */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Column 1: New Orders */}
                <div className="space-y-4 bg-white/[0.01] border border-white/5 rounded-3xl p-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                      🚨 New Orders
                    </h4>
                    <span className="bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredOrders.filter(o => o.status.toLowerCase() === 'pending').length}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
                    <AnimatePresence initial={false}>
                      {filteredOrders.filter(o => o.status.toLowerCase() === 'pending').map(order => renderOrderCard(order))}
                    </AnimatePresence>
                    {filteredOrders.filter(o => o.status.toLowerCase() === 'pending').length === 0 && (
                      <p className="text-white/20 text-[10px] uppercase font-bold text-center py-10">No new orders</p>
                    )}
                  </div>
                </div>

                {/* Column 2: Preparing */}
                <div className="space-y-4 bg-white/[0.01] border border-white/5 rounded-3xl p-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                      🍳 Preparing
                    </h4>
                    <span className="bg-blue-400/10 border border-blue-400/20 text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredOrders.filter(o => o.status.toLowerCase() === 'preparing').length}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
                    <AnimatePresence initial={false}>
                      {filteredOrders.filter(o => o.status.toLowerCase() === 'preparing').map(order => renderOrderCard(order))}
                    </AnimatePresence>
                    {filteredOrders.filter(o => o.status.toLowerCase() === 'preparing').length === 0 && (
                      <p className="text-white/20 text-[10px] uppercase font-bold text-center py-10">No items prepping</p>
                    )}
                  </div>
                </div>

                {/* Column 3: Ready / Out */}
                <div className="space-y-4 bg-white/[0.01] border border-white/5 rounded-3xl p-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                      🚚 Ready & Dispatched
                    </h4>
                    <span className="bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                      {filteredOrders.filter(o => ['ready', 'picked_up', 'out for delivery'].includes(o.status.toLowerCase())).length}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
                    <AnimatePresence initial={false}>
                      {filteredOrders.filter(o => ['ready', 'picked_up', 'out for delivery'].includes(o.status.toLowerCase())).map(order => renderOrderCard(order))}
                    </AnimatePresence>
                    {filteredOrders.filter(o => ['ready', 'picked_up', 'out for delivery'].includes(o.status.toLowerCase())).length === 0 && (
                      <p className="text-white/20 text-[10px] uppercase font-bold text-center py-10">No ready orders</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Simple list view for history/completed/cancelled orders */
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {filteredOrders.map((order) => renderOrderCard(order))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* ─────────────────── MENU TAB ─────────────────── */}
        {activeTab === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Menu toolbar */}
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 flex items-center gap-2 bg-white/4 border border-white/8 rounded-xl px-4 min-w-[200px]">
                <span className="material-symbols-outlined w-3.5 h-3.5 text-white/30 shrink-0">search</span>
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search menu items..."
                  className="flex-1 bg-transparent text-white text-xs outline-none py-2.5 placeholder:text-white/20"
                />
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-400 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_14px_rgba(249,115,22,0.25)] cursor-pointer"
              >
                <span className="material-symbols-outlined w-4 h-4">add</span> Add Item
              </button>
            </div>

            {/* Menu grid */}
            {filteredMenu.length === 0 ? (
              <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
                <span className="material-symbols-outlined w-12 h-12 text-white/10 mx-auto mb-3">restaurant</span>
                <p className="text-white/30 text-xs font-black uppercase tracking-widest">
                  {menuSearch ? 'No items match your search' : 'No menu items yet — add your first dish!'}
                </p>
                {!menuSearch && (
                  <button
                    onClick={openAddModal}
                    className="mt-4 px-6 py-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-orange-500 hover:text-white transition-all cursor-pointer"
                  >
                    + Add First Item
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <AnimatePresence initial={false}>
                  {filteredMenu.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className={`bg-[#111118] border rounded-2xl overflow-hidden transition-all ${item.isAvailable ? 'border-white/6' : 'border-white/3 opacity-60'}`}
                    >
                      {/* Item image */}
                      <div className="relative h-32 bg-white/4">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined w-8 h-8 text-white/10">image</span>
                          </div>
                        )}
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded border ${item.isVeg ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'}`}>
                            {item.isVeg ? '🌿 Veg' : '🍖 Non-Veg'}
                          </span>
                        </div>
                        {!item.isAvailable && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Unavailable</span>
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-white font-bold text-sm leading-tight">{item.name}</p>
                            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-0.5">{item.category}</p>
                          </div>
                          <p className="text-orange-400 font-black text-base shrink-0">₹{item.price}</p>
                        </div>

                        {item.description && (
                          <p className="text-white/30 text-[10px] leading-relaxed line-clamp-2">{item.description}</p>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${item.isAvailable ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-white/4 border-white/10 text-white/40 hover:bg-orange-500 hover:border-orange-500 hover:text-white'}`}
                          >
                            {item.isAvailable ? <span className="material-symbols-outlined w-3 h-3">toggle_on</span> : <span className="material-symbols-outlined w-3 h-3">toggle_off</span>}
                            {item.isAvailable ? 'Available' : 'Enable'}
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="w-9 h-9 rounded-xl bg-white/5 border border-white/8 flex items-center justify-center hover:border-orange-500/40 hover:text-orange-400 text-white/40 transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined w-3.5 h-3.5">edit</span>
                          </button>
                          <button
                            onClick={() => item.id && handleDeleteItem(item.id)}
                            disabled={deletingItem === item.id}
                            className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center hover:bg-red-500 text-red-400 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                          >
                            {deletingItem === item.id ? <span className="material-symbols-outlined w-3.5 h-3.5 animate-spin">sync</span> : <span className="material-symbols-outlined w-3.5 h-3.5">delete</span>}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
