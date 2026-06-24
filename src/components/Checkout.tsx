import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useBulkOrderStore } from '../store/bulkOrderStore';
import { useLocationStore } from '../store/locationStore';
import { motion } from 'framer-motion';
import { Send, MapPin, Ticket, Calendar, ShieldCheck, Truck, ChevronLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCityStore } from '../store/cityStore';
import { calculateDeliveryCharge } from '../types';
import { useSystemStore } from '../store/systemStore';
import { playSound, SOUNDS } from '../utils/audio';
import { useSEO } from '../utils/seo';

import DeliveryAnimation from './DeliveryAnimation';

const TELEGRAM_BOT_TOKEN = '8828362126:AAGbOzb8Q9Jhi29Bp6sQ_Q6hRo4Xj2SGfQg';
const TELEGRAM_CHAT_ID   = '-1003803637741';
const WHATSAPP_BULK_NUMBER = '917483187572';
const WHATSAPP_FOOD_NUMBER = '919606001790';

const escHtml = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Sends a Telegram message. Tries server proxy first, falls back to direct API call.
async function sendTelegramMessage(text: string): Promise<void> {
  const payload = JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' });

  const direct = () =>
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    }).then(async (r) => {
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error((d as any).description || 'Telegram direct error');
      }
    });

  // Wrap proxy in a manual timeout (avoids AbortSignal.timeout which crashes on Safari iOS)
  const proxyWithTimeout = (): Promise<boolean> =>
    new Promise((resolve) => {
      const timer = setTimeout(() => resolve(false), 8000);
      fetch('/api/send-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
        keepalive: true,
      })
        .then((r) => { clearTimeout(timer); resolve(r.ok); })
        .catch(() => { clearTimeout(timer); resolve(false); });
    });

  try {
    const proxyOk = await proxyWithTimeout();
    if (!proxyOk) {
      console.warn('⚠️ Proxy failed, using direct Telegram call');
      await direct();
    } else {
      console.log('✅ Telegram sent via proxy');
    }
  } catch {
    try {
      await direct();
      console.log('✅ Telegram sent via direct call');
    } catch (e) {
      console.error('❌ Both Telegram paths failed:', e);
    }
  }
}

const DECORATION_PRICES = { balloons: 150, spray: 50, candles: 30 };

