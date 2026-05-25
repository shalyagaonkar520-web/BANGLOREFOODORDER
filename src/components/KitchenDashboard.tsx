import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Timer, CheckCircle, Flame, Clock, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<any[]>([]);

  const playAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.5);
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(e) {
      console.log('Audio alert blocked');
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('status', 'in', ['pending', 'preparing', 'ready']),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newOrdersData: any[] = [];
      
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.status === 'pending') {
            playAlert();
            toast.success('New order received! 🍽️', {
              duration: 5000,
              style: {
                background: '#10B981',
                color: '#fff',
                fontWeight: 'bold',
                borderRadius: '12px'
              }
            });
          }
        }
      });

      snapshot.forEach((doc) => {
        newOrdersData.push({ id: doc.id, ...doc.data() });
      });
      setOrders(newOrdersData);
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: newStatus });
      toast.success(`Order moved to ${newStatus}`);
    } catch (e) {
      toast.error('Failed to update order status');
    }
  };

  const sections = [
    { id: 'pending', name: 'New Orders', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'preparing', name: 'Preparing', icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { id: 'ready', name: 'Ready', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-12 py-16 md:py-24 space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-center bg-dark-surface p-8 md:p-12 rounded-[50px] border border-white/5 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px]" />
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-5 bg-brand/10 rounded-[28px] border border-brand/20 shadow-inner">
            <ChefHat className="w-10 h-10 text-brand" />
          </div>
          <div>
            <span className="text-brand font-black uppercase tracking-[5px] text-xs">Chef's Station</span>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter italic leading-none">KITCHEN</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white/5 px-6 py-4 rounded-3xl border border-white/10 mt-6 md:mt-0">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-black uppercase tracking-widest text-white/60">Live Connection Active</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {sections.map((section) => (
          <div key={section.id} className="space-y-6">
            <div className={`flex items-center gap-4 p-6 ${section.bg} rounded-[32px] border border-white/5`}>
              <section.icon className={`w-6 h-6 ${section.color}`} />
              <h2 className="text-xl font-black italic tracking-tight">{section.name}</h2>
              <span className="ml-auto bg-white/5 px-4 py-1 rounded-full text-xs font-black">
                {orders.filter(o => o.status === section.id).length}
              </span>
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {orders.filter(o => o.status === section.id).map((order) => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-dark-surface p-6 rounded-[32px] border border-white/5 shadow-xl relative overflow-hidden group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-black text-lg italic text-white">{order.name || 'Anonymous Order'}</h3>
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">#{order.id?.slice(-6).toUpperCase()}</p>
                      </div>
                      <div className="p-2 bg-white/5 rounded-xl">
                        <Utensils className="w-4 h-4 text-white/20" />
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm">
                          <span className="font-bold text-white/70">{item.name}</span>
                          <span className="font-black text-brand bg-brand/10 px-2 py-0.5 rounded-lg text-xs">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {section.id === 'pending' && (
                        <button
                          onClick={() => updateStatus(order.id, 'preparing')}
                          className="w-full py-4 bg-orange-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                        >
                          Start Cooking <Flame className="w-4 h-4" />
                        </button>
                      )}
                      {section.id === 'preparing' && (
                        <button
                          onClick={() => updateStatus(order.id, 'ready')}
                          className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                        >
                          Mark Ready <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {section.id === 'ready' && (
                        <div className="w-full py-4 bg-white/5 text-white/40 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center border border-white/10">
                          Awaiting Rider Pickup
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {orders.filter(o => o.status === section.id).length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px]">
                  <p className="text-white/10 font-black uppercase tracking-widest text-xs">Clear</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
