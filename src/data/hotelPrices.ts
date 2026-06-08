export const hotelData: Record<string, { hotel: number, app: number }> = {
  "Chicken Biryani": { hotel: 120, app: 149 },
  "Mutton Biryani": { hotel: 250, app: 280 },
  "Half Mutton Biryani": { hotel: 150, app: 179 },
  "Hyderabadi Chicken Biryani": { hotel: 220, app: 249 },
  "Mutton Biryani Full": { hotel: 350, app: 399 },
  "Egg Biryani": { hotel: 120, app: 149 },
  "Paneer Biryani": { hotel: 160, app: 190 },
  "Veg Biryani": { hotel: 130, app: 160 },
  "Chicken Kabab (12 Pcs)": { hotel: 150, app: 180 },
  "Chicken Kabab Half (6 Pcs)": { hotel: 80, app: 119 },
  "Chicken 65 (Indian)": { hotel: 170, app: 200 },
  "Chicken 65 Chinese": { hotel: 210, app: 240 },
  "Chicken Lollipop": { hotel: 180, app: 209 },
  "Chicken Crispy": { hotel: 180, app: 220 },
  "Chicken Crispy Chinese": { hotel: 200, app: 240 },
  "Chicken Tandoori (8 pcs)": { hotel: 470, app: 549 },
  "Half Tandoori (4 pcs)": { hotel: 250, app: 299 },
  "Chicken Tikka": { hotel: 190, app: 220 },
  "Alpham": { hotel: 470, app: 549 },
  "Half Alpham": { hotel: 250, app: 299 },
  "Parota": { hotel: 15, app: 35 },
  "Butter Parota": { hotel: 20, app: 35 },
  "Tandoori Roti": { hotel: 15, app: 35 },
  "Butter Roti": { hotel: 20, app: 50 },
  "Naan": { hotel: 40, app: 50 },
  "Butter Naan": { hotel: 50, app: 60 },
  "Khuska Full": { hotel: 70, app: 99 },
  "Garlic Naan": { hotel: 55, app: 65 },
  "Chapati": { hotel: 10, app: 25 },
  "Veg Manchow Soup": { hotel: 100, app: 130 },
  "Mutton Fry": { hotel: 150, app: 180 },
  "Gobi Manchurian": { hotel: 80, app: 109 },
  "Gobi Chilli": { hotel: 120, app: 149 },
  "Paneer Manchurian": { hotel: 220, app: 259 },
  "Chicken Manchurian": { hotel: 220, app: 259 },
  "Paneer Chilli": { hotel: 220, app: 259 },
  "Chicken Chilli": { hotel: 220, app: 259 },
  "Mushroom Manchurian": { hotel: 220, app: 259 },
  "Mushroom Chilli": { hotel: 220, app: 259 },
  "Masala Papad": { hotel: 40, app: 69 },
  "Paneer Butter Masala": { hotel: 270, app: 299 },
  "Shahi Paneer": { hotel: 270, app: 299 },
  "Paneer Tikka Masala": { hotel: 270, app: 299 },
  "Paneer Hyderabadi": { hotel: 270, app: 299 },
  "Paneer Kolhapuri": { hotel: 270, app: 299 },
  "Butter Paneer": { hotel: 290, app: 320 },
  "Paneer Masala": { hotel: 180, app: 229 },
  "Palak Paneer": { hotel: 170, app: 200 },
  "Kaju Masala": { hotel: 220, app: 250 },
  "Mix Veg": { hotel: 130, app: 160 },
  "Veg Kolhapuri": { hotel: 170, app: 200 },
  "Veg Kadai": { hotel: 170, app: 229 },
  "Dal Tadka": { hotel: 120, app: 150 },
  "Shawarma": { hotel: 70, app: 99 },
  "Burger": { hotel: 50, app: 94 },
  "Keema Pav": { hotel: 25, app: 40 },
  "Chicken Samosa (2 pcs)": { hotel: 25, app: 39 },
  "Veg Fried Rice": { hotel: 100, app: 129 },
  "Veg Pulav": { hotel: 130, app: 159 },
  "Chicken Fried Rice": { hotel: 120, app: 149 },
  "Chicken Schezwan Rice": { hotel: 140, app: 170 },
  "Egg Fried Rice": { hotel: 100, app: 129 },
  "Schezwan Egg Rice": { hotel: 130, app: 159 },
  "Mutton Fried Rice": { hotel: 170, app: 200 },
  "Schezwan Mutton Rice": { hotel: 200, app: 240 },
  "Chicken Noodles": { hotel: 110, app: 149 },
  "Veg Noodles": { hotel: 80, app: 100 }
};

export const hotelPrices: Record<string, number> = Object.fromEntries(
    Object.entries(hotelData).map(([name, prices]) => [name, prices.hotel])
);

export function calculateProfit(itemName: string, appPrice: number, quantity: number = 1) {
  const hotelPrice = hotelPrices[itemName] || 0;
  const profitPerItem = appPrice - hotelPrice;
  const totalProfit = profitPerItem * quantity;

  return {
    itemName,
    hotelPrice,
    appPrice,
    quantity,
    profitPerItem,
    totalProfit
  };
}
