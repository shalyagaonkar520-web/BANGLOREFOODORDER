const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
let app;
let serviceAccount = null;
const serviceAccountPath = path.join(__dirname, '../firebase-service-account.json');

const config = {
  projectId: 'momsmagic-d131a',
  databaseURL: 'https://momsmagic-d131a-default-rtdb.firebaseio.com'
};

if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.log('Using Firebase Emulators...');
  app = initializeApp(config);
} else if (fs.existsSync(serviceAccountPath)) {
  console.log('Using firebase-service-account.json credentials...');
  serviceAccount = require(serviceAccountPath);
  app = initializeApp({
    credential: cert(serviceAccount),
    ...config
  });
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.log('Using FIREBASE_SERVICE_ACCOUNT environment variable...');
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  app = initializeApp({
    credential: cert(serviceAccount),
    ...config
  });
} else {
  console.log('Attempting default app initialization...');
  app = initializeApp(config);
}

const db = getFirestore(app);
const auth = getAuth(app);

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

const menuItems = [
  // Restaurant 1 Items
  { id: 'menu_1_1', restaurantId: 'res_1', name: 'Special Chicken Biryani', description: 'Flavorful long-grain basmati rice cooked with succulent chicken pieces and signature spices.', price: 220, imageUrl: '/chicken_biryani_new.png', category: 'Biryani', isVeg: false, isAvailable: true },
  { id: 'menu_1_2', restaurantId: 'res_1', name: 'Dal Tadka', description: 'Yellow lentils tempered with cumin, garlic, and red chilies in pure ghee.', price: 120, imageUrl: '/dal_tadka.png', category: 'Main Course', isVeg: true, isAvailable: true },
  { id: 'menu_1_3', restaurantId: 'res_1', name: 'Paneer Butter Masala', description: 'Soft cottage cheese cubes cooked in a rich, creamy tomato and cashew gravy.', price: 160, imageUrl: '/palak_paneer.jpg', category: 'Main Course', isVeg: true, isAvailable: true },
  { id: 'menu_1_4', restaurantId: 'res_1', name: 'Butter Naan', description: 'Leavened clay-oven baked flatbread topped with rich butter.', price: 40, imageUrl: '/butter_naan.png', category: 'Breads', isVeg: true, isAvailable: true },
  { id: 'menu_1_5', restaurantId: 'res_1', name: 'Paneer Biryani', description: 'Aromatic basmati rice cooked with paneer chunks and spices.', price: 180, imageUrl: '/paneer_biryani.png', category: 'Biryani', isVeg: true, isAvailable: true },
  { id: 'menu_1_6', restaurantId: 'res_1', name: 'Paneer Cutlet', description: 'Crispy pan-fried snacks made of mashed potatoes and cottage cheese.', price: 90, imageUrl: '/paneer_cutlet.png', category: 'Starters', isVeg: true, isAvailable: true },
  { id: 'menu_1_7', restaurantId: 'res_1', name: 'Chapati', description: 'Whole wheat flatbread prepared on a traditional griddle.', price: 15, imageUrl: '/chapati.jpg', category: 'Breads', isVeg: true, isAvailable: true },
  { id: 'menu_1_8', restaurantId: 'res_1', name: 'Mutton Sukka', description: 'Spicy dry mutton cooked with black pepper and crushed coconut.', price: 280, imageUrl: '/mutton_sukka.png', category: 'Starters', isVeg: false, isAvailable: true },

  // Restaurant 2 Items
  { id: 'menu_2_1', restaurantId: 'res_2', name: 'Chicken 65 Chinese Style', description: 'Deep fried spicy chicken chunks tossed in chili sauce and bell peppers.', price: 170, imageUrl: '/chicken_65_chinese.png', category: 'Chinese', isVeg: false, isAvailable: true },
  { id: 'menu_2_2', restaurantId: 'res_2', name: 'Chicken Crispy', description: 'Crispy fried chicken strips tossed in sweet and spicy schezwan sauce.', price: 190, imageUrl: '/chicken_crispy.png', category: 'Chinese', isVeg: false, isAvailable: true },
  { id: 'menu_2_3', restaurantId: 'res_2', name: 'Fried Momos', description: 'Deep fried vegetable dumplings served with spicy garlic chutney.', price: 100, imageUrl: '/fried_momos.png', category: 'Momos', isVeg: true, isAvailable: true },
  { id: 'menu_2_4', restaurantId: 'res_2', name: 'Veg Soft Noodles', description: 'Stir-fried noodles tossed with loaded vegetables and soy sauce.', price: 120, imageUrl: '/veg_noodles_real.png', category: 'Noodles', isVeg: true, isAvailable: true },
  { id: 'menu_2_5', restaurantId: 'res_2', name: 'Gobi Manchurian', description: 'Crispy cauliflower florets tossed in tangy soya-garlic sauce.', price: 110, imageUrl: '/gobi_manchurian.png', category: 'Chinese', isVeg: true, isAvailable: true },
  { id: 'menu_2_6', restaurantId: 'res_2', name: 'Chicken Lollipop', description: 'Chicken wings drummettes shaped like lollipops, deep-fried and crisp.', price: 180, imageUrl: '/chicken_lollipop.png', category: 'Chinese', isVeg: false, isAvailable: true },
  { id: 'menu_2_7', restaurantId: 'res_2', name: 'Hot & Sour Soup', description: 'Spicy and tangy thick soup made with shredded vegetables and vinegar.', price: 80, imageUrl: '/hot_and_sour_soup.jpg', category: 'Soups', isVeg: true, isAvailable: true },
  { id: 'menu_2_8', restaurantId: 'res_2', name: 'Egg Fried Rice', description: 'Stir-fried rice tossed with eggs, vegetables, and seasoning.', price: 130, imageUrl: '/egg_fried_rice.png', category: 'Rice', isVeg: false, isAvailable: true },

  // Restaurant 3 Items
  { id: 'menu_3_1', restaurantId: 'res_3', name: 'Black Forest Cake Slice', description: 'Classic chocolate cake layers with whipped cream and cherries.', price: 80, imageUrl: '/black_forest_cake.png', category: 'Cakes', isVeg: true, isAvailable: true },
  { id: 'menu_3_2', restaurantId: 'res_3', name: 'Butterscotch Cake Slice', description: 'Rich butterscotch cake layered with butterscotch crunch and praline.', price: 85, imageUrl: '/butterscotch_cake.png', category: 'Cakes', isVeg: true, isAvailable: true },
  { id: 'menu_3_3', restaurantId: 'res_3', name: 'Kiwi Cake Slice', description: 'Fluffy sponge cake layered with tangy kiwi fruit compote and cream.', price: 90, imageUrl: '/kiwi_cake.png', category: 'Cakes', isVeg: true, isAvailable: true },
  { id: 'menu_3_4', restaurantId: 'res_3', name: 'Premium Cold Coffee', description: 'Chilled blended milk coffee topped with vanilla ice cream chocolate sauce.', price: 110, imageUrl: '/cold_coffee.png', category: 'Beverages', isVeg: true, isAvailable: true },
  { id: 'menu_3_5', restaurantId: 'res_3', name: 'Strawberry Mojito', description: 'Refreshing sparkling summer drink with strawberries, lime, and mint leaves.', price: 95, imageUrl: '/strawberry_mojito.png', category: 'Beverages', isVeg: true, isAvailable: true },
  { id: 'menu_3_6', restaurantId: 'res_3', name: 'Classic Mojito', description: 'Traditional cooler made with fresh mint, lime juice, sugar syrup, and soda.', price: 90, imageUrl: '/classic_mojito.png', category: 'Beverages', isVeg: true, isAvailable: true },
  { id: 'menu_3_7', restaurantId: 'res_3', name: 'Vanilla Shake', description: 'Thick and creamy blend of vanilla ice cream, milk, and cream.', price: 100, imageUrl: '/vanilla_shake_user.png', category: 'Beverages', isVeg: true, isAvailable: true },
  { id: 'menu_3_8', restaurantId: 'res_3', name: 'Blue Curacao Cooler', description: 'Vibrant blue carbonated mocktail with citrus orange curacao flavouring.', price: 95, imageUrl: '/blue_curacao.png', category: 'Beverages', isVeg: true, isAvailable: true }
];

