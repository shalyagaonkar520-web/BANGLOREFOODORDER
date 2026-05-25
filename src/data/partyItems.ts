import { Product } from '../types';

export const ICE_CAKES: Product[] = [
  // Half Kg (0.5kg) - ₹249
  { id: 'ice-cake-1-05', name: 'Butterscotch Cake (0.5kg)', price: 249, originalPrice: 499, category: 'Ice Cakes', type: 'food', image: '/butterscotch_cake.png', description: 'Premium butterscotch ice cream cake.', isVeg: true, isTopPick: true },
  { id: 'ice-cake-2-05', name: 'Red Velvet Cake (0.5kg)', price: 249, originalPrice: 499, category: 'Ice Cakes', type: 'food', image: '/red_velvet_cake.png', description: 'Luxurious red velvet ice cream cake.', isVeg: true, isTopPick: true },
  { id: 'ice-cake-3-05', name: 'Strawberry Cake (0.5kg)', price: 249, originalPrice: 499, category: 'Ice Cakes', type: 'food', image: '/strawberry_cake.jpg', description: 'Fresh strawberry delight.', isVeg: true },
  { id: 'ice-cake-4-05', name: 'Mango Cake (0.5kg)', price: 249, originalPrice: 499, category: 'Ice Cakes', type: 'food', image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=800&q=80', description: 'Tropical mango perfection.', isVeg: true },
  { id: 'ice-cake-5-05', name: 'Kiwi Cake (0.5kg)', price: 249, originalPrice: 499, category: 'Ice Cakes', type: 'food', image: '/kiwi_cake.png', description: 'Tangy and sweet kiwi ice cake.', isVeg: true },

  // 1 Kg (1kg) - ₹449
  { id: 'ice-cake-1-1', name: 'Butterscotch Cake (1kg)', price: 449, originalPrice: 899, category: 'Ice Cakes', type: 'food', image: '/butterscotch_cake.png', description: 'Premium butterscotch ice cream cake.', isVeg: true, isTopPick: true },
  { id: 'ice-cake-2-1', name: 'Red Velvet Cake (1kg)', price: 449, originalPrice: 899, category: 'Ice Cakes', type: 'food', image: '/red_velvet_cake.png', description: 'Luxurious red velvet ice cream cake.', isVeg: true, isTopPick: true },
  { id: 'ice-cake-3-1', name: 'Strawberry Cake (1kg)', price: 449, originalPrice: 899, category: 'Ice Cakes', type: 'food', image: '/strawberry_cake.jpg', description: 'Fresh strawberry delight.', isVeg: true },
  { id: 'ice-cake-4-1', name: 'Mango Cake (1kg)', price: 449, originalPrice: 899, category: 'Ice Cakes', type: 'food', image: 'https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=800&q=80', description: 'Tropical mango perfection.', isVeg: true },
  { id: 'ice-cake-5-1', name: 'Kiwi Cake (1kg)', price: 449, originalPrice: 899, category: 'Ice Cakes', type: 'food', image: '/kiwi_cake.png', description: 'Tangy and sweet kiwi ice cake.', isVeg: true },
];

export const NORMAL_CAKES: Product[] = [
  // Half Kg (0.5kg) - ₹399
  { id: 'cake-1-05', name: 'Black Forest (0.5kg)', price: 399, originalPrice: 799, category: 'Normal Cakes', type: 'food', image: '/black_forest_cake.png', description: 'Classic black forest cake.', isVeg: true },
  { id: 'cake-2-05', name: 'White Forest (0.5kg)', price: 399, originalPrice: 799, category: 'Normal Cakes', type: 'food', image: '/white_forest_cake.png', description: 'Elegant white forest cake.', isVeg: true },
  { id: 'cake-3-05', name: 'Red Forest (0.5kg)', price: 399, originalPrice: 799, category: 'Normal Cakes', type: 'food', image: '/red_forest_cake.jpg', description: 'Vibrant red forest cake.', isVeg: true },
  { id: 'cake-4-05', name: 'Purple Velvet (0.5kg)', price: 399, originalPrice: 799, category: 'Normal Cakes', type: 'food', image: '/purple_velvet_cake.png', description: 'Unique purple velvet cake.', isVeg: true },

  // 1 Kg (1kg) - ₹749
  { id: 'cake-1-1', name: 'Black Forest (1kg)', price: 749, originalPrice: 1499, category: 'Normal Cakes', type: 'food', image: '/black_forest_cake.png', description: 'Classic black forest cake.', isVeg: true },
  { id: 'cake-2-1', name: 'White Forest (1kg)', price: 749, originalPrice: 1499, category: 'Normal Cakes', type: 'food', image: '/white_forest_cake.png', description: 'Elegant white forest cake.', isVeg: true },
  { id: 'cake-3-1', name: 'Red Forest (1kg)', price: 749, originalPrice: 1499, category: 'Normal Cakes', type: 'food', image: '/red_forest_cake.jpg', description: 'Vibrant red forest cake.', isVeg: true },
  { id: 'cake-4-1', name: 'Purple Velvet (1kg)', price: 749, originalPrice: 1499, category: 'Normal Cakes', type: 'food', image: '/purple_velvet_cake.png', description: 'Unique purple velvet cake.', isVeg: true },
];

export const PARTY_ITEMS: Product[] = [
  { id: 'party-1', name: 'Party Spray', price: 69, category: 'Party Items', type: 'food', image: '/party_spray.png', description: 'Perfect for Birthday!', isVeg: true },
  { id: 'party-2', name: 'Party Popper', price: 99, category: 'Party Items', type: 'food', image: '/party_popper.png', description: 'Perfect for Birthday!', isVeg: true },
  { id: 'party-3', name: 'Spark Candle', price: 25, category: 'Party Items', type: 'food', image: '/spark_candle.png', description: 'Perfect for Birthday!', isVeg: true },
  { id: 'party-4', name: 'Party Cap', price: 20, category: 'Party Items', type: 'food', image: '/party_cap.png', description: 'Perfect for Birthday!', isVeg: true },
  { id: 'party-5', name: '5 Balloons Pack', price: 20, category: 'Party Items', type: 'food', image: '/balloons_pack.png', description: 'Perfect for Birthday!', isVeg: true },
];

export const SNACKS: Product[] = [
  { id: 'snack-1', name: 'Veg Puffs', price: 25, category: 'Snacks', type: 'food', image: '/veg_puff.png', description: 'Crispy and hot veg puffs.', isVeg: true },
  { id: 'snack-2', name: 'Egg Puffs', price: 30, category: 'Snacks', type: 'food', image: '/egg_puff.png', description: 'Delicious hot egg puffs.', isVeg: false },
];
