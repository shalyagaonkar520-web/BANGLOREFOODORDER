import React, { useState, useEffect } from 'react';
import { Clock, Check, Plus, Edit, Trash2, Percent, Shield } from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function AdminRestaurantManager() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [form, setForm] = useState({
    name: '',
    cuisineTags: '',
    bannerUrl: '',
    address: '',
    lat: 14.9643,
    lng: 74.7212,
    openHours: '09:00-22:00',
    commissionPct: 10,
    isActive: true,
    ownerUserId: ''
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'restaurants'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setRestaurants(list);
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error('Failed to load restaurants');
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.ownerUserId) {
      toast.error('Name and Owner User ID are required');
      return;
    }

    const id = editingId || `res_${Date.now()}`;
    const payload = {
      name: form.name,
      cuisineTags: form.cuisineTags.split(',').map(t => t.trim()).filter(Boolean),
      bannerUrl: form.bannerUrl || '/chicken_biryani_new.png',
      address: form.address,
      lat: Number(form.lat),
      lng: Number(form.lng),
      openHours: form.openHours,
      commissionPct: Number(form.commissionPct),
      isActive: form.isActive,
      ownerUserId: form.ownerUserId
    };

    try {
      await setDoc(doc(db, 'restaurants', id), payload, { merge: true });
      toast.success(editingId ? 'Restaurant updated!' : 'Restaurant added!');
      resetForm();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save restaurant');
    }
  };

  const startEdit = (res: any) => {
    setEditingId(res.id);
    setForm({
      name: res.name,
      cuisineTags: (res.cuisineTags || []).join(', '),
      bannerUrl: res.bannerUrl || '',
      address: res.address || '',
      lat: res.lat || 14.9643,
      lng: res.lng || 74.7212,
      openHours: res.openHours || '09:00-22:00',
      commissionPct: res.commissionPct || 10,
      isActive: res.isActive !== false,
      ownerUserId: res.ownerUserId || ''
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this restaurant? This cannot be undone.')) return;
    try {
      await deleteDoc(doc(db, 'restaurants', id));
      toast.success('Restaurant deleted successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete restaurant');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      cuisineTags: '',
      bannerUrl: '',
      address: '',
      lat: 14.9643,
      lng: 74.7212,
      openHours: '09:00-22:00',
      commissionPct: 10,
      isActive: true,
      ownerUserId: ''
    });
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Restaurant Management</h2>
          <p className="text-zinc-500 text-sm">Create restaurants, assign kitchen managers, and set platform commission rates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4 h-fit">
          <h3 className="text-base font-bold text-zinc-900">{editingId ? 'Edit Restaurant' : 'Add New Restaurant'}</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Restaurant Name</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 outline-none text-sm font-semibold text-zinc-900 focus:border-[#FF5A1F] transition-all"
                placeholder="E.g., Moms Magic Dandeli"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Owner User ID (Kitchen Staff ID)</label>
              <input
                required
                type="text"
                value={form.ownerUserId}
                onChange={e => setForm({ ...form, ownerUserId: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 outline-none text-sm font-semibold text-zinc-900 focus:border-[#FF5A1F] transition-all"
                placeholder="E.g., kitchen_1_uid"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Commission %</label>
                <div className="relative">
                  <Percent className="w-5 h-5 w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="number"
                    value={form.commissionPct}
                    onChange={e => setForm({ ...form, commissionPct: Number(e.target.value) })}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 outline-none text-sm font-semibold text-zinc-900 focus:border-[#FF5A1F] transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Open Hours</label>
                <div className="relative">
                  <Clock className="w-5 h-5 w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={form.openHours}
                    onChange={e => setForm({ ...form, openHours: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 outline-none text-sm font-semibold text-zinc-900 focus:border-[#FF5A1F] transition-all"
                    placeholder="09:00-22:00"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Cuisines (comma separated)</label>
              <input
                type="text"
                value={form.cuisineTags}
                onChange={e => setForm({ ...form, cuisineTags: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 outline-none text-sm font-semibold text-zinc-900 focus:border-[#FF5A1F] transition-all"
                placeholder="Indian, Biryani, Chinese"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Banner Image URL</label>
              <input
                type="text"
                value={form.bannerUrl}
                onChange={e => setForm({ ...form, bannerUrl: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 outline-none text-sm font-semibold text-zinc-900 focus:border-[#FF5A1F] transition-all"
                placeholder="/chicken_biryani_new.png"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Address</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                className="w-full px-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 outline-none text-sm font-semibold text-zinc-900 focus:border-[#FF5A1F] transition-all"
                placeholder="Market Road, Yellapur"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.lat}
                  onChange={e => setForm({ ...form, lat: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 outline-none text-sm font-semibold text-zinc-900 focus:border-[#FF5A1F] transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={form.lng}
                  onChange={e => setForm({ ...form, lng: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 bg-zinc-50 rounded-xl border border-zinc-200 outline-none text-sm font-semibold text-zinc-900 focus:border-[#FF5A1F] transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b border-zinc-100 my-2">
              <span className="text-xs font-bold text-zinc-600">Website Active status</span>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={e => setForm({ ...form, isActive: e.target.checked })}
                className="w-4.5 h-4.5 accent-[#FF5A1F] cursor-pointer"
              />
            </div>

            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-zinc-100 text-zinc-600 font-semibold py-2.5 rounded-xl text-xs hover:bg-zinc-200 transition-all uppercase tracking-wider"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-[#FF5A1F] text-white font-semibold py-2.5 rounded-xl text-xs hover:bg-[#e54e19] transition-all uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5"
              >
                {editingId ? <Check className="w-5 h-5 w-3.5 h-3.5" /> : <Plus className="w-5 h-5 w-3.5 h-3.5" />}
                {editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </form>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="text-base font-bold text-zinc-900 text-left">Active Restaurants ({restaurants.length})</h3>

          {loading ? (
            <div className="py-20 text-center text-zinc-400 text-sm">Loading restaurants...</div>
          ) : restaurants.length === 0 ? (
            <div className="py-20 text-center text-zinc-400 text-sm">No restaurants registered. Add one using the form.</div>
          ) : (
            <div className="space-y-4">
              {restaurants.map((res) => (
                <div key={res.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-zinc-50 border border-zinc-200 rounded-xl gap-4 hover:shadow-sm transition-all text-left w-full">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-zinc-200 shrink-0 flex items-center justify-center text-xl font-bold text-[#FF5A1F]">
                      {res.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 flex items-center gap-1.5">
                        {res.name}
                        {res.isActive ? (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[8px] font-black uppercase rounded-full">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-50 border border-red-100 text-red-600 text-[8px] font-black uppercase rounded-full">Inactive</span>
                        )}
                      </h4>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase truncate max-w-[200px] sm:max-w-xs">{res.cuisineTags?.join(', ')}</p>
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-zinc-500 font-medium">
                        <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-zinc-400" /> Owner: <code className="text-zinc-600 font-semibold">{res.ownerUserId}</code></span>
                        <span className="flex items-center gap-1"><Percent className="w-3 h-3 text-zinc-400" /> Comm: <strong className="text-zinc-700">{res.commissionPct}%</strong></span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-zinc-400" /> {res.address}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                    <button
                      onClick={() => startEdit(res)}
                      className="px-3 py-1.5 bg-zinc-100 border border-zinc-200 hover:bg-zinc-200 text-zinc-600 font-black uppercase tracking-wider rounded-lg text-[9px] transition-all flex items-center gap-1"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(res.id)}
                      className="px-3 py-1.5 bg-red-50 border border-red-200 hover:bg-red-100 text-red-600 font-black uppercase tracking-wider rounded-lg text-[9px] transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