const seedUsers = [
  { uid: 'admin_uid', email: 'admin@freshtrack.com', password: 'password123', name: 'Super Admin', role: 'admin' },
  { uid: 'kitchen_1_uid', email: 'kitchen1@freshtrack.com', password: 'password123', name: 'Moms Magic Kitchen Staff', role: 'kitchen_staff', restaurantId: 'res_1' },
  { uid: 'kitchen_2_uid', email: 'kitchen2@freshtrack.com', password: 'password123', name: 'Chinatown KDS', role: 'kitchen_staff', restaurantId: 'res_2' },
  { uid: 'rider_1_uid', email: 'rider1@freshtrack.com', password: 'password123', name: 'Rider Ramesh', role: 'delivery_partner', vehicleType: 'Motorcycle' },
  { uid: 'rider_2_uid', email: 'rider2@freshtrack.com', password: 'password123', name: 'Rider Sunil', role: 'delivery_partner', vehicleType: 'Bicycle' },
  { uid: 'rider_3_uid', email: 'rider3@freshtrack.com', password: 'password123', name: 'Rider Anand', role: 'delivery_partner', vehicleType: 'Scooter' },
  { uid: 'cust_1_uid', email: 'cust1@freshtrack.com', password: 'password123', name: 'Shalya Gaonkar', role: 'customer' },
  { uid: 'cust_2_uid', email: 'cust2@freshtrack.com', password: 'password123', name: 'John Doe', role: 'customer' },
  { uid: 'cust_3_uid', email: 'cust3@freshtrack.com', password: 'password123', name: 'Jane Smith', role: 'customer' },
  { uid: 'cust_4_uid', email: 'cust4@freshtrack.com', password: 'password123', name: 'Bob Johnson', role: 'customer' },
  { uid: 'cust_5_uid', email: 'cust5@freshtrack.com', password: 'password123', name: 'Alice Williams', role: 'customer' }
];

