import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useBulkOrderStore } from '../store/bulkOrderStore';
import { useLocationStore } from '../store/locationStore';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useCityStore } from '../store/cityStore';
import { calculateDeliveryCharge } from '../types';
import { useSystemStore } from '../store/systemStore';
import { playSound, SOUNDS } from '../utils/audio';
import { useSEO } from '../utils/seo';
import { useAuthStore } from '../store/authStore';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

import { MapPin, ChevronLeft, Calendar, ShieldCheck, Send, Truck, Ticket, Wallet } from 'lucide-react';
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

  const { user, profile, deductWalletBalance } = useAuthStore();
  const [useWallet, setUseWallet] = useState(false);
  const [customWalletAmount, setCustomWalletAmount] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('cod');
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const activeItems = isBulkOrder
    ? [...bulkItems, ...cartItems.map((item) => ({ ...item, finalQuantity: item.quantity } as any))]
    : cartItems;
  const subtotal = isBulkOrder ? getBulkTotal() + cartTotal : cartTotal;

  const handleApplyCoupon = () => {
    const inputUpper = couponInput.trim().toUpperCase();
    const activeCoupons = settings.coupons || [];
    const matchedCoupon = activeCoupons.find(c => c.code.toUpperCase() === inputUpper && c.isActive);

    if (matchedCoupon) {
      if (subtotal >= matchedCoupon.minOrderValue) {
        setAppliedCoupon(matchedCoupon.code.toUpperCase());
        let msg = `${matchedCoupon.code} applied! `;
        if (matchedCoupon.type === 'free_delivery') msg += 'Free Delivery!';
        else if (matchedCoupon.type === 'fixed_discount') msg += `₹${matchedCoupon.value} off!`;
        else if (matchedCoupon.type === 'percent_discount') msg += `${matchedCoupon.value}% off!`;
        toast.success(msg);
      } else {
        toast.error(`${matchedCoupon.code} is valid only for orders above ₹${matchedCoupon.minOrderValue}`);
      }
    } else {
      setAppliedCoupon('');
      toast.error('Invalid or expired promo code');
    }
  };

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



  const distanceKm      = deliveryLocation?.distance ?? 0;
  const baseDeliveryCharge = calculateDeliveryCharge(distanceKm);

  // Free delivery before 2:00 PM every day
  const now = new Date();
  const isBeforeTwo = now.getHours() < 14;
  const activeCoupons = settings.coupons || [];
  const appliedCouponDetails = appliedCoupon ? activeCoupons.find(c => c.code.toUpperCase() === appliedCoupon) : null;

  const isTillJuly1st = new Date() < new Date('2026-07-02T00:00:00');
  const isFreeDelivery  = (appliedCouponDetails?.type === 'free_delivery') || isBeforeTwo || isTillJuly1st;
  const freeDeliveryReason = appliedCouponDetails?.type === 'free_delivery' ? `${appliedCouponDetails.code} Promo` : isTillJuly1st ? 'Free Delivery till July 1st 🎉' : isBeforeTwo ? 'Free Before 2 PM 🎉' : '';
  const deliveryCharge  = isFreeDelivery ? 0 : baseDeliveryCharge;
  const rainySeasonFee = 5;

  let couponDiscount = 0;
  if (appliedCouponDetails) {
    if (appliedCouponDetails.type === 'fixed_discount') {
      couponDiscount = appliedCouponDetails.value;
    } else if (appliedCouponDetails.type === 'percent_discount') {
      couponDiscount = (subtotal * appliedCouponDetails.value) / 100;
    }
  }

  const gstTaxRate = settings.taxRate ?? 5;
  const gstTaxAmount = Math.round(Math.max(0, subtotal - couponDiscount) * gstTaxRate / 100);
  const grandTotal      = Math.max(0, subtotal + deliveryCharge + rainySeasonFee + gstTaxAmount - couponDiscount);

  const maxWalletDeduction = user && profile ? Math.min(profile.walletBalance, grandTotal) : 0;
  
  // Calculate final wallet deduction used
  let walletDeduction = 0;
  if (user && profile && useWallet) {
    const inputAmount = parseFloat(customWalletAmount);
    if (!isNaN(inputAmount) && inputAmount > 0) {
      walletDeduction = Math.min(inputAmount, maxWalletDeduction);
    } else if (customWalletAmount === '') {
      walletDeduction = maxWalletDeduction;
    }
  }

  const payableAmount = Math.max(0, grandTotal - walletDeduction);

  const handleUseWalletToggle = (checked: boolean) => {
    setUseWallet(checked);
    if (checked && profile) {
      const maxPossible = Math.min(profile.walletBalance, grandTotal);
      setCustomWalletAmount(maxPossible.toString());
    } else {
      setCustomWalletAmount('');
    }
  };

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
        `🌧️ *Rainy Season Fee:* ₹${rainySeasonFee}`,
        `🚚 *Delivery:* ${isFreeDelivery ? `₹0 (${freeDeliveryReason})` : `₹${deliveryCharge}`}`,
        couponDiscount > 0 ? `🎟️ *Coupon Discount:* -₹${couponDiscount}` : '',
        walletDeduction > 0 ? `🎁 *Wallet Used:* -₹${walletDeduction.toFixed(2)}` : '',
        `💵 *GRAND TOTAL:* ₹${payableAmount.toFixed(2)}`,
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
        `🌧️ <b>Rainy Season Fee:</b> ₹${rainySeasonFee}`,
        `${isFreeDelivery ? `<b>Delivery Fee:</b> ₹0 (${freeDeliveryReason})` : `<b>Delivery Fee:</b> ₹${deliveryCharge}`}`,
        `${couponDiscount ? `<b>Coupon Discount:</b> -₹${couponDiscount}` : ''}`,
        `${walletDeduction ? `<b>Wallet Used:</b> -₹${walletDeduction.toFixed(2)}` : ''}`,
        `💵 <b>GRAND TOTAL:</b> ₹${payableAmount.toFixed(2)}`,
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

    const completeOrder = async (paymentId?: string, isOnline?: boolean, verifiedOrderId?: string) => {
      const orderId = verifiedOrderId || Date.now().toString();
      
      // Deduct from wallet if logged in and using wallet AND not online (since backend handles online wallet deduction)
      if (user && walletDeduction > 0 && !isOnline) {
        await deductWalletBalance(walletDeduction, orderId);
      }

      const waMsg    = buildWaMessage(paymentId);
      const tgMsg    = buildTgMessage(paymentId);
      const waNumber = isBulkOrder ? WHATSAPP_BULK_NUMBER : WHATSAPP_FOOD_NUMBER;
      const waUrl    = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMsg)}`;

      // Save order locally and in Firestore (only for COD/Wallet since backend did it for online)
      const order = {
        id: orderId,
        userId: user?.uid || null,
        userName: formData.name.trim(),
        userPhone: formData.phone.trim(),
        orderType: isBulkOrder ? 'bulk' : 'regular',
        items: activeItems,
        subtotal,
        rainySeasonFee,
        deliveryCharge,
        grandTotal,
        gstTaxAmount,
        walletAmountUsed: walletDeduction,
        payableAmount,
        paymentMethod: payableAmount === 0 ? 'wallet' : paymentMethod,
        paymentId: paymentId || null,
        deliveryLocation,
        status: 'pending',
        restaurantId: activeItems[0]?.restaurantId || 'res_1',
        createdAt: new Date().toISOString(),
        instructions: formData.additionalMessage.trim(),
      };

      if (!isOnline) {
        try {
          // Save to Firestore (max wait 1.5s so it doesn't block redirection on slow internet)
          await Promise.race([
            setDoc(doc(db, 'orders', orderId), order),
            new Promise(resolve => setTimeout(resolve, 1500))
          ]);
        } catch (err) {
          console.error('Failed to save order client-side:', err);
        }
      }

      try {
        // Save locally
        const existing = JSON.parse(localStorage.getItem('moms_magic_orders') || '[]');
        existing.push(order);
        localStorage.setItem('moms_magic_orders', JSON.stringify(existing));
      } catch (err) {
        console.error('Failed to save local storage history:', err);
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

      // Redirect to WhatsApp using a safer method for mobile browsers
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Fallback redirect just in case
      setTimeout(() => {
        window.location.href = waUrl;
      }, 500);

      // Navigate to tracking page
      setTimeout(() => {
        navigate(`/track/${orderId}`);
      }, 1000);
    };

    if (payableAmount > 0 && paymentMethod === 'online') {
      setIsSubmitting(true);

      // Load Razorpay
      const loadRazorpay = () =>
        new Promise<boolean>((resolve) => {
          const script  = document.createElement('script');
          script.src    = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check your connection.');
        setIsSubmitting(false);
        return;
      }

      try {
        // 1. Create Razorpay order on backend
        const orderRes = await fetch('/api/create-razorpay-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: payableAmount })
        });
        
        if (!orderRes.ok) {
          const errData = await orderRes.json();
          throw new Error(errData.error || 'Failed to initialize payment gateway order');
        }

        const rzpOrder = await orderRes.json();

        // 2. Open Razorpay Checkout with returned order_id
        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_StCGrX25cCk27O';
        const clientOrderId = Date.now().toString();

        const options = {
          key: razorpayKey,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: 'FreshTrack',
          description: 'Elite Food Order',
          order_id: rzpOrder.id,
          handler: async (response: any) => {
            try {
              toast.loading('Verifying payment securely...', { id: 'payment-verify' });
              
              // Prepare order structure to send to backend for secure recording
              const orderPayload = {
                id: clientOrderId,
                userId: user?.uid || null,
                userName: formData.name.trim(),
                userPhone: formData.phone.trim(),
                orderType: isBulkOrder ? 'bulk' : 'regular',
                items: activeItems,
                subtotal,
                rainySeasonFee,
                deliveryCharge,
                grandTotal,
                walletAmountUsed: walletDeduction,
                payableAmount,
                paymentMethod: 'online',
                deliveryLocation,
                status: 'pending',
                createdAt: new Date().toISOString(),
                instructions: formData.additionalMessage.trim(),
              };

              // 3. Verify on backend
              const verifyRes = await fetch('/api/verify-razorpay-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_signature: response.razorpay_signature,
                  order: orderPayload
                })
              });

              const verifyData = await verifyRes.json();
              toast.dismiss('payment-verify');

              if (!verifyRes.ok) {
                throw new Error(verifyData.error || 'Payment verification failed on backend');
              }

              // Complete client checkout steps
              await completeOrder(response.razorpay_payment_id, true, clientOrderId);
            } catch (err: any) {
              console.error('Payment verification failed:', err);
              toast.error(err.message || 'Verification failed. Contact support.');
            } finally {
              setIsSubmitting(false);
            }
          },
          prefill: { name: formData.name, contact: formData.phone },
          theme: { color: '#FF5A1F' },
          modal: { ondismiss: () => setIsSubmitting(false) },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (r: any) => {
          toast.error('Payment Failed: ' + r.error.description);
          setIsSubmitting(false);
        });
        rzp.open();
      } catch (err: any) {
        console.error(err);
        toast.error(err.message || 'Payment initialization failed.');
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(true);
      try {
        await completeOrder(undefined, false);
      } catch (err) {
        console.error(err);
        toast.error('Failed to place order. Please try again.');
      } finally {
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
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/food')}
          className="flex items-center gap-2 text-secondary font-bold uppercase tracking-widest text-[10px] hover:text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-secondary" /> Back to Menu
        </motion.button>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-headline-lg text-on-surface tracking-tighter leading-none">
          {isBulkOrder ? 'Grand ' : 'Final '}
          <span className="text-primary drop-shadow-sm">{isBulkOrder ? 'Booking' : 'Details'}</span>
        </h1>
        <p className="text-secondary font-body-sm tracking-wide">
          {isBulkOrder ? 'Confirm your exclusive event logistics' : 'Finalize your delivery details'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── User Info ── */}
        <div className="bg-surface p-5 sm:p-8 rounded-2xl sm:rounded-[30px] space-y-6 shadow-sm border border-outline-variant/30">
          <h2 className="text-sm font-headline-sm text-secondary uppercase tracking-widest">Your Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-label-sm text-primary uppercase">Name</label>
              <input
                required
                type="text"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold text-on-surface text-sm transition-all placeholder:text-outline shadow-inner"
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-label-sm text-primary uppercase">WhatsApp No.</label>
              <input
                required
                type="tel"
                inputMode="numeric"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold text-on-surface text-sm transition-all placeholder:text-outline shadow-inner"
                placeholder="+91 XXXXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          {/* Delivery Location */}
          <div className="space-y-2">
            <label className="text-label-sm text-primary uppercase">Delivery Location</label>
            {deliveryLocation ? (
              <div className="bg-surface-container-low rounded-xl border border-outline-variant/50 p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="text-primary w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-on-surface font-bold text-sm leading-relaxed">{deliveryLocation.address}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="px-3 py-1.5 bg-surface-container-high rounded-lg text-label-sm text-secondary border border-outline-variant">
                    {distanceKm} KM
                  </div>
                  <div className="px-3 py-1.5 rounded-lg text-label-sm border bg-primary-fixed text-primary border-primary/20">
                    ₹{deliveryCharge} Delivery
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={openLocationPicker}
                  className="w-full py-3 bg-surface rounded-xl text-label-sm uppercase tracking-widest hover:bg-surface-container-low transition-all flex items-center justify-center gap-2 text-secondary border border-outline-variant/50 shadow-sm"
                >
                  <MapPin className="w-4 h-4" /> Change Location
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={openLocationPicker}
                className="w-full py-10 bg-surface-container-low rounded-xl border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all flex flex-col items-center gap-3"
              >
                <MapPin className="text-primary w-8 h-8" />
                <span className="text-label-sm text-primary uppercase">Choose Delivery Location</span>
              </motion.button>
            )}
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <label className="text-label-sm text-primary uppercase">Special Instructions</label>
            <textarea
              rows={2}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold text-on-surface text-sm transition-all placeholder:text-outline resize-none shadow-inner"
              placeholder="E.g., Extra hot, gate code, ring the bell..."
              value={formData.additionalMessage}
              onChange={(e) => setFormData({ ...formData, additionalMessage: e.target.value })}
            />
          </div>
        </div>

        {/* ── Order Items ── */}
        <div className="bg-surface p-5 sm:p-8 rounded-2xl sm:rounded-[30px] space-y-6 shadow-sm border border-outline-variant/30">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-headline-sm text-secondary uppercase tracking-widest flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary" /> {isBulkOrder ? 'Event' : 'Order'} Items
            </h2>
            {isBulkOrder && (
              <div className="px-3 py-1.5 bg-primary-fixed rounded-full text-label-sm text-primary border border-primary/20 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" /> Bulk
              </div>
            )}
          </div>

          <div className="space-y-3">
            {activeItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 shadow-sm"
              >
                {item.image && (
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-outline-variant/50 shrink-0">
                    <img
                      src={item.image}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      alt={item.name}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline-sm text-sm text-on-surface uppercase tracking-tight truncate">{item.name}</h4>
                  <p className="text-label-sm text-secondary uppercase">
                    {isBulkOrder ? (item as any).finalQuantity : (item as any).quantity} Unit(s)
                  </p>
                  {item.items?.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {item.items.map((sub: string, i: number) => (
                        <li key={i} className="text-secondary text-[10px] flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-primary shrink-0" />
                          {sub}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <p className="text-base sm:text-lg font-headline-md text-primary shrink-0">
                  ₹{item.price * (isBulkOrder ? (item as any).finalQuantity : (item as any).quantity)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Summary, Coupon, Payment ── */}
        <div className="bg-surface p-5 sm:p-8 rounded-2xl sm:rounded-[30px] space-y-6 shadow-sm border border-outline-variant/30">
          {/* Free Delivery Before 2 PM Banner */}
          {isTillJuly1st ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-tertiary-container border border-tertiary-container rounded-xl">
              <span className="text-xl">🎉</span>
              <div>
                <p className="text-on-tertiary-container font-headline-sm text-xs uppercase tracking-widest">Free Delivery Active!</p>
                <p className="text-on-tertiary-container/80 text-[11px] font-medium">Free delivery is on us till July 1st!</p>
              </div>
            </div>
          ) : isBeforeTwo ? (
            <div className="flex items-center gap-3 px-4 py-3 bg-tertiary-container border border-tertiary-container rounded-xl">
              <span className="text-xl">🎉</span>
              <div>
                <p className="text-on-tertiary-container font-headline-sm text-xs uppercase tracking-widest">Free Delivery Active!</p>
                <p className="text-on-tertiary-container/80 text-[11px] font-medium">Orders before 2:00 PM get free delivery today</p>
              </div>
            </div>
          ) : null}
          {/* Promo Code */}
          <div className="space-y-3 pb-6 border-b border-outline-variant/30">
            <h3 className="text-label-sm text-outline uppercase">Promo Code</h3>
            <div className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-3 bg-surface-container-low rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-bold text-on-surface uppercase text-sm transition-all placeholder:text-outline min-w-0 shadow-inner"
                placeholder="ENTER CODE"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={handleApplyCoupon}
                className="px-5 py-3 bg-primary-fixed text-primary rounded-xl border border-primary/20 font-bold uppercase tracking-widest text-[11px] hover:bg-primary-fixed/80 transition-all shrink-0 shadow-sm"
              >
                Apply
              </motion.button>
            </div>
            {isFreeDelivery && (
              <p className="text-tertiary text-xs font-bold">✅ Free Delivery — {freeDeliveryReason}</p>
            )}
          </div>

          {/* Wallet Balance Integration */}
          {user && profile && profile.walletBalance > 0 && (
            <div className="space-y-4 pb-6 border-b border-outline-variant/30 text-left">
              <h3 className="text-label-sm text-primary uppercase">Wallet Balance</h3>
              <div className="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="use-wallet-cb"
                    checked={useWallet}
                    onChange={(e) => handleUseWalletToggle(e.target.checked)}
                    className="w-4.5 h-4.5 accent-primary cursor-pointer"
                  />
                  <label htmlFor="use-wallet-cb" className="text-xs font-bold uppercase text-on-surface select-none cursor-pointer tracking-wider">
                    Use Wallet Cash (Available: <span className="text-primary">₹{profile.walletBalance}</span>)
                  </label>
                </div>

                {useWallet && (
                  <div className="space-y-2 mt-1">
                    <p className="text-label-sm text-secondary uppercase tracking-widest">Amount to Deduct (₹)</p>
                    <input
                      type="number"
                      max={maxWalletDeduction}
                      min={0}
                      value={customWalletAmount}
                      onChange={(e) => setCustomWalletAmount(e.target.value)}
                      placeholder={`Max deduction: ₹${maxWalletDeduction}`}
                      className="w-full bg-surface border border-outline-variant/50 rounded-xl px-4 py-2.5 text-xs text-on-surface font-bold outline-none focus:border-primary/50 shadow-inner"
                    />
                    {walletDeduction > 0 && (
                      <p className="text-primary text-label-sm uppercase tracking-wider">
                        Applied Wallet Deduction: -₹{walletDeduction}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Price Breakdown */}
          <div className="space-y-3 pb-6 border-b border-outline-variant/30">
            <div className="flex justify-between items-center text-secondary font-bold text-xs uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-on-surface text-lg font-headline-lg">₹{subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-secondary font-bold text-xs uppercase tracking-widest">
              <span>Rainy Season Fee</span>
              <span className="text-on-surface text-lg font-headline-lg">₹{rainySeasonFee}</span>
            </div>
            <div className="flex justify-between items-center text-secondary font-bold text-xs uppercase tracking-widest">
              <span>GST Tax ({gstTaxRate}%)</span>
              <span className="text-on-surface text-lg font-headline-lg">₹{gstTaxAmount}</span>
            </div>
            <div className="flex justify-between items-center text-secondary font-bold text-xs uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                <span>Delivery</span>
              </div>
              <span className="text-lg font-headline-lg text-on-surface">
                {isFreeDelivery ? (
                  <div className="text-right">
                    <div>
                      <span className="line-through text-outline mr-2 text-sm">₹{baseDeliveryCharge}</span>
                      <span className="text-tertiary">FREE</span>
                    </div>
                    <p className="text-tertiary text-[10px] font-bold">{freeDeliveryReason}</p>
                  </div>
                ) : `₹${deliveryCharge}`}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between items-center text-tertiary font-bold text-xs uppercase tracking-widest">
                <span>Coupon Discount</span>
                <span className="text-lg font-headline-lg">-₹{couponDiscount}</span>
              </div>
            )}
            {walletDeduction > 0 && (
              <div className="flex justify-between items-center text-primary font-bold text-xs uppercase tracking-widest">
                <span>Wallet Discount</span>
                <span className="text-lg font-headline-lg">-₹{walletDeduction}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-end pb-2">
            <div>
              <p className="text-secondary text-label-sm uppercase tracking-widest mb-1">
                {walletDeduction > 0 ? 'Payable Amount' : 'Grand Total'}
              </p>
              <p className="text-4xl sm:text-5xl md:text-6xl font-headline-lg tracking-tighter text-on-surface">
                ₹{payableAmount}
              </p>
              {walletDeduction > 0 && (
                <p className="text-label-sm text-outline uppercase tracking-wider mt-1 text-left">
                  (Grand Total: ₹{grandTotal})
                </p>
              )}
            </div>
          </div>

          {/* Payment Method */}
          {payableAmount > 0 ? (
            <div className="space-y-3">
              <h3 className="text-label-sm text-outline uppercase tracking-widest">Payment Method</h3>
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setPaymentMethod('online')}
                  className={`py-4 rounded-xl border font-bold uppercase tracking-widest text-[11px] transition-all cursor-pointer shadow-sm ${
                    paymentMethod === 'online'
                      ? 'bg-primary-fixed border-primary text-primary shadow-[0_4px_15px_rgba(var(--color-primary-rgb),0.2)]'
                      : 'bg-surface border-outline-variant/50 text-secondary hover:border-outline-variant'
                  }`}
                >
                  UPI / Pay Online
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`py-4 rounded-xl border font-bold uppercase tracking-widest text-[11px] transition-all cursor-pointer shadow-sm ${
                    paymentMethod === 'cod'
                      ? 'bg-primary-fixed border-primary text-primary shadow-[0_4px_15px_rgba(var(--color-primary-rgb),0.2)]'
                      : 'bg-surface border-outline-variant/50 text-secondary hover:border-outline-variant'
                  }`}
                >
                  Cash on Delivery
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="bg-tertiary-container border border-tertiary-container px-4 py-3.5 rounded-2xl text-on-tertiary-container text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm">
              🎉 100% Covered By Wallet cash
            </div>
          )}

          {/* Submit */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-on-primary h-16 sm:h-20 rounded-2xl text-base sm:text-xl font-bold tracking-widest flex items-center justify-center gap-3 group disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:bg-primary/90 transition-colors"
          >
            {isSubmitting ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                <span>Processing...</span>
              </>
            ) : (
              <>
                CONFIRM ORDER
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </motion.button>

          <div className="flex items-center justify-center gap-2 text-secondary font-bold uppercase tracking-widest text-[9px]">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Secure End-to-End Encrypted
          </div>
        </div>
      </form>
    </div>
  );
}
