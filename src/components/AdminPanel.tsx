import React, { useState, useEffect, useRef, useMemo } from 'react';
import { db, storage } from '../lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Product } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, LayoutDashboard, Search, Filter, 
  ArrowUpDown, Image as ImageIcon, CheckCircle2, XCircle,
  TrendingUp, Star, LogIn, Camera, X, Check, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
const ADMIN_CATEGORIES = [
  'Roti', 'Fast Food', 'Rice & Noodles', 'Biryani', 'Starters', 'Veg/Gravy', 'Mutton'
];

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
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
    type: 'food'
  });

  // Calculate Profit automatically
  useEffect(() => {
    const profit = (formData.hotelPrice || 0) - (formData.gettingPrice || 0);
    setFormData(prev => ({ ...prev, profit }));
  }, [formData.gettingPrice, formData.hotelPrice]);

  useEffect(() => {
    if (isAdmin) {
      const unsubscribe = onSnapshot(collection(db, 'products'), (snapshot) => {
        setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      });
      return () => unsubscribe();
    }
  }, [isAdmin]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      setIsAdmin(true);
      toast.success('Admin Dashboard Unlocked');
    } else {
      toast.error('Invalid Credentials');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Optional: Image optimization logic could go here (e.g., canvas resize)
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
    // Only delete from storage if it's a firebase URL
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
      price: formData.hotelPrice, // Ensure main price field is updated
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
      type: 'food'
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

  // Smart Sorting and Filtering
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Search
    if (searchTerm) {
      result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc' 
          ? (a.name || '').localeCompare(b.name || '')
          : (b.name || '').localeCompare(a.name || '');
      }
      if (sortField === 'price') {
        return sortOrder === 'asc'
          ? (a.hotelPrice || 0) - (b.hotelPrice || 0)
          : (b.hotelPrice || 0) - (a.hotelPrice || 0);
      }
      if (sortField === 'profit') {
        return sortOrder === 'asc'
          ? (a.profit || 0) - (b.profit || 0)
          : (b.profit || 0) - (a.profit || 0);
      }
      return 0;
    });

    return result;
  }, [products, searchTerm, selectedCategory, sortField, sortOrder]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4 bg-dark-bg">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-dark-surface p-12 rounded-[40px] shadow-2xl border border-white/5 w-full max-w-md space-y-8 text-center">
          <div className="w-20 h-20 bg-brand/10 rounded-3xl flex items-center justify-center mx-auto text-brand mb-6"><LogIn className="w-10 h-10" /></div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-white">Admin Terminal</h1>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="password" placeholder="Passcode" className="w-full px-6 py-4 bg-dark-bg rounded-2xl border border-white/10 outline-none focus:border-brand text-center text-brand font-black tracking-widest" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full bg-brand text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-brand/20">Access Dashboard</button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-dark-surface p-8 md:p-12 rounded-[50px] border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 blur-[100px]" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 bg-brand/10 rounded-2xl border border-brand/20 text-brand"><LayoutDashboard className="w-8 h-8" /></div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">Management</h1>
            <p className="text-white/30 text-[10px] font-black uppercase tracking-[4px] mt-1">Live Inventory Control</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="px-8 py-5 bg-brand text-white rounded-2xl font-black flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand/30 text-sm uppercase tracking-widest">
          <Plus className="w-5 h-5" /> Add Food Item
        </button>
      </div>

      {/* Controls: Search & Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
          <input type="text" placeholder="Search item name..." className="w-full pl-14 pr-6 py-5 bg-dark-surface rounded-[24px] border border-white/5 outline-none focus:border-brand/40 text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative">
          <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
          <select className="w-full pl-14 pr-6 py-5 bg-dark-surface rounded-[24px] border border-white/5 outline-none focus:border-brand/40 text-white font-bold appearance-none cursor-pointer" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {ADMIN_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => {
                    setSortField('price');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className={`flex-1 px-6 py-5 rounded-[24px] border font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${sortField === 'price' ? 'bg-brand text-white border-brand' : 'bg-dark-surface text-white/40 border-white/5 hover:border-white/20'}`}
            >
                <ArrowUpDown className="w-4 h-4" /> Price {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
            <button 
                onClick={() => {
                    setSortField('profit');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                }}
                className={`flex-1 px-6 py-5 rounded-[24px] border font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${sortField === 'profit' ? 'bg-brand text-white border-brand' : 'bg-dark-surface text-white/40 border-white/5 hover:border-white/20'}`}
            >
                <ArrowUpDown className="w-4 h-4" /> Profit {sortField === 'profit' && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
        </div>
      </div>

      {/* Menu Management Table */}
      <div className="bg-dark-surface rounded-[40px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Visual</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40">Name & Category</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Cost Price</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Sale Price</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Profit</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-center">Status</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-white/40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {processedProducts.map(p => (
                <motion.tr key={p.id} layout className="hover:bg-white/5 transition-colors group">
                  <td className="p-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 relative group-hover:scale-110 transition-transform">
                      {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                      ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20"><ImageIcon className="w-6 h-6" /></div>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="text-white font-black italic tracking-tight text-lg leading-none">{p.name}</span>
                      <span className="text-[10px] font-black uppercase text-brand mt-1 tracking-widest">{p.category}</span>
                      <div className="flex gap-2 mt-2">
                        {(p.profit || 0) >= 40 && <span className="bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border border-emerald-500/20">High Profit 💰</span>}
                        {(p.profit || 0) >= 30 && <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border border-brand/20 flex items-center gap-1"><Star className="w-2 h-2 fill-current" /> Top Pick</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-white/40 font-black italic">₹{p.gettingPrice || 0}</span>
                  </td>
                  <td className="p-6 text-center">
                    <span className="text-brand font-black italic text-xl">₹{p.hotelPrice || p.price || 0}</span>
                  </td>
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center">
                        <span className={`font-black italic text-lg ${ (p.profit || 0) > 0 ? 'text-emerald-400' : 'text-red-400' }`}>
                            ₹{p.profit || 0}
                        </span>
                        <div className="flex items-center gap-1 text-[8px] font-black uppercase text-white/20">
                            <TrendingUp className="w-2 h-2" />
                            {p.hotelPrice ? Math.round((p.profit! / p.hotelPrice!) * 100) : 0}%
                        </div>
                    </div>
                  </td>
                  <td className="p-6 text-center">
                    <button onClick={() => toggleAvailability(p)} className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${p.isAvailable !== false ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500 hover:text-white'}`}>
                      {p.isAvailable !== false ? 'Available' : 'Out of Stock'}
                    </button>
                  </td>
                  <td className="p-6 text-right space-x-3">
                    <button onClick={() => { setEditingProduct(p); setFormData(p); setIsModalOpen(true); }} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-brand hover:bg-brand/10 transition-all border border-white/5"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => deleteProduct(p)} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-red-500 hover:bg-red-500/10 transition-all border border-white/5"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {processedProducts.length === 0 && (
              <div className="p-32 text-center space-y-4">
                  <div className="text-6xl">🔍</div>
                  <h3 className="text-2xl font-black text-white/20 italic uppercase tracking-widest">No matching items found</h3>
                  <button onClick={() => {setSearchTerm(''); setSelectedCategory('All');}} className="text-brand font-black underline uppercase tracking-widest text-[10px]">Reset Filters</button>
              </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
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
