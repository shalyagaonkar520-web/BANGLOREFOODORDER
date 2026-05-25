import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAdminStore } from '../store/adminStore';
import { AdminUser } from '../types';
import SuperAdminDashboard from './admin/SuperAdminDashboard';
import HotelAdminDashboard from './admin/HotelAdminDashboard';
import { motion } from 'framer-motion';
import { LogIn, ShieldCheck, Key, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPortal() {
  const { user, setUser } = useAdminStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // For Super Admin - hardcoded for first time or check admins collection
      if (email === 'momsmagic@gmail.com' && password === '1234') {
          const superAdmin: AdminUser = {
              id: 'super-admin-id',
              email: 'momsmagic@gmail.com',
              name: 'Super Admin',
              role: 'super_admin'
          };
          setUser(superAdmin);
          toast.success('Super Admin Access Granted');
          return;
      }

      // Check Firestore for other admins
      const adminsRef = collection(db, 'admins');
      const q = query(adminsRef, where('email', '==', email), where('password', '==', password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const adminData = querySnapshot.docs[0].data() as AdminUser;
        setUser({ id: querySnapshot.docs[0].id, ...adminData });
        toast.success(`Welcome back, ${adminData.name}`);
      } else {
        toast.error('Invalid Credentials');
      }
    } catch (e) {
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return user.role === 'super_admin' ? <SuperAdminDashboard /> : <HotelAdminDashboard />;
  }

  return (
    <div className="flex items-center justify-center min-h-[90vh] p-4 bg-dark-bg relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[150px]" />

        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-dark-surface p-10 md:p-16 rounded-[60px] shadow-2xl border border-white/5 w-full max-w-md space-y-10 text-center relative z-10"
        >
            <div className="w-24 h-24 bg-brand/10 rounded-3xl flex items-center justify-center mx-auto text-brand mb-8 border border-brand/20">
                <ShieldCheck className="w-12 h-12" />
            </div>
            
            <div className="space-y-2">
                <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Security Portal</h1>
                <p className="text-[10px] font-black uppercase text-white/20 tracking-[4px]">Management Authentication</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-brand transition-colors" />
                    <input 
                        type="email" 
                        placeholder="Admin Email" 
                        className="w-full pl-16 pr-8 py-5 bg-dark-bg rounded-[24px] border border-white/5 outline-none focus:border-brand/40 text-white font-bold transition-all" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        required
                    />
                </div>
                
                <div className="relative group">
                    <Key className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-brand transition-colors" />
                    <input 
                        type="password" 
                        placeholder="Access Key" 
                        className="w-full pl-16 pr-8 py-5 bg-dark-bg rounded-[24px] border border-white/5 outline-none focus:border-brand/40 text-white font-black tracking-widest transition-all" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        required
                    />
                </div>

                <button 
                    disabled={loading}
                    className="w-full bg-brand text-white py-6 rounded-[24px] font-black uppercase tracking-[4px] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-brand/30 disabled:opacity-50 flex items-center justify-center gap-3"
                >
                    {loading ? <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin" /> : <><LogIn className="w-6 h-6" /> Unlock Console</>}
                </button>
            </form>

            <div className="pt-4">
                <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
                    Authorized Personnel Only • IP Logged
                </p>
            </div>
        </motion.div>
    </div>
  );
}