export default function Checkout() {
  useSEO('Checkout', 'Finalize delivery details and confirm your elite culinary order at Moms Magic.');
  const navigate = useNavigate();
  const isBulkOrder = localStorage.getItem('moms_magic_order_type') === 'bulk';

  const { items: cartItems, total: cartTotal, clearCart } = useCartStore();
  const bulkStore = useBulkOrderStore();
  const { bulkItems, getGrandTotal: getBulkTotal, cake, decoration, additionalServices, resetBulkOrder } = bulkStore;

  const { selectedCity } = useCityStore();
  const { deliveryLocation, openLocationPicker, isLoading } = useLocationStore();
  const [formData, setFormData] = useState({ name: '', phone: '', additionalMessage: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const settings = useSystemStore((s) => s.settings);

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const handleApplyCoupon = () => {
    if (couponInput.trim().toUpperCase() === 'WINNER') {
      setAppliedCoupon('WINNER');
      toast.success('WINNER promo applied! Free Delivery!');
    } else {
      setAppliedCoupon('');
      toast.error('Invalid promo code');
    }
  };

  const activeItems = isBulkOrder
    ? [...bulkItems, ...cartItems.map((item) => ({ ...item, finalQuantity: item.quantity } as any))]
    : cartItems;
  const subtotal = isBulkOrder ? getBulkTotal() + cartTotal : cartTotal;

  React.useEffect(() => { window.scrollTo(0, 0); }, []);

  // Check store open / restore saved user info
  React.useEffect(() => {
    const adminToken = localStorage.getItem('moms_magic_admin_token');
    const userPhone  = localStorage.getItem('moms_magic_user_phone');
    const isAdmin =
      adminToken === 'mock-jwt-admin-token-123456' ||
      userPhone === '+917483187572' ||
      userPhone === '+919606001790' ||
      userPhone === '7483187572' ||
      userPhone === '9606001790';

    const isStoreOpen = () => {
      if (settings.websiteStatus === 'OFF' || settings.emergencyStop) return false;
      const now = new Date();
      const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      return settings.openTime <= settings.closeTime
        ? cur >= settings.openTime && cur <= settings.closeTime
        : cur >= settings.openTime || cur <= settings.closeTime;
    };

    if (!isStoreOpen() && !isAdmin) {
      toast.error('Ordering is closed! Redirecting to menu.', { id: 'ordering-closed' });
      navigate('/food');
      return;
    }
    const savedName  = localStorage.getItem('moms_magic_user_name');
    const savedPhone = localStorage.getItem('moms_magic_user_phone');
    if (savedName || savedPhone) {
      setFormData((prev) => ({ ...prev, name: savedName || '', phone: savedPhone || '' }));
    }
  }, [settings, navigate]);

  // Force COD when within 5 km, force online when beyond
  React.useEffect(() => {
    const dist = deliveryLocation?.distance ?? 0;
    setPaymentMethod(dist > 5 ? 'online' : 'cod');
  }, [deliveryLocation]);

  const distanceKm      = deliveryLocation?.distance ?? 0;
  const baseDeliveryCharge = calculateDeliveryCharge(distanceKm);

  // Free delivery before 2:00 PM every day
  const now = new Date();
  const isBeforeTwo = now.getHours() < 14;
  const isFreeDelivery  = appliedCoupon === 'WINNER' || isBeforeTwo;
  const freeDeliveryReason = appliedCoupon === 'WINNER' ? 'WINNER Promo' : isBeforeTwo ? 'Free Before 2 PM 🎉' : '';
  const deliveryCharge  = isFreeDelivery ? 0 : baseDeliveryCharge;
  const gst = Math.round(subtotal * 0.05);
  const rainySeasonFee = 5;
  const grandTotal      = subtotal + deliveryCharge + gst + rainySeasonFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validate store open
    const isStoreOpen = () => {
      if (settings.websiteStatus === 'OFF' || settings.emergencyStop) return false;
      const now = new Date();
      const cur = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      return settings.openTime <= settings.closeTime
        ? cur >= settings.openTime && cur <= settings.closeTime
        : cur >= settings.openTime || cur <= settings.closeTime;
    };

    const adminToken = localStorage.getItem('moms_magic_admin_token');
    const isAdmin = adminToken === 'mock-jwt-admin-token-123456';

    if (!isStoreOpen() && !isAdmin) {
      toast.error('Ordering is temporarily closed!');
      return;
    }
    if (!formData.name.trim())                      { toast.error('Please enter your name'); return; }
    if (!formData.phone.trim() || formData.phone.length < 10) { toast.error('Please enter a valid phone number'); return; }
    if (!deliveryLocation)                          { toast.error('Please select a delivery location'); openLocationPicker(); return; }
    if (deliveryLocation.distance > 12)             { toast.error('Sorry, not deliverable (location is >12km)'); return; }
    if (distanceKm > 5 && paymentMethod === 'cod')  { toast.error('COD not available beyond 5km. Please pay online.'); return; }
    if (distanceKm <= 5 && paymentMethod === 'online') { toast.error('Online payment is only for deliveries above 5km.'); return; }

    localStorage.setItem('moms_magic_user_name',  formData.name.trim());
    localStorage.setItem('moms_magic_user_phone', formData.phone.trim());

    // ── CRITICAL FIX: Open the WhatsApp window BEFORE any async work ──
    // Mobile browsers block window.open() called after an await. Opening it here
    // (synchronously inside the click/submit handler) ensures it is never blocked.
    const mapsViewLink = `https://www.google.com/maps?q=${deliveryLocation.lat},${deliveryLocation.lng}`;
    const mapsNavLink  = `https://www.google.com/maps/dir/?api=1&destination=${deliveryLocation.lat},${deliveryLocation.lng}`;

    const buildWaMessage = (paymentId?: string) => {
      let orderDetails = '';
      if (isBulkOrder) {
        const decos = [
          decoration.balloons > 0 && `${decoration.balloons}x Balloons`,
          decoration.spray    > 0 && `${decoration.spray}x Spray`,
          decoration.candles  > 0 && `${decoration.candles}x Candles`,
        ].filter(Boolean).join(', ');
        orderDetails = [
          `🛒 *FOOD ITEMS:*`,
          bulkItems.map((i) => `• ${i.name} (${i.finalQuantity} units)`).join('\n'),
          cake.required ? `🎂 *Cake:* ${cake.size} - "${cake.text}"` : '',
          decos         ? `🎈 *Decorations:* ${decos}` : '',
          additionalServices.disposablePlates ? `🍽️ Disposable plates added` : '',
          additionalServices.setupServing     ? `👨‍🍳 Setup & Serving team added` : '',
        ].filter(Boolean).join('\n');
      } else {
        orderDetails = `🛒 *ITEMS:*\n` + cartItems.map((item) => {
          let line = `• ${item.quantity}x ${item.name}`;
          if (item.items?.length) line += `\n  (${item.items.join(', ')})`;
          return line;
        }).join('\n');
      }
      return [
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
        `📝 *GST (5%):* ₹${gst}`,
        `🌧️ *Rainy Season Fee:* ₹${rainySeasonFee}`,
        `🚚 *Delivery:* ${isFreeDelivery ? `₹0 (Free - ${freeDeliveryReason})` : `₹${deliveryCharge}`}`,
        `💵 *GRAND TOTAL:* ₹${grandTotal}`,
        paymentId ? `✅ *PAYMENT DONE:* ${paymentId}` : `⚠️ *PAYMENT:* Cash on Delivery`,
        ``,
        `🗺️ *View Map:* ${mapsViewLink}`,
        `🚗 *Navigate:* ${mapsNavLink}`,
        formData.additionalMessage.trim() ? `📝 *Note:* ${formData.additionalMessage.trim()}` : '',
        ``,
        `━━━━━━━━━━━━━━━━`,
        `🚀 *WANT TO ORDER AGAIN?*`,
        `👉 https://momsmagic.shop`,
        `━━━━━━━━━━━━━━━━`,
      ].filter((l) => l !== '').join('\n');
    };

    const buildTgMessage = (paymentId?: string) => {
      let tgDetails = '';
      if (isBulkOrder) {
        const decos = [
          decoration.balloons > 0 && `${decoration.balloons}x Balloons`,
          decoration.spray    > 0 && `${decoration.spray}x Spray`,
          decoration.candles  > 0 && `${decoration.candles}x Candles`,
        ].filter(Boolean).join(', ');
        tgDetails = [
          `🛒 <b>FOOD ITEMS:</b>`,
          bulkItems.map((i) => `• ${escHtml(i.name)} (${i.finalQuantity} units)`).join('\n'),
          cake.required ? `🎂 <b>Cake:</b> ${escHtml(cake.size)} - "${escHtml(cake.text)}"` : '',
          decos         ? `🎈 <b>Decorations:</b> ${escHtml(decos)}` : '',
          additionalServices.disposablePlates ? `🍽️ Disposable plates added` : '',
          additionalServices.setupServing     ? `👨‍🍳 Setup &amp; Serving team added` : '',
        ].filter(Boolean).join('\n');
      } else {
        tgDetails = `🛒 <b>ITEMS:</b>\n` + cartItems.map((item) => {
          let line = `• ${item.quantity}x ${escHtml(item.name)}`;
          if (item.items?.length) line += `\n  (${item.items.map(escHtml).join(', ')})`;
          return line;
        }).join('\n');
      }
      return [
        isBulkOrder ? `🎉 <b>NEW BULK / PARTY ORDER!</b> 🎉` : `📦 <b>NEW ORDER!</b> 📦`,
        ``,
        `👤 <b>Name:</b> ${escHtml(formData.name.trim())}`,
        `📞 <b>Phone:</b> ${escHtml(formData.phone.trim())}`,
        `📍 <b>City:</b> ${escHtml(selectedCity?.name || 'Unknown')}`,
        `🏠 <b>Address:</b> ${escHtml(deliveryLocation.address)}`,
        `📏 <b>Distance:</b> ${distanceKm}km`,
        ``,
        tgDetails,
        ``,
        `💰 <b>Subtotal:</b> ₹${subtotal}`,
        `📝 <b>GST (5%):</b> ₹${gst}`,
        `🌧️ <b>Rainy Season Fee:</b> ₹${rainySeasonFee}`,
        `🚚 <b>Delivery:</b> ${isFreeDelivery ? '₹0 (Free - WINNER Promo)' : `₹${deliveryCharge}`}`,
        `💵 <b>GRAND TOTAL:</b> ₹${grandTotal}`,
        paymentId ? `✅ <b>PAYMENT DONE:</b> ${escHtml(paymentId)}` : `⚠️ <b>PAYMENT:</b> Cash on Delivery`,
        ``,
        `🗺️ <b>View Map:</b> ${escHtml(mapsViewLink)}`,
        `🚗 <b>Navigate:</b> ${escHtml(mapsNavLink)}`,
        formData.additionalMessage.trim() ? `📝 <b>Note:</b> ${escHtml(formData.additionalMessage.trim())}` : '',
        ``,
        `━━━━━━━━━━━━━━━━`,
        `🚀 <b>WANT TO ORDER AGAIN?</b>`,
        `👉 https://momsmagic.shop`,
        `━━━━━━━━━━━━━━━━`,
      ].filter((l) => l !== '').join('\n');
    };

    const completeOrder = async (paymentId?: string) => {
      const waMsg    = buildWaMessage(paymentId);
      const tgMsg    = buildTgMessage(paymentId);
      const waNumber = isBulkOrder ? WHATSAPP_BULK_NUMBER : WHATSAPP_FOOD_NUMBER;
      const waUrl    = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;

      // Save order locally
      try {
        const order = {
          id: Date.now().toString(),
          userName: formData.name.trim(),
          userPhone: formData.phone.trim(),
          orderType: isBulkOrder ? 'bulk' : 'regular',
          items: activeItems,
          subtotal,
          gst,
          rainySeasonFee,
          deliveryCharge,
          grandTotal,
          paymentMethod,
          paymentId: paymentId || null,
          deliveryLocation,
          status: 'pending',
          createdAt: new Date().toISOString(),
          instructions: formData.additionalMessage.trim(),
        };
        const existing = JSON.parse(localStorage.getItem('moms_magic_orders') || '[]');
        existing.push(order);
        localStorage.setItem('moms_magic_orders', JSON.stringify(existing));
      } catch (err) {
        console.error('Failed to save order locally:', err);
      }

      // Send Telegram (fire and don't block redirect)
      sendTelegramMessage(tgMsg).catch(console.error);

      // Clear cart / bulk order
      if (isBulkOrder) {
        resetBulkOrder();
        localStorage.removeItem('moms_magic_order_type');
      } else {
        clearCart();
      }

      playSound(SOUNDS.ORDER_SUCCESS);
      toast.success('🎉 Order placed! Opening WhatsApp...');

      // Redirect to WhatsApp
      window.location.href = waUrl;
    };

    if (paymentMethod === 'online') {
      // Load Razorpay
      const loadRazorpay = () =>
        new Promise<boolean>((resolve) => {
          const script  = document.createElement('script');
          script.src    = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

      setIsSubmitting(true);
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check your connection.');
        setIsSubmitting(false);
        return;
      }

      const options = {
        key: 'rzp_live_T1Y1yu09Jbjo6b',
        amount: grandTotal * 100,
        currency: 'INR',
        name: 'Moms Magic',
        description: 'Elite Food Order',
        handler: async (response: any) => {
          await completeOrder(response.razorpay_payment_id);
          setIsSubmitting(false);
        },
        prefill: { name: formData.name, contact: formData.phone },
        theme: { color: '#4CD964' },
        modal: { ondismiss: () => setIsSubmitting(false) },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', (r: any) => {
        toast.error('Payment Failed: ' + r.error.description);
        setIsSubmitting(false);
      });
      rzp.open();
    } else {
      setIsSubmitting(true);
      try {
        await completeOrder(undefined);
      } catch (err) {
        console.error(err);
        toast.error('Failed to place order. Please try again.');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate('/food')}
          className="flex items-center gap-2 text-white/40 font-black uppercase tracking-[3px] text-[10px] hover:text-gold transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Menu
        </motion.button>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter italic uppercase leading-none">
          {isBulkOrder ? 'Grand ' : 'Final '}
          <span className="text-luxury-gold drop-shadow-xl">{isBulkOrder ? 'Booking' : 'Details'}</span>
        </h1>
        <p className="text-white/30 font-bold uppercase tracking-[4px] text-[9px]">
          {isBulkOrder ? 'Confirm your exclusive event logistics' : 'Finalize your elite culinary delivery'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── User Info ── */}
        <div className="luxury-card p-5 sm:p-8 rounded-2xl sm:rounded-[30px] space-y-6">
          <h2 className="text-sm font-black text-white/50 uppercase tracking-[4px]">Your Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gold/50 uppercase tracking-[3px]">Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 bg-black/40 rounded-xl border border-white/10 focus:border-gold/40 outline-none font-bold text-white text-sm transition-all placeholder:text-white/20"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gold/50 uppercase tracking-[3px]">WhatsApp No.</label>
              <input
                required
                type="tel"
                inputMode="numeric"
                className="w-full px-4 py-3 bg-black/40 rounded-xl border border-white/10 focus:border-gold/40 outline-none font-bold text-white text-sm transition-all placeholder:text-white/20"
                placeholder="+91 XXXXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Delivery Location */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gold/50 uppercase tracking-[3px]">Delivery Location</label>
            {deliveryLocation ? (
              <div className="bg-black/40 rounded-xl border border-white/10 p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                  <p className="text-white font-bold text-sm leading-relaxed">{deliveryLocation.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-black uppercase text-white/40 border border-white/5">
                    {distanceKm} KM
                  </div>
                  <div className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border bg-gold/10 text-gold border-gold/20">
                    ₹{deliveryCharge} Delivery
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openLocationPicker}
                  className="w-full py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gold/10 hover:text-gold transition-all flex items-center justify-center gap-2 text-white/40"
                >
                  <MapPin className="w-3.5 h-3.5" /> Change Location
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={openLocationPicker}
                className="w-full py-10 bg-black/40 rounded-xl border-2 border-dashed border-gold/20 hover:border-gold/50 transition-all flex flex-col items-center gap-3"
              >
                <MapPin className="w-8 h-8 text-gold" />
                <span className="text-[10px] font-black uppercase tracking-[3px] text-gold">Choose Delivery Location</span>
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gold/50 uppercase tracking-[3px]">Special Instructions</label>
            <textarea
              rows={2}
              className="w-full px-4 py-3 bg-black/40 rounded-xl border border-white/10 focus:border-gold/40 outline-none font-bold text-white text-sm transition-all placeholder:text-white/20 resize-none"
              placeholder="E.g., Extra hot, gate code, ring the bell..."
              value={formData.additionalMessage}
              onChange={(e) => setFormData({ ...formData, additionalMessage: e.target.value })}
            />
          </div>
        </div>

        {/* ── Order Items ── */}
        <div className="luxury-card p-5 sm:p-8 rounded-2xl sm:rounded-[30px] space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-white/50 uppercase tracking-[4px] flex items-center gap-2">
              <Ticket className="w-4 h-4 text-gold" /> {isBulkOrder ? 'Event' : 'Order'} Items
            </h2>
            {isBulkOrder && (
              <div className="px-3 py-1.5 bg-gold/10 rounded-full text-[10px] font-black uppercase text-gold border border-gold/20 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Bulk
              </div>
            )}
          </div>

          <div className="space-y-3">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 bg-black/30 rounded-xl border border-white/5"
              >
                {item.image && (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-white/5 shrink-0">
                    <img
                      src={item.image}
                      className="w-full h-full object-cover opacity-80"
                      referrerPolicy="no-referrer"
                      alt={item.name}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-sm text-white italic uppercase tracking-tight truncate">{item.name}</h4>
                  <p className="text-[10px] font-bold text-white/30 uppercase">
                    {isBulkOrder ? (item as any).finalQuantity : (item as any).quantity} Unit(s)
                  </p>
                  {item.items?.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {item.items.map((sub: string, i: number) => (
                        <li key={i} className="text-white/30 text-[10px] flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-gold shrink-0" />
                          {sub}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-base sm:text-lg font-black text-gold italic shrink-0">
                  ₹{item.price * (isBulkOrder ? (item as any).finalQuantity : (item as any).quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Summary, Coupon, Payment ── */}
        <div className="luxury-card p-5 sm:p-8 rounded-2xl sm:rounded-[30px] space-y-6">
          {/* Free Delivery Before 2 PM Banner */}
          {isBeforeTwo && (
            <div className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <span className="text-xl">🎉</span>
              <div>
                <p className="text-emerald-400 font-black text-xs uppercase tracking-widest">Free Delivery Active!</p>
                <p className="text-emerald-300/70 text-[11px] font-medium">Orders before 2:00 PM get free delivery today</p>
              </div>
            </div>
          )}
          {/* Promo Code */}
          <div className="space-y-3 pb-6 border-b border-white/5">
            <h3 className="text-[10px] font-black text-gold/50 uppercase tracking-[3px]">Promo Code</h3>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-3 bg-black/40 rounded-xl border border-white/10 focus:border-gold/40 outline-none font-bold text-white uppercase text-sm transition-all placeholder:text-white/20 min-w-0"
                placeholder="ENTER CODE"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                className="px-5 py-3 bg-gold/10 text-gold rounded-xl border border-gold/20 font-black uppercase tracking-widest text-[11px] hover:bg-gold/20 transition-all shrink-0"
              >
                Apply
              </button>
            </div>
            {isFreeDelivery && (
              <p className="text-emerald-400 text-xs font-bold">✅ Free Delivery — {freeDeliveryReason}</p>
            )}
          </div>

          {/* Price Breakdown */}
          <div className="space-y-3 pb-6 border-b border-white/5">
            <div className="flex justify-between items-center text-white/40 font-bold text-xs uppercase tracking-[3px]">
              <span>Subtotal</span>
              <span className="text-white text-lg font-black">₹{subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-white/40 font-bold text-xs uppercase tracking-[3px]">
              <span>GST (5%)</span>
              <span className="text-white text-lg font-black">₹{gst}</span>
            </div>
            <div className="flex justify-between items-center text-white/40 font-bold text-xs uppercase tracking-[3px]">
              <span>Rainy Season Fee</span>
              <span className="text-white text-lg font-black">₹{rainySeasonFee}</span>
            </div>
            <div className="flex justify-between items-center text-white/40 font-bold text-xs uppercase tracking-[3px]">
              <div className="flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-gold" />
                <span>Delivery</span>
              </div>
              <span className="text-lg font-black text-white">
                {isFreeDelivery ? (
                  <div className="text-right">
                    <div>
                      <span className="line-through text-white/30 mr-2 text-sm">₹{baseDeliveryCharge}</span>
                      <span className="text-emerald-400">FREE</span>
                    </div>
                    <p className="text-emerald-400/60 text-[10px] font-bold">{freeDeliveryReason}</p>
                  </div>
                ) : `₹${deliveryCharge}`}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-end pb-2">
            <div>
              <p className="text-gold/40 text-[10px] font-black uppercase tracking-[4px] mb-1">Grand Total</p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter text-white">₹{grandTotal}</p>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-gold/50 uppercase tracking-[3px]">Payment Method</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  if (distanceKm <= 5) { toast.error('Online payment is only for deliveries above 5km.'); return; }
                  setPaymentMethod('online');
                }}
                className={`py-4 rounded-xl border font-black uppercase tracking-widest text-[11px] transition-all ${
                  distanceKm <= 5
                    ? 'opacity-30 cursor-not-allowed bg-black/40 border-white/5 text-white/20'
                    : paymentMethod === 'online'
                    ? 'bg-gold/10 border-gold text-gold shadow-[0_0_20px_rgba(76,217,100,0.2)]'
                    : 'bg-black/40 border-white/10 text-white/40 hover:border-white/30'
                }`}
              >
                Pay Online
              </button>
              <button
                type="button"
                onClick={() => {
                  if (distanceKm > 5) { toast.error('COD not available beyond 5km.'); return; }
                  setPaymentMethod('cod');
                }}
                className={`py-4 rounded-xl border font-black uppercase tracking-widest text-[11px] transition-all ${
                  distanceKm > 5
                    ? 'opacity-30 cursor-not-allowed bg-black/40 border-white/5 text-white/20'
                    : paymentMethod === 'cod'
                    ? 'bg-gold/10 border-gold text-gold shadow-[0_0_20px_rgba(76,217,100,0.2)]'
                    : 'bg-black/40 border-white/10 text-white/40 hover:border-white/30'
                }`}
              >
                Cash on Delivery
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-luxury-gold h-16 sm:h-20 rounded-2xl text-base sm:text-xl tracking-[4px] sm:tracking-[6px] flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                CONFIRM ORDER
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-white/20 font-black uppercase tracking-[3px] text-[9px]">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            Secure End-to-End Encrypted
          </div>
        </div>
      </form>
    </div>
  );
}
