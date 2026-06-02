import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Lock, Quote, Star, ChevronRight } from 'lucide-react';
import { DUMMY_REVIEWS } from '../data/reviews';
import Header from './Header';
import { playSound, SOUNDS } from '../utils/audio';

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleCardClick = (card: typeof cards[0]) => {
    if (card.comingSoon) return;
    playSound(SOUNDS.ADD_TO_CART); // Immersive pop sound
    navigate(card.route);
  };

  const cards = [
    {
      title: "ORDER",
      titleAccent: "FOOD",
      subtitle: "Luxury culinary experiences at your door",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop",
      route: "/food",
      color: "from-[#4CD964]/20 to-matte-black/40",
      badge: "VIP CHOICE ✨",
      comingSoon: false,
      isLocked: false
    },
    {
      title: "PARTY",
      titleAccent: "SPECIALS",
      subtitle: "Celebrations • Cakes • Decoration Setup",
      image: "https://images.unsplash.com/photo-1530101121860-702f82e3f267?w=1000&auto=format&fit=crop",
      route: "/bulk",
      color: "from-brand/20 to-matte-black/40",
      badge: "NEW ✨",
      comingSoon: false,
      isLocked: false
    },
    {
      title: "LOCKED",
      titleAccent: "SELECTION 🔒",
      subtitle: "Elite spirits, fine wines & craft cocktails",
      image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1000&auto=format&fit=crop",
      route: "/bar-menu",
      color: "from-[#FFB700]/25 to-matte-black/50",
      badge: "LOCKED AREA 🔒",
      comingSoon: false,
      isLocked: true
    }
  ];

  return (
    <div className="relative min-h-screen bg-matte-black text-text-main font-sans pb-32" ref={containerRef}>
      <Header />

      {/* BRANDING HEADER BANNER */}
      <div className="px-6 pt-8 pb-4 text-center">
        <h1 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter leading-none animate-shining-blink">
          Moms Magic 2.0
        </h1>
        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">
          Taste the magic of home • Yellapur's Premium Selection
        </p>
      </div>

      {/* 3D Menu Cards Collection */}
      <section className="relative z-20 px-6 py-12 max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="col-span-1 md:col-span-3 text-center mb-6 space-y-2">
          <h2 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            Explore <span className="text-[#4CD964]">Categories</span>
          </h2>
          <p className="text-white/40 font-bold uppercase tracking-[6px] text-[10px]">Curated for the elite palate</p>
        </div>

        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: idx * 0.2 }}
            onClick={() => handleCardClick(card)}
            className="group perspective-1000 cursor-pointer"
          >
            <motion.div
              whileHover={{ rotateY: 5, rotateX: -5, scale: 1.03 }}
              className={`relative h-[480px] sm:h-[550px] rounded-[40px] overflow-hidden luxury-card preserve-3d shadow-2xl border transition-all duration-500 ${
                card.isLocked 
                  ? 'border-[#FFB700]/30 animate-gold-blink shadow-[0_10px_30px_rgba(255,183,0,0.15)] bg-[#050505]' 
                  : 'border-white/5'
              }`}
            >
              {card.isLocked ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#050505] bg-[radial-gradient(circle_at_center,rgba(255,183,0,0.08)_0%,transparent_70%)]">
                  <motion.div 
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                    className="w-20 h-20 rounded-[28px] bg-gradient-to-br from-[#FFB700] to-[#FFD166] flex items-center justify-center shadow-[0_0_30px_rgba(255,183,0,0.3)] border border-white/10 mb-6"
                  >
                    <Lock className="w-8 h-8 text-matte-black" />
                  </motion.div>
                  <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
                    LOCKED
                  </h3>
                </div>
              ) : (
                <>
                  <img 
                    src={card.image} 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-50 mix-blend-luminosity group-hover:mix-blend-normal" 
                    alt="" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  
                  <div className="absolute inset-0 p-8 flex flex-col justify-end gap-5 translate-z-30 text-left">
                    <div className="space-y-1">
                      <h3 className="text-4xl font-black italic tracking-tighter leading-[0.9] uppercase text-white">
                        {card.title}<br />
                        <span className="text-[#4CD964] drop-shadow-lg">{card.titleAccent}</span>
                      </h3>
                      <p className="text-white/60 text-[10px] font-black uppercase tracking-[3px] max-w-[200px] leading-relaxed pt-2">
                        {card.subtitle}
                      </p>
                    </div>
                    <div className="pt-2">
                      {card.comingSoon ? (
                        <div className="inline-flex items-center gap-2.5 text-white/30 font-black text-[9px] uppercase tracking-[3px] bg-white/5 px-5 py-3 rounded-full border border-white/5">
                          <Lock className="w-3.5 h-3.5" /> Invitation Only
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-3 text-matte-black bg-[#4CD964] font-black text-[11px] uppercase tracking-[3px] px-7 py-3.5 rounded-full group-hover:gap-5 transition-all shadow-[0_10px_25px_rgba(76,217,100,0.25)]">
                          View Menu <ArrowRight className="w-4 h-4 text-matte-black" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full border border-white/20 bg-black/45 backdrop-blur-xl translate-z-20">
                    <span className="text-[9px] font-black uppercase tracking-[2px] text-white">{card.badge}</span>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        ))}
      </section>

      {/* Founder Teaser Section */}
      <section className="relative z-10 py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-white/5 to-[#4CD964]/5 backdrop-blur-2xl border border-white/10 rounded-[50px] overflow-hidden flex flex-col md:flex-row items-center gap-10 p-8 md:p-14"
          >
            <div className="w-full md:w-[35%] aspect-[3/4] rounded-[30px] overflow-hidden border border-white/10 shadow-2xl">
              <img src="/founder.jpg" className="w-full h-full object-cover" alt="Founder" />
            </div>
            <div className="flex-1 space-y-5 text-center md:text-left">
              <div className="space-y-1">
                <span className="text-[#4CD964] font-black uppercase tracking-[6px] text-[10px]">The Visionary</span>
                <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                  Shalya <span className="text-[#4CD964]">Gaonkar</span>
                </h2>
              </div>
              <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl font-medium">
                "I believe food is not just about eating — it’s about comfort, memories, and sharing special moments with family and friends."
              </p>
              <button 
                onClick={() => {
                  playSound(SOUNDS.CLICK);
                  navigate('/about');
                }}
                className="inline-flex items-center gap-3 text-matte-black bg-[#4CD964] font-black text-xs uppercase tracking-[3px] px-8 py-4.5 rounded-full hover:scale-105 transition-all shadow-[0_10px_25px_rgba(76,217,100,0.2)] group"
              >
                Meet the Founder <ChevronRight className="w-4.5 h-4.5 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partner Teaser Section */}
      <section className="relative z-10 py-12 px-6 -mt-8">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-l from-white/5 to-brand/5 backdrop-blur-2xl border border-white/10 rounded-[50px] overflow-hidden flex flex-col md:flex-row-reverse items-center gap-10 p-8 md:p-14"
          >
            <div className="w-full md:w-[35%] aspect-[3/4] rounded-[30px] overflow-hidden border border-white/10 shadow-2xl">
              <img src="/partner.jpg" className="w-full h-full object-cover" alt="Partner JIS" />
            </div>
            <div className="flex-1 space-y-5 text-center md:text-right">
              <div className="space-y-1">
                <span className="text-brand font-black uppercase tracking-[6px] text-[10px]">The Operational Pillar</span>
                <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                  JIS <span className="text-brand">Partner</span>
                </h2>
              </div>
              <p className="text-white/60 text-base md:text-lg leading-relaxed max-w-2xl font-medium ml-auto">
                "A strong support behind Moms Magic, helping in growing the brand, managing operations, and ensuring customers receive the best service."
              </p>
              <button 
                onClick={() => {
                  playSound(SOUNDS.CLICK);
                  navigate('/about');
                }}
                className="inline-flex items-center gap-3 text-matte-black bg-brand font-black text-xs uppercase tracking-[3px] px-8 py-4.5 rounded-full hover:scale-105 transition-all shadow-[0_10px_25px_rgba(255,77,0,0.2)] group flex-row-reverse"
              >
                Meet the Partner <ChevronRight className="w-4.5 h-4.5 group-hover:-translate-x-1.5 transition-transform rotate-180" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium Reviews Grid */}
      <section className="relative z-10 py-24 bg-gradient-to-b from-transparent to-black/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-16 space-y-2">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">
              The <span className="text-[#4CD964] drop-shadow-[0_0_30px_rgba(76,217,100,0.2)]">Elite</span> Taste
            </h2>
            <p className="text-white/40 font-bold uppercase tracking-[6px] text-[10px]">What our VIPs are saying</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {DUMMY_REVIEWS.slice(0, 3).map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[35px] hover:border-[#4CD964]/30 transition-colors group relative overflow-hidden text-left"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Quote className="w-24 h-24 text-[#4CD964]" />
                </div>
                <div className="relative z-10">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 text-[#4CD964] fill-[#4CD964] drop-shadow-[0_0_10px_rgba(76,217,100,0.4)]" />
                    ))}
                  </div>
                  <p className="text-white/80 text-base font-medium leading-relaxed mb-8 italic">"{review.comment}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#4CD964]/10 rounded-xl flex items-center justify-center border border-[#4CD964]/20 shadow-[0_0_15px_rgba(76,217,100,0.05)]">
                      <span className="text-xl font-black text-[#4CD964] uppercase">{review.userName.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase text-[10px] tracking-[3px]">{review.userName}</h4>
                      <p className="text-white/45 text-[8px] font-black uppercase tracking-[1.5px] mt-0.5">Verified Gourmand</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