const mockOrders = [
  {
    id: 'order_1',
    customerId: 'cust_1_uid',
    restaurantId: 'res_1',
    riderId: 'rider_1_uid',
    status: 'Delivered',
    items: [{ menuItemId: 'menu_1_1', name: 'Special Chicken Biryani', quantity: 2, unitPrice: 220, ready: true }],
    subtotal: 440,
    deliveryFee: 30,
    tax: 22,
    discount: 50,
    total: 442,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_1',
    razorpayPaymentId: 'pay_mock_1',
    deliveryAddressId: 'addr_1',
    placedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    deliveredAt: new Date(Date.now() - 23.5 * 60 * 60 * 1000)
  },
  {
    id: 'order_2',
    customerId: 'cust_2_uid',
    restaurantId: 'res_1',
    riderId: 'rider_2_uid',
    status: 'OutForDelivery',
    items: [
      { menuItemId: 'menu_1_2', name: 'Dal Tadka', quantity: 1, unitPrice: 120, ready: true },
      { menuItemId: 'menu_1_4', name: 'Butter Naan', quantity: 2, unitPrice: 40, ready: true }
    ],
    subtotal: 200,
    deliveryFee: 30,
    tax: 10,
    discount: 0,
    total: 240,
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    deliveryAddressId: 'addr_2',
    placedAt: new Date(Date.now() - 30 * 60 * 1000) // 30 mins ago
  },
  {
    id: 'order_3',
    customerId: 'cust_3_uid',
    restaurantId: 'res_2',
    riderId: null,
    status: 'ReadyForPickup',
    items: [
      { menuItemId: 'menu_2_1', name: 'Chicken 65 Chinese Style', quantity: 1, unitPrice: 170, ready: true },
      { menuItemId: 'menu_2_4', name: 'Veg Soft Noodles', quantity: 1, unitPrice: 120, ready: true }
    ],
    subtotal: 290,
    deliveryFee: 40,
    tax: 14.5,
    discount: 20,
    total: 324.5,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_3',
    razorpayPaymentId: 'pay_mock_3',
    deliveryAddressId: 'addr_3',
    placedAt: new Date(Date.now() - 45 * 60 * 1000),
    readyAt: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: 'order_4',
    customerId: 'cust_4_uid',
    restaurantId: 'res_2',
    riderId: null,
    status: 'Preparing',
    items: [{ menuItemId: 'menu_2_3', name: 'Fried Momos', quantity: 3, unitPrice: 100, ready: false }],
    subtotal: 300,
    deliveryFee: 45,
    tax: 15,
    discount: 0,
    total: 360,
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    deliveryAddressId: 'addr_4',
    placedAt: new Date(Date.now() - 15 * 60 * 1000)
  },
  {
    id: 'order_5',
    customerId: 'cust_5_uid',
    restaurantId: 'res_3',
    riderId: null,
    status: 'Placed',
    items: [
      { menuItemId: 'menu_3_1', name: 'Black Forest Cake Slice', quantity: 2, unitPrice: 80, ready: false },
      { menuItemId: 'menu_3_4', name: 'Premium Cold Coffee', quantity: 2, unitPrice: 110, ready: false }
    ],
    subtotal: 380,
    deliveryFee: 30,
    tax: 19,
    discount: 40,
    total: 389,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_5',
    razorpayPaymentId: 'pay_mock_5',
    deliveryAddressId: 'addr_5',
    placedAt: new Date()
  },
  {
    id: 'order_6',
    customerId: 'cust_1_uid',
    restaurantId: 'res_3',
    riderId: null,
    status: 'PaymentFailed',
    items: [{ menuItemId: 'menu_3_2', name: 'Butterscotch Cake Slice', quantity: 1, unitPrice: 85, ready: false }],
    subtotal: 85,
    deliveryFee: 30,
    tax: 4.25,
    discount: 0,
    total: 119.25,
    paymentMethod: 'razorpay',
    paymentStatus: 'failed',
    razorpayOrderId: 'order_mock_6',
    deliveryAddressId: 'addr_1',
    placedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'order_7',
    customerId: 'cust_2_uid',
    restaurantId: 'res_1',
    riderId: 'rider_3_uid',
    status: 'RiderAssigned',
    items: [{ menuItemId: 'menu_1_5', name: 'Paneer Biryani', quantity: 1, unitPrice: 180, ready: true }],
    subtotal: 180,
    deliveryFee: 30,
    tax: 9,
    discount: 10,
    total: 209,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_7',
    razorpayPaymentId: 'pay_mock_7',
    deliveryAddressId: 'addr_2',
    placedAt: new Date(Date.now() - 50 * 60 * 1000),
    readyAt: new Date(Date.now() - 30 * 60 * 1000),
    acceptedAt: new Date(Date.now() - 25 * 60 * 1000)
  },
  {
    id: 'order_8',
    customerId: 'cust_3_uid',
    restaurantId: 'res_1',
    riderId: null,
    status: 'Cancelled',
    items: [{ menuItemId: 'menu_1_8', name: 'Mutton Sukka', quantity: 1, unitPrice: 280, ready: false }],
    subtotal: 280,
    deliveryFee: 30,
    tax: 14,
    discount: 0,
    total: 324,
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    deliveryAddressId: 'addr_3',
    placedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    cancelledAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000)
  },
  {
    id: 'order_9',
    customerId: 'cust_4_uid',
    restaurantId: 'res_2',
    riderId: 'rider_1_uid',
    status: 'Delivered',
    items: [{ menuItemId: 'menu_2_5', name: 'Gobi Manchurian', quantity: 2, unitPrice: 110, ready: true }],
    subtotal: 220,
    deliveryFee: 40,
    tax: 11,
    discount: 20,
    total: 251,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    razorpayOrderId: 'order_mock_9',
    razorpayPaymentId: 'pay_mock_9',
    deliveryAddressId: 'addr_4',
    placedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000)
  },
  {
    id: 'order_10',
    customerId: 'cust_5_uid',
    restaurantId: 'res_3',
    riderId: 'rider_2_uid',
    status: 'Refunded',
    items: [{ menuItemId: 'menu_3_3', name: 'Kiwi Cake Slice', quantity: 4, unitPrice: 90, ready: true }],
    subtotal: 360,
    deliveryFee: 30,
    tax: 18,
    discount: 0,
    total: 408,
    paymentMethod: 'razorpay',
    paymentStatus: 'refunded',
    razorpayOrderId: 'order_mock_10',
    razorpayPaymentId: 'pay_mock_10',
    deliveryAddressId: 'addr_5',
    placedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    cancelledAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000)
  }
];

