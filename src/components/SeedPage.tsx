import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { useSEO } from '../utils/seo';

export default function SeedPage() {
  useSEO("Database Seeding", "Seed data into FreshTrack platform.");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runSeeding = async () => {
    setLoading(true);
    setLog([]);
    addLog('Starting database seeding...');

    try {
      // 1. Seed Restaurants in Firestore
      addLog('Seeding restaurants...');
      const restaurants = [
        {
          id: 'res_1',
          name: "Mom's Magic Kitchen",
          cuisineTags: ['Indian', 'North Indian', 'Home Style'],
          bannerUrl: '/chicken_biryani_new.png',
          address: '123 Main Road, Yellapur',
          lat: 14.9643,
          lng: 74.7212,
          openHours: '09:00-22:00',
          commissionPct: 10,
          isActive: true,
          ownerUserId: 'kitchen_1_uid'
        },
        {
          id: 'res_2',
          name: 'Chinatown Express',
          cuisineTags: ['Chinese', 'Noodles', 'Starters'],
          bannerUrl: '/chicken_65_chinese.png',
          address: '45 Near bus stand, Dandeli',
          lat: 15.2455,
          lng: 74.6230,
          openHours: '11:00-23:00',
          commissionPct: 12,
          isActive: true,
          ownerUserId: 'kitchen_2_uid'
        },
        {
          id: 'res_3',
          name: 'Sweet Treats Bakery',
          cuisineTags: ['Desserts', 'Cakes', 'Beverages'],
          bannerUrl: '/butterscotch_cake.png',
          address: '89 Market Road, Yellapur',
          lat: 14.9628,
          lng: 74.7198,
          openHours: '10:00-21:30',
          commissionPct: 8,
          isActive: true,
          ownerUserId: 'admin_uid'
        }
      ];

      for (const r of restaurants) {
        await setDoc(doc(db, 'restaurants', r.id), r);
        addLog(`Added restaurant: ${r.name}`);
      }

      // 2. Seed Menu Items in Firestore
      addLog('Seeding menu items...');
      const menuItems = [
        { id: 'menu_1_1', restaurantId: 'res_1', name: 'Special Chicken Biryani', description: 'Flavorful long-grain basmati rice cooked with succulent chicken pieces and signature spices.', price: 220, imageUrl: '/chicken_biryani_new.png', category: 'Biryani', isVeg: false, isAvailable: true },
        { id: 'menu_1_2', restaurantId: 'res_1', name: 'Dal Tadka', description: 'Yellow lentils tempered with cumin, garlic, and red chilies in pure ghee.', price: 120, imageUrl: '/dal_tadka.png', category: 'Main Course', isVeg: true, isAvailable: true },
        { id: 'menu_1_3', restaurantId: 'res_1', name: 'Paneer Butter Masala', description: 'Soft cottage cheese cubes cooked in a rich, creamy tomato gravy.', price: 160, imageUrl: '/palak_paneer.jpg', category: 'Main Course', isVeg: true, isAvailable: true },
        { id: 'menu_1_4', restaurantId: 'res_1', name: 'Butter Naan', description: 'Leavened clay-oven baked flatbread topped with rich butter.', price: 40, imageUrl: '/butter_naan.png', category: 'Breads', isVeg: true, isAvailable: true },
        { id: 'menu_1_5', restaurantId: 'res_1', name: 'Paneer Biryani', description: 'Aromatic basmati rice cooked with paneer chunks and spices.', price: 180, imageUrl: '/paneer_biryani.png', category: 'Biryani', isVeg: true, isAvailable: true },
        { id: 'menu_1_6', restaurantId: 'res_1', name: 'Paneer Cutlet', description: 'Crispy pan-fried cottage cheese patties.', price: 90, imageUrl: '/paneer_cutlet.png', category: 'Starters', isVeg: true, isAvailable: true },
        { id: 'menu_1_7', restaurantId: 'res_1', name: 'Chapati', description: 'Whole wheat flatbread prepared on a traditional griddle.', price: 15, imageUrl: '/chapati.jpg', category: 'Breads', isVeg: true, isAvailable: true },
        { id: 'menu_1_8', restaurantId: 'res_1', name: 'Mutton Sukka', description: 'Spicy dry mutton cooked with black pepper and crushed coconut.', price: 280, imageUrl: '/mutton_sukka.png', category: 'Starters', isVeg: false, isAvailable: true },

        { id: 'menu_2_1', restaurantId: 'res_2', name: 'Chicken 65 Chinese Style', description: 'Deep fried spicy chicken chunks tossed in chili sauce and bell peppers.', price: 170, imageUrl: '/chicken_65_chinese.png', category: 'Chinese', isVeg: false, isAvailable: true },
        { id: 'menu_2_2', restaurantId: 'res_2', name: 'Chicken Crispy', description: 'Crispy fried chicken strips tossed in sweet and spicy schezwan sauce.', price: 190, imageUrl: '/chicken_crispy.png', category: 'Chinese', isVeg: false, isAvailable: true },
        { id: 'menu_2_3', restaurantId: 'res_2', name: 'Fried Momos', description: 'Deep fried vegetable dumplings served with spicy garlic chutney.', price: 100, imageUrl: '/fried_momos.png', category: 'Momos', isVeg: true, isAvailable: true },
        { id: 'menu_2_4', restaurantId: 'res_2', name: 'Veg Soft Noodles', description: 'Stir-fried noodles tossed with loaded vegetables and soy sauce.', price: 120, imageUrl: '/veg_noodles_real.png', category: 'Noodles', isVeg: true, isAvailable: true },
        { id: 'menu_2_5', restaurantId: 'res_2', name: 'Gobi Manchurian', description: 'Crispy cauliflower florets tossed in tangy soya-garlic sauce.', price: 110, imageUrl: '/gobi_manchurian.png', category: 'Chinese', isVeg: true, isAvailable: true },
        { id: 'menu_2_6', restaurantId: 'res_2', name: 'Chicken Lollipop', description: 'Chicken wings drummettes shaped like lollipops, deep-fried and crisp.', price: 180, imageUrl: '/chicken_lollipop.png', category: 'Chinese', isVeg: false, isAvailable: true },
        { id: 'menu_2_7', restaurantId: 'res_2', name: 'Hot & Sour Soup', description: 'Spicy and tangy thick soup made with shredded vegetables.', price: 80, imageUrl: '/hot_and_sour_soup.jpg', category: 'Soups', isVeg: true, isAvailable: true },
        { id: 'menu_2_8', restaurantId: 'res_2', name: 'Egg Fried Rice', description: 'Stir-fried rice tossed with eggs, vegetables, and seasoning.', price: 130, imageUrl: '/egg_fried_rice.png', category: 'Rice', isVeg: false, isAvailable: true },

        { id: 'menu_3_1', restaurantId: 'res_3', name: 'Black Forest Cake Slice', description: 'Classic chocolate cake layers with whipped cream and cherries.', price: 80, imageUrl: '/black_forest_cake.png', category: 'Cakes', isVeg: true, isAvailable: true },
        { id: 'menu_3_2', restaurantId: 'res_3', name: 'Butterscotch Cake Slice', description: 'Rich butterscotch cake layered with butterscotch crunch and praline.', price: 85, imageUrl: '/butterscotch_cake.png', category: 'Cakes', isVeg: true, isAvailable: true },
        { id: 'menu_3_3', restaurantId: 'res_3', name: 'Kiwi Cake Slice', description: 'Fluffy sponge cake layered with tangy kiwi fruit compote.', price: 90, imageUrl: '/kiwi_cake.png', category: 'Cakes', isVeg: true, isAvailable: true },
        { id: 'menu_3_4', restaurantId: 'res_3', name: 'Premium Cold Coffee', description: 'Chilled blended milk coffee topped with vanilla ice cream.', price: 110, imageUrl: '/cold_coffee.png', category: 'Beverages', isVeg: true, isAvailable: true },
        { id: 'menu_3_5', restaurantId: 'res_3', name: 'Strawberry Mojito', description: 'Refreshing sparkling summer drink with strawberries, lime, and mint.', price: 95, imageUrl: '/strawberry_mojito.png', category: 'Beverages', isVeg: true, isAvailable: true },
        { id: 'menu_3_6', restaurantId: 'res_3', name: 'Classic Mojito', description: 'Traditional cooler made with fresh mint, lime juice, soda.', price: 90, imageUrl: '/classic_mojito.png', category: 'Beverages', isVeg: true, isAvailable: true },
        { id: 'menu_3_7', restaurantId: 'res_3', name: 'Vanilla Shake', description: 'Thick and creamy blend of vanilla ice cream, milk, and cream.', price: 100, imageUrl: '/vanilla_shake_user.png', category: 'Beverages', isVeg: true, isAvailable: true },
        { id: 'menu_3_8', restaurantId: 'res_3', name: 'Blue Curacao Cooler', description: 'Vibrant blue carbonated mocktail with citrus orange curacao flavor.', price: 95, imageUrl: '/blue_curacao.png', category: 'Beverages', isVeg: true, isAvailable: true }
      ];

      for (const m of menuItems) {
        await setDoc(doc(db, 'menuItems', m.id), m);
      }
      addLog(`Added ${menuItems.length} menu items.`);

      // 3. Seed Global settings
      addLog('Seeding settings config...');
      await setDoc(doc(db, 'settings', 'config'), {
        deliveryFeeRules: {
          baseFee: 30,
          perKmFee: 5,
          freeThreshold: 500
        },
        taxPct: 5,
        supportContact: '+919988776655'
      });
      addLog('Added global system settings.');

      // 4. Create Staff Accounts via Netlify/Vercel functions API
      addLog('Calling API to create staff and admin accounts...');
      const seedUsers = [
        { email: 'admin@freshtrack.com', password: 'password123', name: 'Super Admin', role: 'admin' },
        { email: 'kitchen1@freshtrack.com', password: 'password123', name: 'Moms Magic Kitchen Staff', role: 'kitchen_staff', restaurantId: 'res_1' },
        { email: 'kitchen2@freshtrack.com', password: 'password123', name: 'Chinatown KDS', role: 'kitchen_staff', restaurantId: 'res_2' },
        { email: 'rider1@freshtrack.com', password: 'password123', name: 'Rider Ramesh', role: 'delivery_partner', vehicleType: 'Motorcycle' },
        { email: 'rider2@freshtrack.com', password: 'password123', name: 'Rider Sunil', role: 'delivery_partner', vehicleType: 'Bicycle' },
        { email: 'rider3@freshtrack.com', password: 'password123', name: 'Rider Anand', role: 'delivery_partner', vehicleType: 'Scooter' }
      ];

      for (const u of seedUsers) {
        try {
          const res = await fetch('/api/create-staff-account', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-jwt-admin-token-123456'
            },
            body: JSON.stringify(u)
          });
          const data = await res.json();
          if (res.ok) {
            addLog(`Account created: ${u.email} (${u.role})`);
          } else {
            addLog(`Error creating account ${u.email}: ${data.error}`);
          }
        } catch (err: any) {
          addLog(`Network error creating account ${u.email}: ${err.message}`);
        }
      }

      addLog('Database seeding completed successfully! 🎉');
    } catch (err: any) {
      addLog(`Seeding failed with error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center p-6 font-sans">
      <div className="bg-white rounded-2xl p-8 max-w-xl w-full shadow-sm border border-zinc-100">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">FreshTrack Seeding Portal</h1>
        <p className="text-zinc-500 mb-6 text-sm">
          Use this portal to seed demo restaurants, menus, configs, and register mock accounts (admin, kitchen, riders) with custom roles into Firebase.
        </p>

        <button
          onClick={runSeeding}
          disabled={loading}
          className="w-full bg-[#FF5A1F] text-white py-3 px-6 rounded-xl font-semibold hover:bg-[#e54e19] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
        >
          {loading ? 'Seeding Database...' : 'Seed Database'}
        </button>

        {log.length > 0 && (
          <div className="mt-6 bg-zinc-900 text-zinc-300 rounded-xl p-4 font-mono text-xs max-h-60 overflow-y-auto">
            {log.map((line, idx) => (
              <div key={idx} className="mb-1 leading-relaxed">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
