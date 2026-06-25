import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Users, ShieldCheck, Wifi, Award, ArrowLeft, Star, 
  MapPin, Coffee, Check, ChevronRight, Loader2, PartyPopper 
} from 'lucide-react';
import { playSound, SOUNDS } from '../utils/audio';
import Header from './Header';

interface Room {
  id: string;
  name: string;
  price: number;
  description: string;
  size: string;
  view: string;
  image: string;
  rating: number;
  amenities: string[];
}

const ROOMS: Room[] = [
  {
    id: 'room-1',
    name: 'Royal Pool Villa',
    price: 24999,
    description: 'Ultimate resort privacy featuring a private heated infinity pool, landscaped garden view, and personal butler service.',
    size: '1,800 sq ft',
    view: 'Private Garden & Valley',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
    rating: 5.0,
    amenities: ['Private Infinity Pool', '24/7 Butler Service', 'Complimentary Minibar', 'High-Speed Wifi 6', 'Outdoor Rain Shower']
  },
  {
    id: 'room-2',
    name: 'Deluxe Pool View Suite',
    price: 12499,
    description: 'Elegant suite overlooking the central azure pool. Equipped with a marble jacuzzi, private balcony, and direct club lounge access.',
    size: '850 sq ft',
    view: 'Central Azure Pool',
    image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    rating: 4.9,
    amenities: ['In-room Jacuzzi', 'Private Balcony', 'Club Lounge Access', 'Espresso Machine', 'Premium King Bed']
  },
  {
    id: 'room-3',
    name: 'Executive Forest Balcony',
    price: 6999,
    description: 'Relaxing retreat nestled among high trees. Features high ceilings, modern aesthetics, and a private balcony overlooking Yellapur forest hills.',
    size: '520 sq ft',
    view: 'Mist Valley & Forest',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
    rating: 4.8,
    amenities: ['Forest Balcony', 'Smart TV & Soundbar', 'Complimentary Breakfast', 'Work Desk', 'Plush Robes']
  }
];