async function seed() {
  try {
    console.log('--- START SEEDING ---');

    // 1. Seed Users (Auth + Firestore)
    console.log('Seeding Users...');
    for (const u of seedUsers) {
      let authUser;
      try {
        authUser = await auth.getUser(u.uid);
        console.log(`User already exists in Auth: ${u.email}. Updating...`);
        await auth.updateUser(u.uid, {
          displayName: u.name,
          email: u.email
        });
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          console.log(`Creating user in Auth: ${u.email}...`);
          authUser = await auth.createUser({
            uid: u.uid,
            email: u.email,
            password: u.password,
            displayName: u.name
          });
        } else {
          throw err;
        }
      }

      // Set Custom Claims for roles
      const claims = { role: u.role };
      if (u.role === 'kitchen_staff' && u.restaurantId) {
        claims.restaurantId = u.restaurantId;
      }
      await auth.setCustomUserClaims(u.uid, claims);
      console.log(`Custom claims set for ${u.email}:`, claims);

      // Save user to users collection in Firestore
      const userRef = db.collection('users').doc(u.uid);
      const userDoc = {
        name: u.name,
        email: u.email,
        phone: u.role === 'delivery_partner' ? '9876543210' : '9999999999',
        role: u.role,
        createdAt: FieldValue.serverTimestamp(),
        fcmTokens: []
      };
      if (u.role === 'kitchen_staff' && u.restaurantId) {
        userDoc.restaurantId = u.restaurantId;
      }
      await userRef.set(userDoc, { merge: true });

      // If user is a customer, seed default address
      if (u.role === 'customer') {
        const addrRef = userRef.collection('addresses').doc('addr_' + u.uid.split('_')[1]);
        await addrRef.set({
          label: 'Home',
          line1: 'Flat 101, Green Heights',
          line2: 'Market Road, Yellapur',
          lat: 14.9650,
          lng: 74.7220,
          isDefault: true
        });
      }

      // If user is rider, seed deliveryPartner metadata
      if (u.role === 'delivery_partner') {
        const riderRef = db.collection('deliveryPartners').doc(u.uid);
        await riderRef.set({
          vehicleType: u.vehicleType || 'Motorcycle',
          licenseDocUrl: '/partner.jpg',
          verificationStatus: 'approved',
          rating: 4.8
        }, { merge: true });
      }
    }

    // 2. Seed Restaurants
    console.log('Seeding Restaurants...');
    for (const r of restaurants) {
      const resRef = db.collection('restaurants').doc(r.id);
      await resRef.set(r, { merge: true });
    }

    // 3. Seed Menu Items
    console.log('Seeding Menu Items...');
    for (const m of menuItems) {
      const menuRef = db.collection('menuItems').doc(m.id);
      await menuRef.set(m, { merge: true });
    }

    // 4. Seed Historical Orders
    console.log('Seeding Orders...');
    for (const o of mockOrders) {
      const orderRef = db.collection('orders').doc(o.id);
      await orderRef.set(o, { merge: true });
    }

    // 5. Seed Global Settings Config
    console.log('Seeding Global Settings Config...');
    const settingsRef = db.collection('settings').doc('config');
    await settingsRef.set({
      deliveryFeeRules: {
        baseFee: 30,
        perKmFee: 5,
        freeThreshold: 500
      },
      taxPct: 5,
      supportContact: '+919988776655'
    }, { merge: true });

    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
