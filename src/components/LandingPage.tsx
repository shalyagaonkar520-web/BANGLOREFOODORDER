import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Truck, ShieldCheck, Heart, Star, ArrowRight, Clock, Lock, Quote, Sparkles, Zap, Shield, ChevronRight } from 'lucide-react';
import { DUMMY_REVIEWS } from '../data/reviews';
import toast from 'react-hot-toast';

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -100]);
  const imageY = useTransform(scrollYProgress, [0, 0.3], [0, 150]);

  const cards = [
    {
      title: "ORDER",
      titleAccent: "FOOD",
      subtitle: "Luxury culinary experiences at your door",
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1000&auto=format&fit=crop",
      route: "/food",
      color: "from-brand/20 to-matte-black/40",
      badge: "VIP CHOICE ✨",
      comingSoon: false
    },
    {
      title: "PARTY",
      titleAccent: "SPECIALS",
      subtitle: "Celebrations • Cakes • Decoration Setup",
      image: "/party_banner.jpg",
      route: "/bulk",
      color: "from-brand/20 to-matte-black/40",
      badge: "NEW ✨",
      comingSoon: false
    },
    {
      title: "PREMIUM",
      titleAccent: "FRESH",
      subtitle: "Daily organic essentials & more",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1000&auto=format&fit=crop",
      route: "/grocery",
      color: "from-gold/20 to-matte-black/40",
      badge: "COMING SOON 🥬",
      comingSoon: true
    }
  ];

  return (
    <div className="relative min-h-screen bg-matte-black" ref={containerRef}>
      {/* 3D Menu Cards Collection */}
      <section className="relative z-20 px-6 py-40 max-w-[1500px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 bg-matte-black/80 backdrop-blur-3xl rounded-[60px] border-t border-white/5 -mt-10">
        <div className="col-span-1 md:col-span-3 text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-7xl font-black italic uppercase tracking-tighter text-white">
            Explore <span className="text-luxury-gold">Categories</span>
          </h2>
          <p className="text-text-muted font-bold uppercase tracking-[6px] text-xs">Curated for the elite palate</p>
        </div>

        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: idx * 0.2 }}
            onClick={() => !card.comingSoon && navigate(card.route)}
            className="group perspective-1000 cursor-pointer"
          >
            <motion.div
              whileHover={{ rotateY: 5, rotateX: -5, scale: 1.03 }}
              className="relative h-[600px] rounded-[40px] overflow-hidden luxury-card preserve-3d shadow-2xl border border-white/5"
            >
              <img src={card.image} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-50 mix-blend-luminosity group-hover:mix-blend-normal" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              
              <div className="absolute inset-0 p-10 flex flex-col justify-end gap-6 translate-z-30">
                <div className="space-y-2">
                  <h3 className="text-5xl font-black italic tracking-tighter leading-[0.9] uppercase text-white">
                    {card.title}<br />
                    <span className="text-gold drop-shadow-lg">{card.titleAccent}</span>
                  </h3>
                  <p className="text-white/60 text-[11px] font-black uppercase tracking-[3px] max-w-[200px] leading-relaxed pt-2">
                    {card.subtitle}
                  </p>
                </div>
                <div className="pt-4">
                  {card.comingSoon ? (
                    <div className="inline-flex items-center gap-3 text-white/30 font-black text-[10px] uppercase tracking-[4px] bg-white/5 px-6 py-3 rounded-full border border-white/5">
                      <Lock className="w-4 h-4" /> Invitation Only
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-4 text-matte-black bg-gold font-black text-xs uppercase tracking-[4px] px-8 py-4 rounded-full group-hover:gap-6 transition-all shadow-[0_10px_30px_rgba(244,180,0,0.3)]">
                      View Menu <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              <div className="absolute top-8 right-8 px-5 py-2 rounded-full border border-white/20 bg-black/40 backdrop-blur-xl translate-z-20">
                <span className="text-[10px] font-black uppercase tracking-[3px] text-white">{card.badge}</span>
              </div>
            </motion.div>
          </motion.div>
        ))}
      </section>

      {/* Founder Teaser Section */}
      <section className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-white/5 to-gold/5 backdrop-blur-2xl border border-white/10 rounded-[60px] overflow-hidden flex flex-col md:flex-row items-center gap-12 p-8 md:p-16"
          >
            <div className="w-full md:w-[40%] aspect-[3/4] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
              <img src="/founder.jpg" className="w-full h-full object-cover" alt="Founder" />
            </div>
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="space-y-2">
                <span className="text-luxury-gold font-black uppercase tracking-[6px] text-[10px]">The Visionary</span>
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">Shalya <span className="text-luxury-gold">Gaonkar</span></h2>
              </div>
              <p className="text-white/60 text-lg leading-relaxed max-w-2xl font-medium">
                "I believe food is not just about eating — it’s about comfort, memories, and sharing special moments with family and friends."
              </p>
              <button 
                onClick={() => navigate('/about')}
                className="inline-flex items-center gap-4 text-matte-black bg-gold font-black text-xs uppercase tracking-[4px] px-10 py-5 rounded-full hover:scale-105 transition-all shadow-[0_10px_30px_rgba(244,180,0,0.3)] group"
              >
                Meet the Founder <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Partner Teaser Section */}
      <section className="relative z-10 py-16 px-6 -mt-16">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-l from-white/5 to-brand/5 backdrop-blur-2xl border border-white/10 rounded-[60px] overflow-hidden flex flex-col md:flex-row-reverse items-center gap-12 p-8 md:p-16"
          >
            <div className="w-full md:w-[40%] aspect-[3/4] rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
              <img src="/partner.jpg" className="w-full h-full object-cover" alt="Partner JIS" />
            </div>
            <div className="flex-1 space-y-6 text-center md:text-right">
              <div className="space-y-2">
                <span className="text-brand font-black uppercase tracking-[6px] text-[10px]">The Operational Pillar</span>
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white">JIS <span className="text-brand">Partner</span></h2>
              </div>
              <p className="text-white/60 text-lg leading-relaxed max-w-2xl font-medium ml-auto">
                "A strong support behind Moms Magic, helping in growing the brand, managing operations, and ensuring customers receive the best service."
              </p>
              <button 
                onClick={() => navigate('/about')}
                className="inline-flex items-center gap-4 text-matte-black bg-brand font-black text-xs uppercase tracking-[4px] px-10 py-5 rounded-full hover:scale-105 transition-all shadow-[0_10px_30px_rgba(255,77,0,0.3)] group flex-row-reverse"
              >
                Meet the Partner <ChevronRight className="w-5 h-5 group-hover:-translate-x-2 transition-transform rotate-180" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Premium Reviews Grid */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-transparent to-black/50">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-24 space-y-4">
            <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter text-white">
              The <span className="text-luxury-gold drop-shadow-[0_0_30px_rgba(244,180,0,0.2)]">Elite</span> Taste
            </h2>
            <p className="text-text-muted font-bold uppercase tracking-[6px] text-xs">What our VIPs are saying</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {DUMMY_REVIEWS.slice(0, 3).map((review, idx) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.2 }}
                className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[40px] hover:border-gold/30 transition-colors group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Quote className="w-32 h-32 text-gold" />
                </div>
                <div className="relative z-10">
                  <div className="flex gap-1 mb-8">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-gold fill-gold drop-shadow-[0_0_10px_rgba(244,180,0,0.5)]" />)}
                  </div>
                  <p className="text-white/80 text-lg font-medium leading-relaxed mb-10 italic">"{review.comment}"</p>
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20 shadow-[0_0_15px_rgba(244,180,0,0.1)]">
                      <span className="text-2xl font-black text-gold uppercase">{review.userName.charAt(0)}</span>
                    </div>
                    <div>
                      <h4 className="text-white font-black uppercase text-[11px] tracking-[4px]">{review.userName}</h4>
                      <p className="text-white/40 text-[9px] font-black uppercase tracking-[2px] mt-1">Verified Gourmand</p>
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

