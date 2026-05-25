import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Bike, MapPin, CheckCircle, Package, Navigation, ExternalLink, Phone, MessageCircle, Copy, Map } from 'lucide-react';
import toast from 'react-hot-toast';

// ═══════════════════════════════════════════════════════════════
// GOOGLE MAPS LINK HELPERS
// ═══════════════════════════════════════════════════════════════
function getGoogleMapsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

function getGoogleMapsNavLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function getWhatsAppLink(order: any): string {
  const itemsText = Array.isArray(order.items)
    ? order.items.map((i: any) => `${i.quantity}x ${i.name}`).join('%0A')
    : 'N/A';
  const mapsLink = order.lat && order.lng
    ? `https://www.google.com/maps?q=${order.lat},${order.lng}`
    : '';
  const navLink = order.lat && order.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${order.lat},${order.lng}`
    : '';

  const msg = `🛵 *Delivery Update*%0A%0A*Customer:* ${order.name}%0A*Address:* ${order.address || 'N/A'}%0A${order.city ? `*City:* ${order.city}%0A` : ''}%0A*Items:*%0A${itemsText}%0A%0A*Total:* ₹${order.total}%0A${mapsLink ? `%0A📍 *View Location:* ${mapsLink}` : ''}${navLink ? `%0A🧭 *Navigate:* ${navLink}` : ''}`;

  return `https://wa.me/?text=${msg}`;
}

