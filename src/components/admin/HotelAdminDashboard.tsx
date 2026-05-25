import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, storage } from '../../lib/firebase';
import { collection, addDoc, query, where, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Product, Hotel, Order } from '../../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, LayoutDashboard, Search, Filter, 
  ArrowUpDown, Image as ImageIcon, CheckCircle2, XCircle,
  TrendingUp, Star, Camera, X, Check, ArrowRight,
  Bell, Power, ShoppingBag, Clock, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '../../store/adminStore';

const ADMIN_CATEGORIES = [
  'Roti', 'Fast Food', 'Rice & Noodles', 'Biryani', 'Starters', 'Veg/Gravy', 'Mutton'
];

export default function HotelAdminDashboard() {
  const { user, logout } = useAdminStore();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortField, setSortField] = useState<'price' | 'profit' | 'name'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'Fast Food',
    gettingPrice: 0,
    hotelPrice: 0,
    profit: 0,
    description: '',
    isAvailable: true,
    image: '',
    type: 'food',
    hotelId: user?.hotelId || ''
  });

  // Calculate Profit automatically
  useEffect(() => {
    const profit = (formData.hotelPrice || 0) - (formData.gettingPrice || 0);
    setFormData(prev => ({ ...prev, profit }));
  }, [formData.gettingPrice, formData.hotelPrice]);

  useEffect(() => {
    if (user?.hotelId) {
      // Listen to Hotel status
      const hotelUnsub = onSnapshot(doc(db, 'hotels', user.hotelId), (doc) => {
        if (doc.exists()) {
          setHotel({ id: doc.id, ...doc.data() } as Hotel);
        }
      });

      // Listen to Products
      const productsQuery = query(collection(db, 'products'), where('hotelId', '==', user.hotelId));
      const productsUnsub = onSnapshot(productsQuery, (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      });

      // Listen to Orders
      const ordersQuery = query(collection(db, 'orders'), where('hotelId', '==', user.hotelId));
      const ordersUnsub = onSnapshot(ordersQuery, (snapshot) => {
        const newOrders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        // Check for new pending orders for notification sound
        if (newOrders.length > orders.length) {
            const hasNewPending = newOrders.some(no => no.status === 'pending' && !orders.find(o => o.id === no.id));
            if (hasNewPending) {
                const audio = new Audio('/notification.mp3');
                audio.play().catch(e => console.log('Audio play failed', e));
                toast('New Order Received!', { icon: '🔔' });
            }
        }
        setOrders(newOrders.sort((a, b) => b.createdAt - a.createdAt));
      });

      return () => {
        hotelUnsub();
        productsUnsub();
        ordersUnsub();
      };
    }
  }, [user?.hotelId]);

  const toggleHotelStatus = async () => {
    if (!hotel) return;
    try {
      const newStatus = hotel.status === 'open' ? 'closed' : 'open';
      await updateDoc(doc(db, 'hotels', hotel.id), { status: newStatus });
      toast.success(`Hotel is now ${newStatus.toUpperCase()}`);
    } catch (e) { toast.error('Status update failed'); }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
      toast.success(`Order ${status.toUpperCase()}`);
    } catch (e) { toast.error('Failed to update order'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const storageRef = ref(storage, `products/${Date.now()}_${file.name}`);
    try {
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, image: url }));
      toast.success('Image Uploaded');
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!formData.image) return;
    if (formData.image.includes('firebasestorage')) {
      try {
        const imageRef = ref(storage, formData.image);
        await deleteObject(imageRef);
      } catch (e) { console.error("Storage delete error", e); }
    }
    setFormData(prev => ({ ...prev, image: '' }));
    toast.success('Image Removed');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast.error('Please fill name and category');
      return;
    }

    const finalData = {
      ...formData,
      hotelId: user?.hotelId,
      price: formData.hotelPrice,
      isTopPick: (formData.profit || 0) >= 30,
      updatedAt: Date.now()
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id!), finalData);
        toast.success('Item Updated');
      } else {
        await addDoc(collection(db, 'products'), { ...finalData, createdAt: Date.now() });
        toast.success('Item Added');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Fast Food',
      gettingPrice: 0,
      hotelPrice: 0,
      profit: 0,
      description: '',
      isAvailable: true,
      image: '',
      type: 'food',
      hotelId: user?.hotelId || ''
    });
  };

  const toggleAvailability = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id!), {
        isAvailable: !product.isAvailable
      });
      toast.success(`${product.name} is now ${!product.isAvailable ? 'Available' : 'Out of Stock'}`);
    } catch (e) { toast.error('Status update failed'); }
  };

  const deleteProduct = async (product: Product) => {
    if (window.confirm(`Delete ${product.name}?`)) {
      try {
        await deleteDoc(doc(db, 'products', product.id!));
        if (product.image?.includes('firebasestorage')) {
          await deleteObject(ref(storage, product.image));
        }
        toast.success('Item Deleted');
      } catch (e) { toast.error('Delete failed'); }
    }
  };

  const processedProducts = useMemo(() => {
    let result = [...products];
    if (searchTerm) result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (selectedCategory !== 'All') result = result.filter(p => p.category === selectedCategory);
    result.sort((a, b) => {
      if (sortField === 'name') return sortOrder === 'asc' ? (a.name || '').localeCompare(b.name || '') : (b.name || '').localeCompare(a.name || '');
      if (sortField === 'price') return sortOrder === 'asc' ? (a.hotelPrice || 0) - (b.hotelPrice || 0) : (b.hotelPrice || 0) - (a.hotelPrice || 0);
      if (sortField === 'profit') return sortOrder === 'asc' ? (a.profit || 0) - (b.profit || 0) : (b.profit || 0) - (a.profit || 0);
      return 0;
    });
    return result;
  }, [products, searchTerm, selectedCategory, sortField, sortOrder]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
      {/* Header */}
      <div className="flex justify-between items-center bg-dark-surface p-8 rounded-[40px] border border-white/5">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">{hotel?.name || 'Hotel Admin'}</h1>
          <p className="text-brand font-black uppercase tracking-[4px] text-[10px]">Inventory Control</p>
        </div>
        <button onClick={logout} className="px-6 py-3 bg-white/5 text-white/40 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">
          Logout
        </button>
      </div>

      {/* Simplified Product List */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
          <input 
            type="text" 
            placeholder="Search food items..." 
            className="w-full pl-16 pr-8 py-6 bg-dark-surface rounded-[24px] border border-white/5 focus:border-brand/40 outline-none text-white font-bold" 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {processedProducts.map(p => (
            <motion.div 
              key={p.id}
              layout
              className="bg-dark-surface p-6 rounded-[32px] border border-white/5 flex items-center justify-between group hover:border-brand/30 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden border border-white/10">
                  {p.image && <img src={p.image} className="w-full h-full object-cover" />}
                </div>
                <div>
                  <h3 className="text-xl font-black italic text-white uppercase leading-none">{p.name}</h3>
                  <p className="text-brand font-black text-sm mt-1 italic">₹{p.price}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={`text-[10px] font-black uppercase tracking-widest ${p.isAvailable ? 'text-emerald-500' : 'text-red-500'}`}>
                  {p.isAvailable ? 'In Stock' : 'Out of Stock'}
                </span>
                <button 
                  onClick={() => toggleAvailability(p)}
                  className={`w-16 h-8 rounded-full relative transition-all duration-300 ${p.isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`}
                >
                  <motion.div 
                    animate={{ x: p.isAvailable ? 32 : 4 }}
                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                  />
                </button>
              </div>
            </motion.div>
          ))}

          {processedProducts.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="text-6xl">🍲</div>
              <h3 className="text-xl font-black text-white/20 italic uppercase tracking-widest">No foods found</h3>
            </div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-3xl overflow-y-auto">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="bg-dark-surface w-full max-w-2xl rounded-[60px] p-10 md:p-16 shadow-2xl relative overflow-hidden border border-white/10 my-auto h-fit max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="absolute top-0 left-0 w-full h-2 bg-brand" />
              <div className="flex justify-between items-start mb-12">
                <div>
                  <span className="text-brand font-black uppercase tracking-[5px] text-[10px]">Inventory Entry</span>
                  <h2 className="text-4xl font-black tracking-tighter italic text-white uppercase">{editingProduct ? 'Update' : 'Add New'} Item</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
                {/* Image Upload Area */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Food Image</label>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full h-56 bg-dark-bg rounded-[32px] border-2 border-dashed border-white/10 hover:border-brand/40 transition-all cursor-pointer flex flex-col items-center justify-center relative overflow-hidden">
                    {formData.image && !uploading ? (
                      <>
                        <img src={formData.image} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 hover:opacity-100 transition-opacity">
                            <button type="button" className="p-4 bg-brand rounded-full text-white shadow-2xl"><Camera className="w-6 h-6" /></button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteImage(); }} className="p-4 bg-red-500 rounded-full text-white shadow-2xl"><Trash2 className="w-6 h-6" /></button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className={`p-6 rounded-full bg-white/5 mx-auto w-fit ${uploading ? 'animate-pulse' : ''}`}>
                          {uploading ? <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" /> : <Camera className="w-10 h-10 text-white/40" />}
                        </div>
                        <p className="font-black text-[10px] uppercase tracking-widest text-white/20">
                          {uploading ? 'Storing Digital Asset...' : 'Upload Food Photo (JPG/PNG)'}
                        </p>
                      </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Food Name</label>
                    <input required type="text" className="w-full px-8 py-5 bg-dark-bg rounded-[24px] border border-white/5 focus:border-brand outline-none text-white font-bold" placeholder="Crispy Gobi Chilli..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Category</label>
                    <select required className="w-full px-8 py-5 bg-dark-bg rounded-[24px] border border-white/5 outline-none text-brand font-black appearance-none cursor-pointer uppercase tracking-widest" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                      {ADMIN_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Getting Price</label>
                    <input required type="number" className="w-full px-8 py-5 bg-dark-bg rounded-[24px] border border-white/5 outline-none text-white font-bold" placeholder="0" value={formData.gettingPrice} onChange={e => setFormData({ ...formData, gettingPrice: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Hotel Price</label>
                    <input required type="number" className="w-full px-8 py-5 bg-dark-bg rounded-[24px] border border-white/5 outline-none text-brand font-black" placeholder="0" value={formData.hotelPrice} onChange={e => setFormData({ ...formData, hotelPrice: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Profit (Auto)</label>
                    <div className="w-full px-8 py-5 bg-white/5 rounded-[24px] border border-white/5 font-black text-emerald-400 italic text-xl flex items-center justify-center">₹{formData.profit}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Availability</label>
                  <button type="button" onClick={() => setFormData({ ...formData, isAvailable: !formData.isAvailable })} className={`w-full py-5 rounded-[24px] border flex items-center justify-center gap-4 transition-all font-black uppercase tracking-[4px] ${formData.isAvailable ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                    {formData.isAvailable ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                    {formData.isAvailable ? 'Currently Available' : 'Out of Stock'}
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30 pl-4">Description</label>
                  <textarea className="w-full px-8 py-5 bg-dark-bg rounded-[24px] border border-white/5 outline-none text-white font-bold resize-none" rows={3} placeholder="Tender cauliflower in spicy sauce..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <button type="submit" disabled={uploading} className="w-full py-6 bg-brand text-white rounded-[24px] font-black text-lg uppercase tracking-[6px] hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-brand/30 disabled:opacity-50 flex items-center justify-center gap-4">
                  {editingProduct ? 'Update Inventory Item' : 'Add to Collection'} <ArrowRight className="w-6 h-6" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
