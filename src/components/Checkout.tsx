import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useBulkOrderStore } from '../store/bulkOrderStore';
import { useLocationStore } from '../store/locationStore';
import { motion } from 'framer-motion';
import { Send, MapPin, Navigation, Ticket, Locate, Loader2, Calendar, ShieldCheck, Truck, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCityStore } from '../store/cityStore';
import { calculateDeliveryCharge } from '../types';
import { useSystemStore } from '../store/systemStore';
import { playSound, SOUNDS } from '../utils/audio';
import { useSEO } from '../utils/seo';

const TELEGRAM_BOT_TOKEN = '8776724714:AAHJXpKyRWvVcXJQgBGH6DRq5WWijIfFH_Y';
const TELEGRAM_CHAT_ID = '-1003803637741';
const WHATSAPP_NUMBER = '917483187572';

const DECORATION_PRICES = {
  balloons: 150,
  spray: 50,
  candles: 30,
};

import DeliveryAnimation from './DeliveryAnimation';


export default function Checkout() {
  useSEO("Checkout", "Finalize delivery details and confirm your elite culinary order at Moms Magic.");
  const navigate = useNavigate();
  const isBulkOrder = localStorage.getItem('moms_magic_order_type') === 'bulk';
  
  // Regular Cart
  const { items: cartItems, total: cartTotal, clearCart } = useCartStore();
  
  // Bulk Order
  const bulkStore = useBulkOrderStore();
  const { bulkItems, getGrandTotal: getBulkTotal, eventDate, peopleCount, cake, decoration, additionalServices, resetBulkOrder } = bulkStore;

  const { selectedCity } = useCityStore();
  const { deliveryLocation, openLocationPicker, detectLocation, isLoading } = useLocationStore();
  const [formData, setFormData] = useState({ name: '', phone: '', additionalMessage: '' });
  const [orderSent, setOrderSent] = useState(false);
  const [waLink, setWaLink] = useState('');
  const settings = useSystemStore(state => state.settings);
  

  const [selectedDrink, setSelectedDrink] = useState<'Coca-Cola' | 'Sprite'>('Coca-Cola');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod');
  
  // Removed Razorpay States



  // Determine active data
  const activeItems = isBulkOrder ? bulkItems : cartItems;
  const subtotal = isBulkOrder ? getBulkTotal() : cartTotal;



  // Load saved user data and scroll to top
  React.useEffect(() => {
    window.scrollTo(0, 0);
    const savedName = localStorage.getItem('moms_magic_user_name');
    const savedPhone = localStorage.getItem('moms_magic_user_phone');
    if (savedName || savedPhone) {
      setFormData(prev => ({
        ...prev,
        name: savedName || '',
        phone: savedPhone || ''
      }));
    }
  }, []);

  // ═══ DELIVERY CHARGE LOGIC ═══
  const distanceKm = deliveryLocation?.distance ?? 0;
  let deliveryCharge = distanceKm <= 0 ? 0 : distanceKm <= 2 ? 20 : 20 + Math.ceil(distanceKm - 2) * 10;
  if (isBulkOrder) deliveryCharge = 0;
  const grandTotal = subtotal + deliveryCharge;

  const handleFinishAnimation = () => {
    if (isBulkOrder) {
      resetBulkOrder();
      localStorage.removeItem('moms_magic_order_type');
    } else {
      clearCart();
    }
    window.location.href = waLink;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check system status
    if (settings.websiteStatus === 'OFF' || settings.emergencyStop) {
      toast.error('Ordering is temporarily closed! Please try again during open hours.', {
        style: { background: '#161A22', color: '#fff', border: '1px solid #FF4D00' }
      });
      return;
    }

    if (!formData.name.trim()) { toast.error('Please enter your name'); return; }
    if (!formData.phone.trim() || formData.phone.length < 10) { toast.error('Please enter a valid phone number'); return; }
    if (!deliveryLocation) { toast.error('Please select a delivery location'); openLocationPicker(); return; }
    if (deliveryLocation.distance > 5) { toast.error('Sorry, not deliverable (location is >5km)'); return; }

    if (isBulkOrder) {
      // Event date validation removed
    }

    localStorage.setItem('moms_magic_user_name', formData.name.trim());
    localStorage.setItem('moms_magic_user_phone', formData.phone.trim());

    const completeOrderProcess = async (paymentId?: string) => {
      try {
        const mapsViewLink = `https://www.google.com/maps?q=${deliveryLocation.lat},${deliveryLocation.lng}`;
        const mapsNavLink = `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.lat},${deliveryLocation.lng}`;

      let orderDetails = '';
      if (isBulkOrder) {
        const selectedDecos = [
          decoration.balloons > 0 && `${decoration.balloons}x Balloons`,
          decoration.spray > 0 && `${decoration.spray}x Spray`,
          decoration.candles > 0 && `${decoration.candles}x Candles`
        ].filter(Boolean).join(', ');

        orderDetails = [
          `🛒 *FOOD ITEMS:*`,
          bulkItems.map(i => `• ${i.name} (${i.finalQuantity} units)`).join('\n'),
          ``,
          cake.required ? `🎂 *Cake:* ${cake.size} - "${cake.text}"` : '',
          selectedDecos ? `🎈 *Decorations:* ${selectedDecos}` : '',
          additionalServices.disposablePlates ? `🍽️ Disposable plates added` : '',
          additionalServices.setupServing ? `👨‍🍳 Setup & Serving team added` : '',
        ].filter(Boolean).join('\n');
      } else {
        orderDetails = `🛒 *ITEMS:*\n` + cartItems.map(item => {
          let line = `• ${item.quantity}x ${item.name}`;
          if (item.items && item.items.length > 0) {
            line += `\n  (Constituents: ${item.items.join(', ')})`;
          }
          return line;
        }).join('\n');
      }

      const noteSection = formData.additionalMessage.trim() ? `📝 *Note:* ${formData.additionalMessage.trim()}` : '';

      const waMessage = [
        isBulkOrder ? `🎉 *NEW BULK / PARTY ORDER!* 🎉` : `📦 *NEW ORDER!* 📦`,
        ``,
        `👤 *Name:* ${formData.name.trim()}`,
        `📞 *Phone:* ${formData.phone.trim()}`,
        `📍 *City:* ${selectedCity?.name || 'Unknown'}`,
        `🏠 *Address:* ${deliveryLocation.address}`,
        `📏 *Distance:* ${distanceKm}km`,
        ``,
        orderDetails,
        ``,
        `💰 *Subtotal:* ₹${subtotal}`,
        `🚚 *Delivery:* ${isBulkOrder ? 'FREE' : `₹${deliveryCharge}`}`,
        `💵 *GRAND TOTAL:* ₹${grandTotal}`,
        paymentId ? `✅ *PAYMENT DONE:* ${paymentId}` : `⚠️ *PAYMENT:* Cash on Delivery`,
        ``,
        `🗺️ *View Map:* ${mapsViewLink}`,
        `🚗 *Navigate:* ${mapsNavLink}`,
        noteSection,
        ``,
        `━━━━━━━━━━━━━━━━`,
        `🚀 *WANT TO ORDER AGAIN?*`,
        `👉 https://momsmagic.shop`,
        `━━━━━━━━━━━━━━━━`
      ].filter(line => line !== '').join('\n');
      const BULK_WHATSAPP_NUMBER = '917483187572';
      const FOOD_WHATSAPP_NUMBER = '919606001790';
      const waNumber = isBulkOrder ? BULK_WHATSAPP_NUMBER : FOOD_WHATSAPP_NUMBER;

      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;
      setWaLink(waUrl);


      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: waMessage, parse_mode: 'Markdown' })
      });

      if (isBulkOrder) {
        resetBulkOrder();
        localStorage.removeItem('moms_magic_order_type');
      } else {
        clearCart();
      }
      playSound(SOUNDS.ORDER_SUCCESS);
      toast.success('VIP Order placed! Redirecting to WhatsApp...');
      setTimeout(() => {
        window.location.href = waUrl;
      }, 1000);
      
      } catch (err) {
        console.error(err);
        toast.error('Failed to place order. Please try again.');
      }
    };

    await completeOrderProcess(undefined);
  };

  if (orderSent) {
    // Fallback if needed
    window.location.href = waLink;
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto p-6 py-20 space-y-16">
      <div className="space-y-6">
        <motion.button 
          whileHover={{ x: -5 }}
          onClick={() => navigate('/food')}
          className="flex items-center gap-3 text-text-muted font-black uppercase tracking-[3px] text-[10px] hover:text-gold transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Menu
        </motion.button>
        <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter italic uppercase leading-none">
          {isBulkOrder ? 'Grand ' : 'Final '} 
          <span className="text-luxury-gold drop-shadow-xl">{isBulkOrder ? 'Booking' : 'Details'}</span>
        </h1>
        <p className="text-text-muted font-bold uppercase tracking-[6px] text-[10px] opacity-40">
          {isBulkOrder ? 'Confirm your exclusive event logistics' : 'Finalize your elite culinary delivery'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* User Info */}
        <div className="luxury-card p-10 md:p-14 rounded-[50px] border-white/5 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gold/40 uppercase tracking-[4px] ml-1">Guest Name</label>
              <input required type="text" className="w-full px-8 py-5 bg-matte-black/50 rounded-2xl border border-white/10 focus:border-gold/30 outline-none font-bold text-white transition-all placeholder:text-white/5" placeholder="Your Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gold/40 uppercase tracking-[4px] ml-1">WhatsApp No.</label>
              <input required type="tel" className="w-full px-8 py-5 bg-matte-black/50 rounded-2xl border border-white/10 focus:border-gold/30 outline-none font-bold text-white transition-all placeholder:text-white/5" placeholder="+91..." value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-gold/40 uppercase tracking-[4px] ml-1">Delivery Destination</label>
            {deliveryLocation ? (
              <div className="bg-matte-black/50 rounded-3xl border border-white/10 p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <MapPin className="w-6 h-6 text-gold shrink-0" />
                  <p className="text-white font-bold text-sm leading-relaxed">{deliveryLocation.address}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase text-text-muted border border-white/5">{distanceKm} KM DISTANCE</div>
                  <div className="px-4 py-2 bg-gold/10 rounded-xl text-[10px] font-black uppercase text-gold border border-gold/20">{isBulkOrder ? 'FREE DELIVERY' : `₹${deliveryCharge} LOGISTICS`}</div>
                </div>
                <button 
                  type="button" 
                  onClick={detectLocation} 
                  disabled={isLoading}
                  className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold/10 hover:text-gold transition-all flex items-center justify-center gap-2 text-text-muted"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                  {isLoading ? 'Detecting...' : 'Detect My Location'}
                </button>
              </div>
            ) : (
              <button 
                type="button" 
                onClick={detectLocation} 
                className="w-full py-12 bg-matte-black/50 rounded-[35px] border-2 border-dashed border-gold/10 hover:border-gold/30 transition-all flex flex-col items-center gap-4"
              >
                {isLoading ? <Loader2 className="w-10 h-10 text-gold animate-spin" /> : <Locate className="w-10 h-10 text-gold" />}
                <span className="text-[10px] font-black uppercase tracking-[4px] text-gold">{isLoading ? 'Tracing Location...' : 'Auto Trace Location'}</span>
              </button>
            )}
          </div>



          <div className="space-y-3">
            <label className="text-[10px] font-black text-gold/40 uppercase tracking-[4px] ml-1">Special Instructions</label>
            <textarea rows={2} className="w-full px-8 py-5 bg-matte-black/50 rounded-2xl border border-white/10 focus:border-gold/30 outline-none font-bold text-white transition-all placeholder:text-white/5" placeholder="E.g., Extra hot, gate code, ring the bell..." value={formData.additionalMessage} onChange={e => setFormData({ ...formData, additionalMessage: e.target.value })} />
          </div>
        </div>

        {/* Order Details */}
        <div className="luxury-card p-10 md:p-14 rounded-[50px] border-white/5 space-y-10">
          <div className="flex items-center justify-between">
             <h2 className="text-2xl font-black italic uppercase flex items-center gap-4"><Ticket className="w-6 h-6 text-gold" /> {isBulkOrder ? 'Event' : 'Selection'} Content</h2>
             {isBulkOrder && <div className="flex items-center gap-3 px-4 py-2 bg-gold/10 rounded-full text-[10px] font-black uppercase text-gold border border-gold/20"><Calendar className="w-4 h-4" /> Bulk Order</div>}
          </div>
          
          <div className="space-y-6">
            {activeItems.map(item => (
              <div key={item.id} className="flex items-center justify-between gap-6 p-6 bg-matte-black/30 rounded-[30px] border border-white/5">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 shrink-0">
                    <img src={item.image} className="w-full h-full object-cover opacity-80" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-white italic uppercase tracking-tighter">{item.name}</h4>
                    <p className="text-[10px] font-bold text-text-muted/40 uppercase tracking-widest">{isBulkOrder ? (item as any).finalQuantity : (item as any).quantity} Unit(s)</p>
                    {item.items && item.items.length > 0 && (
                      <ul className="mt-2 space-y-0.5 text-left">
                        {item.items.map((subItem, sIdx) => (
                          <li key={sIdx} className="text-white/40 text-[10px] font-medium flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-gold shrink-0" />
                            {subItem}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-gold italic">₹{item.price * (isBulkOrder ? (item as any).finalQuantity : (item as any).quantity)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>




        {/* Total Summary */}
        <div className="luxury-card p-12 md:p-16 rounded-[60px] border-gold/5 relative overflow-hidden">
          <div className="space-y-6 mb-10 border-b border-white/5 pb-8">
            <div className="flex justify-between items-center text-text-muted font-bold text-[11px] uppercase tracking-[4px]">
              <span>Subtotal</span>
              <span className="text-white text-xl font-black">₹{subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-text-muted font-bold text-[11px] uppercase tracking-[4px]">
              <div className="flex items-center gap-2">
                 <Truck className="w-4 h-4 text-gold" />
                 <span>Delivery Fee</span>
              </div>
              <span className="text-white text-xl font-black">
                {isBulkOrder ? <span className="text-[#4CD964]">FREE</span> : `₹${deliveryCharge}`}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-end mb-12">
            <div className="space-y-2">
              <p className="text-gold/40 text-[11px] font-black uppercase tracking-[6px]">Investment Grand Total</p>
              <p className="text-6xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-2xl">₹{grandTotal}</p>
            </div>
          </div>


          <button 
            type="submit" 
            className="w-full btn-luxury-gold h-24 rounded-[30px] text-2xl tracking-[8px] flex items-center justify-center gap-5 group"
          >
            CONFIRM ORDER <Send className="w-7 h-7 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
          </button>
          
          <div className="flex items-center justify-center gap-3 mt-10 text-text-muted font-black uppercase tracking-[4px] text-[10px] opacity-20">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Elite End-to-End Encryption
          </div>
        </div>
      </form>
    </div>
  );
}
