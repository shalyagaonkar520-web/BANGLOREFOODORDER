import fs from 'fs';

const filePath = 'c:/Users/shaly/Desktop/FOODAPP/src/data/menuItems.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Categories to update
const targetCategories = ['Burgers & Rolls', 'Pizzas & Momos', 'Combos'];

// Regex to find items. This is tricky because the file is TS and has comments etc.
// I'll try to find objects with category in targetCategories and update their price.

// A simpler way is to use a regex that matches the category and then finds the price before it or after it.
// Items look like: { id: '...', name: '...', price: 123, category: 'Burgers & Rolls', ... }

content = content.replace(/\{([^}]+)\}/g, (match, p1) => {
    const categoryMatch = p1.match(/category:\s*['"]([^'"]+)['"]/);
    if (categoryMatch && targetCategories.includes(categoryMatch[1])) {
        return match.replace(/price:\s*(\d+)/, (priceMatch, price) => {
            return `price: ${parseInt(price) + 5}`;
        });
    }
    return match;
});

fs.writeFileSync(filePath, content);
console.log('Prices updated successfully.');
