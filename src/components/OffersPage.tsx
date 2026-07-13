import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OffersPage() {
  const navigate = useNavigate();

  const offers: Array<{
    id: number;
    title: string;
    description: string;
    oldPrice?: number;
    newPrice?: number;
    badge: string;
    icon: string;
    color: string;
    image: string;
    code?: string;
  }> = [
    {
      id: 1,
      title: "CHICKEN CRISPY MEAL",
      description: "Our signature high-conversion crispy chicken at an unbeatable price!",
      oldPrice: 320,
      newPrice: 220,
      badge: "STEAL DEAL",
      icon: "local_fire_department",
      color: "from-orange-600 to-red-600",
      image: "https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80"
    },
    {
      id: 3,
      title: "REFRESHMENT DEAL",
      description: "Add a chilled Coca-Cola or Sprite to any main dish order for just ₹25.",
      badge: "BEST SELLER",
      icon: "auto_awesome",
      color: "from-blue-600 to-indigo-600",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=800&q=80"
    }
  ];

  return (
    <div className="relative min-h-screen bg-background pt-24 pb-40 text-on-background">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,rgba(var(--color-primary-rgb),0.05)_0%,transparent_50%)]" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 space-y-12 relative z-10">
        {/* Header */}
        <div className="space-y-4">
          <motion.button 
            whileHover={{ x: -5 }}
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-secondary font-bold uppercase tracking-widest text-[10px] hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">chevron_left</span> Back to Home
          </motion.button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <h1 className="text-6xl md:text-8xl font-headline-lg tracking-tighter uppercase text-on-background leading-none">
              Magic <br/><span className="text-primary drop-shadow-sm">Deals</span>
            </h1>
            <div className="bg-surface-container-low px-6 py-3 rounded-2xl flex items-center gap-3 border border-outline-variant/30">
              <span className="material-symbols-outlined text-[20px] text-primary">bolt</span>
              <span className="text-secondary text-[10px] font-bold uppercase tracking-widest">Offers updating daily</span>
            </div>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="space-y-10">
          {offers.map((offer, idx) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group perspective-1000"
            >
              <motion.div
                whileHover={{ rotateY: 5, rotateX: -2 }}
                className="relative bg-surface rounded-[50px] overflow-hidden border border-outline-variant/30 shadow-md flex flex-col md:flex-row items-center gap-10 p-10 md:p-0 preserve-3d"
              >
                {/* Image Side */}
                <div className="w-full md:w-1/2 h-[300px] md:h-[500px] relative overflow-hidden rounded-[40px] md:rounded-none">
                  <img src={offer.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="" />
                  <div className={`absolute inset-0 bg-gradient-to-r ${offer.color} opacity-20 mix-blend-overlay`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent opacity-80" />
                  
                  <div className="absolute top-8 left-8">
                    <div className="bg-surface/80 backdrop-blur-md px-6 py-2 rounded-2xl font-bold text-[10px] uppercase tracking-widest text-on-surface border border-outline-variant/50">
                      {offer.badge}
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="flex-1 space-y-8 pr-0 md:pr-16 text-center md:text-left">
                  <div className="space-y-4">
                    <h2 className="text-4xl md:text-6xl font-headline-lg tracking-tighter uppercase text-on-surface leading-none">
                      {offer.title}
                    </h2>
                    <p className="text-secondary text-lg font-medium leading-relaxed max-w-md mx-auto md:mx-0">
                      {offer.description}
                    </p>
                  </div>

                  {offer.newPrice && (
                    <div className="flex items-baseline justify-center md:justify-start gap-6">
                      <span className="text-7xl font-headline-lg text-primary tracking-tighter">₹{offer.newPrice}</span>
                      <span className="text-3xl font-headline-md text-outline line-through">₹{offer.oldPrice}</span>
                    </div>
                  )}

                  {offer.code ? (
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        navigator.clipboard.writeText(offer.code!);
                        toast.success(`Coupon "${offer.code}" copied to clipboard!`);
                      }}
                      className="bg-primary text-on-primary px-12 py-4 rounded-2xl flex items-center gap-3 justify-center md:justify-start font-bold uppercase tracking-widest shadow-md hover:bg-primary/90 transition-colors"
                    >
                      Copy Code: {offer.code} <span className="material-symbols-outlined text-[20px]">redeem</span>
                    </motion.button>
                  ) : (
                    <motion.button 
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/food')}
                      className="bg-primary text-on-primary px-12 py-4 rounded-2xl font-bold uppercase tracking-widest shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center md:justify-start gap-2"
                    >
                      Claim Offer <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Global CTA */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="relative bg-surface rounded-[60px] p-20 text-center overflow-hidden group border border-outline-variant/30 shadow-lg"
        >
          <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
          <div className="relative z-10 space-y-8">
            <h2 className="text-5xl md:text-8xl font-headline-lg tracking-tighter text-on-surface uppercase leading-none">
              Ready to <br/> <span className="text-primary">Save Big?</span>
            </h2>
            <p className="text-secondary font-bold uppercase tracking-widest text-xs">New experiences added every week</p>
            <button 
              onClick={() => navigate('/food')}
              className="bg-primary text-on-primary px-16 py-8 rounded-[32px] text-xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 mx-auto shadow-md hover:bg-primary/90 transition-colors"
            >
              Order Now <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
