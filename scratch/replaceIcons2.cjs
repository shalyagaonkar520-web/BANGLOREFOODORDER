const fs = require('fs');
const path = require('path');

const iconMap = {
  'Power': 'power_settings_new',
  'ShieldAlert': 'shield_with_heart',
  'Clock': 'schedule',
  'Save': 'save',
  'Phone': 'call',
  'Bell': 'notifications',
  'Loader2': 'sync',
  'Lock': 'lock',
  'AlertCircle': 'error',
  'Calendar': 'calendar_today',
  'TrendingUp': 'trending_up',
  'LogOut': 'logout',
  'Sliders': 'tune',
  'Sparkles': 'auto_awesome',
  'CheckCircle2': 'check_circle',
  'ChevronRight': 'chevron_right',
  'Activity': 'monitoring',
  'Moon': 'dark_mode',
  'Sun': 'light_mode',
  'Laptop': 'laptop_mac',
  'Flame': 'local_fire_department',
  'Search': 'search',
  'PackageSearch': 'manage_search',
  'Users': 'group',
  'Wallet': 'account_balance_wallet',
  'Map': 'map',
  'Ticket': 'confirmation_number',
  'Plus': 'add',
  'Trash2': 'delete',
  'Edit2': 'edit',
  'X': 'close',
  'Check': 'check',
  'Shield': 'security',
  'Percent': 'percent',
  'ShoppingBag': 'shopping_bag',
  'Navigation': 'navigation',
  'MapPin': 'location_on',
  'Navigation2': 'navigation',
  'Star': 'star',
  'Clock3': 'schedule',
  'Info': 'info',
  'Award': 'military_tech',
  'Heart': 'favorite',
  'ArrowRight': 'arrow_forward',
  'ThumbsUp': 'thumb_up',
  'ThumbsDown': 'thumb_down',
  'MessageCircle': 'chat_bubble',
  'Smile': 'sentiment_satisfied',
  'Frown': 'sentiment_dissatisfied',
  'Meh': 'sentiment_neutral',
  'ChevronLeft': 'chevron_left',
  'ChevronDown': 'keyboard_arrow_down',
  'ChevronUp': 'keyboard_arrow_up',
  'Download': 'download',
  'Droplets': 'water_drop',
  'Share2': 'share',
  'Share': 'share',
  'Copy': 'content_copy',
  'Send': 'send',
  'Play': 'play_arrow',
  'Pause': 'pause',
  'Settings': 'settings',
  'User': 'person',
  'Menu': 'menu',
  'Home': 'home',
  'Camera': 'photo_camera',
  'Image': 'image',
  'Wifi': 'wifi',
  'WifiOff': 'wifi_off',
  'Battery': 'battery_full',
  'Music': 'music_note',
  'Video': 'videocam',
  'Mic': 'mic',
  'Gift': 'redeem',
  'Truck': 'local_shipping',
  'AlertTriangle': 'warning',
  'Store': 'storefront',
  'Locate': 'my_location',
  'Mail': 'mail',
  'LogIn': 'login',
  'Undo': 'undo',
  'Redo': 'redo',
  'History': 'history',
  'Eye': 'visibility',
  'EyeOff': 'visibility_off',
  'CreditCard': 'credit_card',
  'Building': 'business',
  'Building2': 'business',
  'Coffee': 'coffee',
  'MoreVertical': 'more_vert',
  'MoreHorizontal': 'more_horiz',
  'Utensils': 'restaurant',
  'UtensilsCrossed': 'restaurant',
  'Zap': 'bolt',
  'Leaf': 'eco',
  'TrendingDown': 'trending_down',
  'PartyPopper': 'celebration',
  'Tent': 'holiday_village',
  'Hotel': 'hotel',
  'Quote': 'format_quote',
  'Cake': 'cake',
  'ArrowUpRight': 'call_made',
  'Car': 'directions_car',
  'Crosshair': 'gps_fixed',
  'Filter': 'filter_alt',
  'Maximize': 'fullscreen',
  'Minimize': 'fullscreen_exit',
  'RefreshCcw': 'refresh',
  'MessageSquare': 'chat',
  'Milk': 'local_drink',
  'Wrench': 'build',
  'Hourglass': 'hourglass_empty',
  'ChefHat': 'restaurant_menu',
  'ClipboardList': 'content_paste',
  'Pencil': 'edit',
  'PackageCheck': 'inventory_2',
  'IndianRupee': 'currency_rupee',
  'ToggleLeft': 'toggle_off',
  'ToggleRight': 'toggle_on',
  'ImageIcon': 'image',
  'Tag': 'local_offer',
  'RefreshCw': 'sync',
  'CheckCircle': 'check_circle',
  'Compass': 'explore',
  'PhoneCall': 'add_call',
  'Wand2': 'auto_awesome',
  'Hammer': 'build',
  'ShieldCheck': 'verified_user',
  'ArrowLeft': 'arrow_back',
  'Minus': 'remove',
  'SlidersHorizontal': 'tune',
  'Timer': 'timer',
  'ShoppingCart': 'shopping_cart',
  'Undo2': 'undo'
};

