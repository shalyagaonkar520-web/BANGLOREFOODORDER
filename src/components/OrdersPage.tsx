import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

import { useNavigate } from 'react-router-dom';
import { useSEO } from '../utils/seo';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface OrderItem {
  name: string;
  price: number;
  quantity?: number;
  finalQuantity?: number;
}

interface Order {
  id: string;
  createdAt: any;
  grandTotal: number;
  status: string;
  items: OrderItem[];
  orderType: string;
  trackingLink?: string;
}

export default function OrdersPage() {
  useSEO("My Orders", "View your past orders from Moms Magic.");
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const userPhone = localStorage.getItem('moms_magic_user_phone');

  useEffect(() => {
    if (!userPhone) {
      setLoading(false);
      return;
    }

    const normalizePhone = (phone: string) => {
      if (!phone) return '';
      return phone.replace(/\D/g, '').slice(-10);
    };

    const fetchOrders = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userPhone', '==', userPhone)
        );
        const snapshot = await getDocs(q);
        const fetched: Order[] = [];
        snapshot.forEach(docSnap => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        
        fetched.sort((a: any, b: any) => {
          const t1 = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
          const t2 = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
          return t2 - t1;
        });
        
        setOrders(fetched);
      } catch (err) {
        console.error('Error loading orders from Firestore:', err);
        // Fallback to local storage if Firestore fails
        const storedOrders = JSON.parse(localStorage.getItem('moms_magic_orders') || '[]');
        const userOrders = storedOrders.filter((o: any) => normalizePhone(o.userPhone) === normalizePhone(userPhone));
        userOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(userOrders);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userPhone]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!userPhone) {
    return (
      <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center space-y-6">
        <span className="material-symbols-outlined text-secondary/50 text-[80px]">inventory_2</span>
        <h2 className="font-headline-lg text-on-surface text-center">No Order History Found</h2>
        <p className="text-secondary text-body-lg font-bold text-center">Place your first order to start tracking!</p>
        <button onClick={() => navigate('/food')} className="px-8 py-3 bg-primary text-on-primary font-label-lg rounded-2xl shadow-sm hover:shadow-md transition-all">
          Browse Menu
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pb-32">
      <div className="max-w-3xl mx-auto space-y-10 mt-6">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ x: -5 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-surface rounded-full flex items-center justify-center border border-outline-variant hover:border-primary transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-on-surface">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="font-headline-lg text-on-surface">My Orders</h1>
            <p className="text-primary text-label-sm uppercase tracking-widest">{orders.length} Past Order(s)</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-surface rounded-[40px] border border-outline-variant/50 shadow-sm">
            <span className="material-symbols-outlined text-[64px] text-outline mb-4">inventory_2</span>
            <p className="text-secondary text-label-md uppercase tracking-widest">No orders found yet</p>
            <button onClick={() => navigate('/food')} className="mt-6 px-6 py-3 bg-primary/10 text-primary font-bold uppercase text-label-sm rounded-xl hover:bg-primary hover:text-on-primary transition-colors">
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-surface border border-outline-variant/50 rounded-[30px] p-6 hover:shadow-md transition-all shadow-sm">
                <div className="flex items-center justify-between border-b border-outline-variant/50 pb-4 mb-4">
                  <div>
                    <p className="text-secondary text-label-sm uppercase tracking-widest">Order ID: {order.id.slice(0, 8)}</p>
                    <p className="text-on-surface font-headline-sm mt-1">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Just now'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-on-surface font-headline-lg text-xl">₹{order.grandTotal}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mt-2 border ${
                      order.status === 'Confirmed' ? 'bg-primary/10 text-primary border-primary/20' :
                      order.status === 'Preparing' ? 'bg-tertiary-container text-on-tertiary-container border-tertiary/20' :
                      order.status === 'Out For Delivery' ? 'bg-secondary-container text-on-secondary-container border-secondary/20' :
                      order.status === 'Delivered' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                      'bg-surface-container text-on-surface border-outline-variant/50'
                    }`}>
                      {order.status || 'Pending'}
                    </span>
                  </div>
                </div>

                {order.deliveryLocation?.address && (
                  <div className="mb-4 pb-4 border-b border-outline-variant/50">
                    <p className="text-label-sm text-secondary uppercase font-bold tracking-widest mb-1">Delivery Address</p>
                    <p className="text-body-md font-bold text-on-surface-variant">{order.deliveryLocation.address}</p>
                  </div>
                )}

                <div className="space-y-2">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-body-sm">
                      <span className="text-on-surface font-medium">{item.quantity || item.finalQuantity || 1}x {item.name}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-secondary text-label-sm font-bold mt-2">+ {order.items.length - 3} more items</p>
                  )}
                </div>

                {order.trackingLink && (
                  <div className="mt-6 pt-4 border-t border-outline-variant/50">
                    <a 
                      href={order.trackingLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full block text-center py-3 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80 border border-outline-variant rounded-xl text-label-md font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[18px]">location_on</span> Track Order Live
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
