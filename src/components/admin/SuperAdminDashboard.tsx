import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Order } from '../../types';
import { motion } from 'framer-motion';
import { 
  Calculator, ShieldCheck, LogOut
} from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import ProfitCalculator from './ProfitCalculator';

export default function SuperAdminDashboard() {
  const { logout } = useAdminStore();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const ordersUnsub = onSnapshot(query(collection(db, 'orders'), orderBy('createdAt', 'desc')), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });

    return () => {
      ordersUnsub();
    };
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-dark-surface p-8 md:p-12 rounded-[50px] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px]" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 bg-brand/10 rounded-2xl border border-brand/20 text-brand"><ShieldCheck className="w-8 h-8" /></div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Management</h1>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[4px] mt-1">Profit Analysis Dashboard</p>
          </div>
        </div>
        <div className="flex gap-4 relative z-10">
            <button onClick={logout} className="px-8 py-5 bg-white/5 text-white/40 rounded-2xl font-black flex items-center gap-3 hover:bg-white/10 hover:text-white transition-all text-sm uppercase tracking-widest border border-white/10">
                <LogOut className="w-5 h-5" /> Logout
            </button>
        </div>
      </div>

      {/* Main Content: Just the Profit Calculator */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <ProfitCalculator orders={orders} />
      </motion.div>
    </div>
  );
}