export default function ResortBookingPage() {
  const navigate = useNavigate();

  // Booking states
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = end.getTime() - start.getTime();
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return nights > 0 ? nights : 0;
  };

  const nights = calculateNights();
  const baseTotal = selectedRoom ? selectedRoom.price * nights : 0;
  const taxes = Math.round(baseTotal * 0.18); // 18% luxury resort tax
  const grandTotal = baseTotal + taxes;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;
    if (nights <= 0) {
      alert('Please select valid check-in and check-out dates.');
      return;
    }

    playSound(SOUNDS.CLICK);
    setIsBooking(true);

    // Simulate luxury booking processing
    setTimeout(() => {
      setIsBooking(false);
      const bookingRef = `MM-RES-${Math.floor(100000 + Math.random() * 900000)}`;
      setBookingSuccess({
        ref: bookingRef,
        room: selectedRoom,
        checkIn,
        checkOut,
        guests,
        nights,
        total: grandTotal
      });
      playSound(SOUNDS.ADD_TO_CART); // Success Sound
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-32 relative">
      <Header />

      {/* Luxury Background Glows */}
      <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-[#4CD964]/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[45%] h-[45%] bg-[#4CD964]/5 rounded-full blur-[180px] pointer-events-none" />

      {/* Outer wrapper */}
      <div className="max-w-[1400px] mx-auto px-6 pt-10 relative z-10 text-left">
        {/* Back Link */}
        <button 
          onClick={() => {
            playSound(SOUNDS.CLICK);
            navigate('/');
          }}
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        {/* Heading */}
        <div className="space-y-2 mb-12">
          <span className="text-[#4CD964] font-black uppercase tracking-[6px] text-xs">Moms Magic Premium</span>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
            Resort <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4CD964] to-[#A3F1B2]">Stay</span> Booking
          </h1>
          <p className="text-white/40 text-xs font-black uppercase tracking-[3px]">High-end accommodations in nature's lap</p>
        </div>

        <AnimatePresence mode="wait">
          {!bookingSuccess ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Left & Center Columns: Room Selection */}
              <div className="lg:col-span-2 space-y-8">
                <h3 className="text-lg font-black italic uppercase tracking-wider border-b border-white/5 pb-3">Available Accommodations</h3>
                
                {ROOMS.map((room) => {
                  const isChosen = selectedRoom?.id === room.id;
                  return (
                    <motion.div
                      key={room.id}
                      onClick={() => {
                        playSound(SOUNDS.CLICK);
                        setSelectedRoom(room);
                      }}
                      whileHover={{ y: -4 }}
                      className={`cursor-pointer rounded-[35px] overflow-hidden border transition-all duration-500 flex flex-col md:flex-row relative bg-[#0C101A] ${
                        isChosen 
                          ? 'border-[#4CD964] shadow-[0_15px_40px_rgba(76,217,100,0.15)] bg-[#0C101A]/90' 
                          : 'border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Image side */}
                      <div className="w-full md:w-[40%] h-64 md:h-auto relative min-h-[220px]">
                        <img src={room.image} className="w-full h-full object-cover" alt={room.name} />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3.5 py-1 rounded-full border border-white/10 flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-[#FFB700] text-[#FFB700]" />
                          <span className="text-[10px] font-black text-white">{room.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      {/* Content side */}
                      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between space-y-6">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <h4 className="text-2xl font-black italic uppercase tracking-tight text-white leading-none">
                              {room.name}
                            </h4>
                            <div className="text-right shrink-0">
                              <span className="text-[10px] font-bold text-white/40 block uppercase">Per Night</span>
                              <span className="text-xl font-black text-[#4CD964] italic">₹{room.price.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                          <p className="text-white/60 text-xs font-semibold leading-relaxed">
                            {room.description}
                          </p>
                        </div>

                        {/* Specs & Amenities */}
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider text-white/40 border-t border-white/5 pt-4">
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#4CD964]" /> Size: {room.size}</span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#4CD964]" /> View: {room.view}</span>
                          </div>

                          <div className="flex flex-wrap gap-2 pt-1">
                            {room.amenities.map((item, idx) => (
                              <span key={idx} className="bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg text-[9px] font-bold text-white/70">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Chosen indicator */}
                      {isChosen && (
                        <div className="absolute top-4 right-4 bg-[#4CD964] text-matte-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg border border-white/10">
                          <Check className="w-4 h-4 stroke-[3px]" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Right Column: Reservation Config Panel */}
              <div className="space-y-8">
                <h3 className="text-lg font-black italic uppercase tracking-wider border-b border-white/5 pb-3">Reservation Details</h3>
                
                <div className="bg-[#0C101A] border border-white/5 rounded-[40px] p-8 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#4CD964]/5 rounded-full blur-xl pointer-events-none" />

                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    {/* Check In */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4CD964] uppercase tracking-[3px] ml-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Check-In Date
                      </label>
                      <input 
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={checkIn}
                        onChange={e => {
                          setCheckIn(e.target.value);
                          playSound(SOUNDS.CLICK);
                        }}
                        className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-[#4CD964]/40 transition-all"
                      />
                    </div>

                    {/* Check Out */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4CD964] uppercase tracking-[3px] ml-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Check-Out Date
                      </label>
                      <input 
                        type="date"
                        required
                        min={checkIn || new Date().toISOString().split('T')[0]}
                        value={checkOut}
                        onChange={e => {
                          setCheckOut(e.target.value);
                          playSound(SOUNDS.CLICK);
                        }}
                        className="w-full px-5 py-4 bg-white/5 rounded-2xl border border-white/10 text-white font-bold outline-none focus:border-[#4CD964]/40 transition-all"
                      />
                    </div>

                    {/* Guest Count */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-[#4CD964] uppercase tracking-[3px] ml-1 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Total Guests
                      </label>
                      <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-2.5">
                        <button 
                          type="button"
                          onClick={() => {
                            playSound(SOUNDS.CLICK);
                            setGuests(prev => Math.max(1, prev - 1));
                          }}
                          className="w-10 h-10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white font-black text-lg rounded-xl flex items-center justify-center border border-white/5"
                        >
                          -
                        </button>
                        <span className="font-black text-base text-white">{guests} Guests</span>
                        <button 
                          type="button"
                          onClick={() => {
                            playSound(SOUNDS.CLICK);
                            setGuests(prev => Math.min(6, prev + 1));
                          }}
                          className="w-10 h-10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-white font-black text-lg rounded-xl flex items-center justify-center border border-white/5"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Room Selected Alert */}
                    {!selectedRoom && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl text-amber-300 text-xs font-semibold text-center leading-relaxed">
                        Please choose a villa or suite from the listings to calculate pricing totals.
                      </div>
                    )}

                    {/* Pricing details if room chosen */}
                    {selectedRoom && (
                      <div className="space-y-3.5 pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between text-xs font-semibold text-white/50">
                          <span>Room Selected:</span>
                          <span className="text-white font-black">{selectedRoom.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-white/50">
                          <span>Stay Duration:</span>
                          <span className="text-white font-black">{nights} night(s)</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-white/50">
                          <span>Base Price:</span>
                          <span className="text-white font-bold">₹{baseTotal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-semibold text-white/50">
                          <span>Taxes & Fees (18%):</span>
                          <span className="text-white font-bold">₹{taxes.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between pt-3.5 border-t border-white/10">
                          <span className="text-sm font-black uppercase text-[#4CD964] tracking-wider">Grand Total</span>
                          <span className="text-2xl font-black italic text-[#4CD964]">₹{grandTotal.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={!selectedRoom || nights <= 0 || isBooking}
                      className="w-full h-16 rounded-[22px] bg-gradient-to-r from-[#4CD964] to-[#A3F1B2] text-white font-black text-xs uppercase tracking-[3px] shadow-lg shadow-[#4CD964]/20 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center gap-2.5 disabled:opacity-30 disabled:pointer-events-none mt-4"
                    >
                      {isBooking ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing Booking...
                        </>
                      ) : (
                        <>
                          Reserve Stay
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* Booking confirmation screen ticket */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto py-12"
            >
              <div className="bg-[#0C101A]/85 backdrop-blur-2xl border border-[#4CD964]/30 rounded-[50px] overflow-hidden shadow-2xl relative p-8 md:p-14 text-center space-y-8">
                
                {/* Decorative border cutouts of a luxury physical ticket */}
                <div className="absolute top-1/2 -left-4 w-8 h-8 bg-[#050505] rounded-full border border-white/5 pointer-events-none z-20" />
                <div className="absolute top-1/2 -right-4 w-8 h-8 bg-[#050505] rounded-full border border-white/5 pointer-events-none z-20" />
                
                {/* Ticket Stamp */}
                <div className="w-24 h-24 bg-[#4CD964]/10 rounded-[35px] border border-[#4CD964]/25 flex items-center justify-center mx-auto text-[#4CD964] mb-4">
                  <PartyPopper className="w-12 h-12 animate-bounce" />
                </div>

                <div className="space-y-2">
                  <span className="bg-[#4CD964]/15 text-[#4CD964] text-[9px] font-black uppercase tracking-[3px] px-4 py-1.5 rounded-full border border-[#4CD964]/20">
                    Reservation Confirmed
                  </span>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white pt-2 leading-none">
                    Welcome to the Elite Stay
                  </h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-[2px] pt-1">Reference No: {bookingSuccess.ref}</p>
                </div>

                {/* Ticket Body Summary Table */}
                <div className="bg-black/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-4 text-left font-sans">
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">Accommodation</span>
                    <span className="text-sm font-black text-white">{bookingSuccess.room.name}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-wider block">Check-In</span>
                      <span className="text-sm font-bold text-white block mt-0.5">{bookingSuccess.checkIn}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-wider block">Check-Out</span>
                      <span className="text-sm font-bold text-white block mt-0.5">{bookingSuccess.checkOut}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">Guests Capacity</span>
                    <span className="text-sm font-black text-white">{bookingSuccess.guests} Guests Registered</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">Stay Duration</span>
                    <span className="text-sm font-black text-white">{bookingSuccess.nights} night(s)</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] font-black text-[#4CD964] uppercase tracking-wider">Paid via Card/UPI</span>
                    <span className="text-xl font-black italic text-[#4CD964]">₹{bookingSuccess.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Check In info */}
                <div className="space-y-4 text-white/55 text-xs font-semibold leading-relaxed">
                  <p>
                    ✓ A WhatsApp confirmation message carrying your QR code has been dispatched. Present this code at the resort main gate.
                  </p>
                  <p>
                    ✓ Rooms are ready for check-in by **12:00 PM** local time. Room keys will be handed to you at arrival.
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => {
                      playSound(SOUNDS.CLICK);
                      navigate('/food');
                    }}
                    className="flex-1 h-14 rounded-2xl bg-white text-matte-black font-black text-xs uppercase tracking-[2px] hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    Browse Food Menu
                  </button>
                  <button
                    onClick={() => {
                      playSound(SOUNDS.CLICK);
                      setBookingSuccess(null);
                      setSelectedRoom(null);
                    }}
                    className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[2px] hover:bg-white/10 hover:scale-105 transition-all flex items-center justify-center"
                  >
                    Book Another Room
                  </button>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