const replaceIcons = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Extract imported icons
  const importMatch = content.match(/import\s*\{([^}]+)\}\s*from\s*'lucide-react';/);
  if (importMatch) {
    const importedIcons = importMatch[1].split(',').map(s => s.trim()).filter(Boolean);
    for (const icon of importedIcons) {
      const parts = icon.split(' as ');
      const actualIcon = parts[parts.length - 1]; // handles "ChevronLeft as ArrowLeft"
      if (!iconMap[actualIcon]) {
          console.log('Missing mapping for', actualIcon, 'in', filePath);
      }
    }
  }

  // Remove import
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*'lucide-react';\n?/g, '');

  for (const [component, icon] of Object.entries(iconMap)) {
    // Replace <IconName className="..." />
    const regex1 = new RegExp(`<\\s*"?${component}"?\\s+className=([^>]*?)\\s*\\/?>`, 'g');
    content = content.replace(regex1, (match, className) => {
      let newClassName = className;
      if (newClassName.startsWith('"') || newClassName.startsWith("'")) {
         newClassName = newClassName.substring(0, 1) + 'material-symbols-outlined ' + newClassName.substring(1);
      } else if (newClassName.startsWith('{\`')) {
         newClassName = '{\`material-symbols-outlined ' + newClassName.substring(2);
      } else if (newClassName.startsWith('{"')) {
         newClassName = '{"material-symbols-outlined ' + newClassName.substring(2);
      } else if (newClassName.startsWith('{')) {
         newClassName = '{\`material-symbols-outlined \${' + newClassName.substring(1, newClassName.length-1) + '}\`}';
      }
      
      if (component === 'Loader2' && !newClassName.includes('animate-spin')) {
         newClassName = newClassName.replace('material-symbols-outlined', 'material-symbols-outlined animate-spin');
      }
      return `<span className=${newClassName}>${icon}</span>`;
    });

    // Replace <IconName />
    const regex2 = new RegExp(`<\\s*"?${component}"?\\s*\\/?>`, 'g');
    content = content.replace(regex2, `<span className="material-symbols-outlined">${icon}</span>`);
    
    // Replace <IconName ... /> (other props like size, color)
    const regex3 = new RegExp(`<\\s*"?${component}"?\\s+([^>]*?)\\s*\\/?>`, 'g');
    content = content.replace(regex3, (match, props) => {
       if(props.includes('className=')) return match; 
       return `<span className="material-symbols-outlined" ${props}>${icon}</span>`;
    });
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed', filePath);
};

const files = [
  'src/components/BulkOrderPage.tsx',
  'src/components/AboutFounder.tsx',
  'src/components/FeedbackPage.tsx',
  'src/components/InstallPrompt.tsx',
  'src/components/MilkPage.tsx',
  'src/components/MaintenanceGate.tsx',
  'src/components/HotelDashboard.tsx',
  'src/components/DeliveryDashboard.tsx',
  'src/components/CelebrationHub.tsx',
  'src/components/RecommendationPopup.tsx',
  'src/components/ResortBookingPage.tsx',
  'src/components/CelebrationDesign.tsx',
  'src/components/CategoryPage.tsx.bak',
  'src/components/SpecialOfferBanner.tsx',
  'src/components/SpecialThreeSection.tsx',
  'src/components/UndoManager.tsx'
];

files.forEach(f => replaceIcons(path.join('c:/Users/shaly/Desktop/FOODAPP', f)));
