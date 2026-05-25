import React, { useState, useMemo } from 'react';
import { Order } from '../../types';
import { hotelPrices, hotelData } from '../../data/hotelPrices';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Minus, Trash2, Calculator, Search, 
  TrendingUp, DollarSign, Target, PieChart, ArrowRight
} from 'lucide-react';

interface ProfitCalculatorProps {
  orders: Order[];
}

export default function ProfitCalculator({ orders }: ProfitCalculatorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<{ name: string; quantity: number; appPrice: number }[]>([]);

  // Analytics from historical orders
  const analytics = useMemo(() => {
    let totalSellingAmount = 0;
    let totalHotelCost = 0;
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const hotelPrice = hotelPrices[item.name] || 0;
        totalSellingAmount += item.price * item.quantity;
        totalHotelCost += hotelPrice * item.quantity;
      });
    });

    return {
      netProfit: totalSellingAmount - totalHotelCost,
      totalOrders: orders.length
    };
  }, [orders]);

  // Simulator Logic
  const addItemToSim = (name: string, price: number) => {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.name === name);
      if (existing) {
        return prev.map(i => i.name === name ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { name, quantity: 1, appPrice: price }];
    });
  };

  const updateQuantity = (name: string, delta: number) => {
    setSelectedItems(prev => prev.map(i => 
      i.name === name ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
    ));
  };

  const removeItem = (name: string) => {
    setSelectedItems(prev => prev.filter(i => i.name !== name));
  };

  const simTotals = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const hotelPrice = hotelPrices[item.name] || 0;
      const profitPer = item.appPrice - hotelPrice;
      acc.revenue += item.appPrice * item.quantity;
      acc.cost += hotelPrice * item.quantity;
      acc.profit += profitPer * item.quantity;
      return acc;
    }, { revenue: 0, cost: 0, profit: 0 });
  }, [selectedItems]);

  const filteredItems = Object.entries(hotelData).filter(([name]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Food List Selection */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-dark-surface p-8 rounded-[40px] border border-white/5 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-brand/10 rounded-2xl text-brand">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black italic uppercase text-white">Profit Simulator</h2>
              <p className="text-[10px] font-black uppercase text-white/20 tracking-widest">Select items to calculate</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
            <input 
              type="text" 
              placeholder="Search food item..." 
              className="w-full pl-16 pr-6 py-5 bg-dark-bg rounded-2xl border border-white/5 outline-none focus:border-brand/40 text-white font-bold"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {/* Header for list */}
            <div className="flex items-center justify-between px-4 text-[8px] font-black uppercase text-white/20 tracking-widest mb-2">
                <span className="w-1/3">Item</span>
                <span className="w-1/5 text-center">App Price</span>
                <span className="w-1/5 text-center">Hotel Price</span>
                <span className="w-1/5 text-center">Our Profit</span>
                <span className="w-10"></span>
            </div>
            {filteredItems.map(([name, data]) => {
              return (
                <button 
                  key={name}
                  onClick={() => addItemToSim(name, data.app)}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-brand/40 hover:bg-brand/5 transition-all group text-left"
                >
                  <span className="w-1/3 font-black italic text-white group-hover:text-brand transition-colors uppercase text-xs truncate">
                    {name}
                  </span>
                  <span className="w-1/5 text-center font-bold text-brand text-xs">
                    ₹{data.app}
                  </span>
                  <span className="w-1/5 text-center font-bold text-white/40 text-xs">
                    ₹{data.hotel}
                  </span>
                  <span className="w-1/5 text-center font-black text-emerald-400 text-xs italic">
                    ₹{data.app - data.hotel}
                  </span>
                  <div className="w-10 flex justify-end">
                    <Plus className="w-4 h-4 text-white/20 group-hover:text-brand" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: Active Calculation */}
      <div className="lg:col-span-7 space-y-8">
        {/* Simulator Dashboard */}
        <div className="bg-dark-surface p-10 rounded-[50px] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px]" />
          
          <div className="relative z-10 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-brand/10 p-8 rounded-[40px] border border-brand/20">
                <p className="text-[10px] font-black uppercase text-brand tracking-widest mb-2">Our Net Profit</p>
                <p className="text-6xl font-black italic text-white tracking-tighter">₹{simTotals.profit}</p>
              </div>
              <div className="bg-white/5 p-8 rounded-[40px] border border-white/10">
                <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-2">Pay to Hotel</p>
                <p className="text-6xl font-black italic text-white tracking-tighter">₹{simTotals.cost}</p>
                <div className="mt-2 flex items-center gap-2 text-[10px] font-black uppercase text-white/20">
                    <Target className="w-3 h-3" /> Total Hotel Cost
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center px-4">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Total Revenue</span>
                        <span className="text-lg font-black text-white italic">₹{simTotals.revenue}</span>
                    </div>
                </div>
                {selectedItems.length > 0 && (
                  <button 
                    onClick={() => setSelectedItems([])}
                    className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full font-black uppercase tracking-widest text-[9px] transition-all border border-red-500/20"
                  >
                    Reset List
                  </button>
                )}
            </div>

            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {selectedItems.map(item => {
                  const hotelPrice = hotelPrices[item.name] || 0;
                  const profit = (item.appPrice - hotelPrice) * item.quantity;
                  
                  return (
                    <motion.div 
                      key={item.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-6">
                        <div className="flex items-center bg-dark-bg rounded-xl border border-white/5 p-1">
                          <button onClick={() => updateQuantity(item.name, -1)} className="p-2 hover:text-brand transition-colors"><Minus className="w-4 h-4" /></button>
                          <span className="w-8 text-center font-black text-white italic">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.name, 1)} className="p-2 hover:text-brand transition-colors"><Plus className="w-4 h-4" /></button>
                        </div>
                        <div>
                          <p className="font-black italic text-white uppercase">{item.name}</p>
                          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">₹{item.appPrice} - ₹{hotelPrice} = ₹{item.appPrice - hotelPrice} Profit/Item</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-xl font-black italic text-emerald-400">+₹{profit}</p>
                        </div>
                        <button onClick={() => removeItem(item.name)} className="p-3 text-white/20 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {selectedItems.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[40px] space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-white/20">
                    <Calculator className="w-8 h-8" />
                  </div>
                  <p className="text-white/20 font-black italic uppercase tracking-widest text-sm">Select items to start calculation</p>
                </div>
              )}
            </div>
            
            {selectedItems.length > 0 && (
              <button 
                onClick={() => setSelectedItems([])}
                className="w-full py-5 bg-white/5 hover:bg-red-500/10 text-white/20 hover:text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-white/5"
              >
                Clear All Calculations
              </button>
            )}
          </div>
        </div>

        {/* Historical Insight Mini-Card */}
        <div className="bg-dark-surface p-8 rounded-[40px] border border-white/5 grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Total Sales Profit</p>
            <p className="text-3xl font-black italic text-white tracking-tighter">₹{analytics.netProfit}</p>
          </div>
          <div className="space-y-1 border-l border-white/5 pl-6">
            <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Total Order Count</p>
            <p className="text-3xl font-black italic text-white tracking-tighter">{analytics.totalOrders}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
