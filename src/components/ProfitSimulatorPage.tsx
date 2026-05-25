import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { Order } from '../types';
import ProfitCalculator from './admin/ProfitCalculator';
import { motion } from 'framer-motion';
import { Calculator, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfitSimulatorPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-matte-black p-4 md:p-8 pb-32">
      <div className="max-w-[1400px] mx-auto space-y-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-dark-surface p-8 md:p-12 rounded-[50px] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px]" />
          <div className="flex items-center gap-6 relative z-10">
            <button 
              onClick={() => navigate(-1)}
              className="p-4 bg-white/5 rounded-2xl border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Profit Simulator</h1>
              <p className="text-brand font-black uppercase tracking-[4px] text-[10px] mt-1">Moms Magic Business Tools</p>
            </div>
          </div>
          <div className="p-4 bg-brand/10 rounded-2xl border border-brand/20 text-brand relative z-10">
            <Calculator className="w-8 h-8" />
          </div>
        </div>

        {/* The Calculator Component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ProfitCalculator orders={orders} />
        </motion.div>
      </div>
    </div>
  );
}