export default function DeliveryDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const sessionStartRef = React.useRef(Date.now());

  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(500, audioCtx.currentTime);
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(e) {
      console.log('Audio disabled');
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['ready', 'picked_up'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrdersData: any[] = [];
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.status === 'ready') {
            playAlert();
            toast.success('New delivery assigned!', {
              icon: '🛵',
              style: {
                borderRadius: '16px',
                background: '#161A22',
                color: '#fff',
                border: '1px solid rgba(255, 77, 0, 0.2)',
              }
            });
          }
        }
      });

      snapshot.forEach((doc) => {
        const data = doc.data();
        // Robust timestamp handling (handles both number and Firebase Timestamp)
        const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || data.timestamp || 0);
        newOrdersData.push({ id: doc.id, ...data, createdAt });
      });

      // Sort by createdAt descending, ensuring 0 if missing to prevent NaN
      newOrdersData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(newOrdersData);
    }, (error) => {
      console.error("Firebase listen error:", error);
      toast.error("Permission Denied: Cannot access orders.");
    });

    return () => unsubscribe();
  }, []);

  const acceptDelivery = async (id: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: 'picked_up' });
      toast.success('Delivery Picked Up');
    } catch (e) {
      toast.error('Error accepting delivery');
    }
  };

  const markDelivered = async (id: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: 'delivered' });
      toast.success('Order Delivered Successfully');
    } catch (e) {
      toast.error('Error marking delivered');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 py-16 md:py-24 space-y-12">
      <header className="flex flex-col justify-between bg-dark-surface p-8 md:p-12 rounded-[50px] border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 blur-[100px]" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 bg-orange-600/10 rounded-[28px] border border-orange-600/20 shadow-inner">
            <Bike className="w-10 h-10 text-orange-500" />
          </div>
          <div>
            <span className="text-orange-500 font-black uppercase tracking-[5px] text-xs">Rider Portal</span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic leading-none">DELIVERY</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <AnimatePresence>
          {orders.map(order => (
            <motion.div 
              key={order.id} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-dark-surface p-8 rounded-[40px] border border-white/5 relative overflow-hidden group hover:border-orange-500/20 transition-all shadow-2xl"
            >
              {/* Order header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-black text-2xl italic tracking-tight text-white mb-2">{order.name}</h3>
                  <div className="flex items-center gap-2 text-white/50 text-sm font-bold">
                    <MapPin className="w-4 h-4 text-orange-500" /> {order.address || 'No address'}
                  </div>
                  {order.city && (
                    <div className="text-white/30 text-xs font-bold mt-1 ml-6">{order.city}</div>
                  )}
                  {order.distance && (
                    <div className="text-white/30 text-xs font-bold mt-1 ml-6">📏 {order.distance} km away</div>
                  )}
                </div>
                <div className="px-4 py-2 bg-orange-500/10 text-orange-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">
                  {order.status === 'ready' ? 'Awaiting Pickup' : 'On The Way'}
                </div>
              </div>

              {/* Items */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest mb-2">
                  <Package className="w-4 h-4" /> Items
                </div>
                {Array.isArray(order.items) ? order.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm font-bold">
                    <span className="text-white/80">{item.name}</span>
                    <span className="text-white/40">x{item.quantity}</span>
                  </div>
                )) : (
                  <div className="text-white/20 text-xs italic">No items found</div>
                )}
              </div>

              {/* ═══════════════════════════════════════════════════════ */}
              {/* GOOGLE MAPS LOCATION BUTTONS                          */}
              {/* ═══════════════════════════════════════════════════════ */}
              {order.lat && order.lng && (
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest">
                    <Map className="w-4 h-4" /> Customer Location
                  </div>

                  {/* Coordinates display */}
                  <div className="flex items-center justify-between bg-dark-bg/60 px-4 py-3 rounded-xl border border-white/5">
                    <span className="text-white/40 text-xs font-mono">
                      {order.lat.toFixed(6)}, {order.lng.toFixed(6)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(`${order.lat}, ${order.lng}`)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all text-white/40 hover:text-white"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Open in Google Maps */}
                  <a
                    href={getGoogleMapsLink(order.lat, order.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-500/10 text-blue-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500/20 transition-all active:scale-[0.97]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in Google Maps
                  </a>

                  {/* Navigate with Google Maps */}
                  <a
                    href={getGoogleMapsNavLink(order.lat, order.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-500/10 text-emerald-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-500/20 hover:bg-emerald-500/20 transition-all active:scale-[0.97]"
                  >
                    <Navigation className="w-4 h-4" />
                    Navigate to Customer
                  </a>

                  {/* WhatsApp share */}
                  <a
                    href={getWhatsAppLink(order)}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-[#25D366]/10 text-[#25D366] rounded-2xl font-black text-[10px] uppercase tracking-widest border border-[#25D366]/20 hover:bg-[#25D366]/20 transition-all active:scale-[0.97]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Share via WhatsApp
                  </a>
                </div>
              )}

              {/* If no GPS — show address-only fallback */}
              {(!order.lat || !order.lng) && order.address && (
                <div className="mb-6 space-y-3">
                  <div className="flex items-center gap-2 text-white/30 text-xs font-bold uppercase tracking-widest">
                    <Map className="w-4 h-4" /> Location
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-500/10 text-blue-400 rounded-2xl font-black text-xs uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500/20 transition-all active:scale-[0.97]"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Search in Google Maps
                  </a>
                </div>
              )}

              {/* Total + action buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="font-black text-3xl italic text-white tracking-tighter">
                  ₹{order.total}
                </div>
                
                {order.status === 'ready' ? (
                  <button 
                    onClick={() => acceptDelivery(order.id)}
                    className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-black text-xs hover:bg-orange-600 active:scale-95 transition-all shadow-xl shadow-orange-500/20 uppercase tracking-widest flex items-center gap-2"
                  >
                    Accept Pickup
                  </button>
                ) : (
                  <button 
                    onClick={() => markDelivered(order.id)}
                    className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs hover:bg-emerald-600 active:scale-95 transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-widest flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Delivered
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {orders.length === 0 && (
            <div className="col-span-full py-20 text-center space-y-4">
               <Bike className="w-16 h-16 text-white/10 mx-auto" />
               <p className="text-white/30 font-black uppercase tracking-widest text-sm">No active deliveries</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
