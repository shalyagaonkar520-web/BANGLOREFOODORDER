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
  'Percent': 'percent'
};

const replaceIcons = (filePath) => {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove import
  content = content.replace(/import\s*\{[^}]*\}\s*from\s*'lucide-react';\n?/g, '');

  for (const [component, icon] of Object.entries(iconMap)) {
    // Replace <IconName className="..." />
    const regex1 = new RegExp(`<\\s*"?${component}"?\\s+className=([^>]*?)\\s*\\/?>`, 'g');
    content = content.replace(regex1, (match, className) => {
      // Ensure className string has material-symbols-outlined
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
      
      // Replace animate-spin for loader
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
       if(props.includes('className=')) return match; // Already handled
       return `<span className="material-symbols-outlined" ${props}>${icon}</span>`;
    });
  }

  // Also replace colors to HungerMoment defaults
  // Let's do a few basic color replacements
  content = content.replace(/text-brand/g, 'text-primary');
  content = content.replace(/bg-brand/g, 'bg-primary');
  content = content.replace(/border-brand/g, 'border-primary');
  content = content.replace(/text-\[#FFD700\]/g, 'text-primary');
  content = content.replace(/bg-\[#FFD700\]/g, 'bg-primary');
  content = content.replace(/text-\[#FF4D00\]/g, 'text-primary');
  content = content.replace(/bg-\[#FF4D00\]/g, 'bg-primary');
  content = content.replace(/from-\[#FF4D00\]\s+to-\[#FFB700\]/g, 'from-primary to-primary-container');
  content = content.replace(/text-matte-black/g, 'text-surface');
  content = content.replace(/bg-matte-black/g, 'bg-surface');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Processed', filePath);
};

const files = [
  'src/components/AdminPage.tsx',
  'src/components/AdminMenuManager.tsx',
  'src/components/AdminCouponManager.tsx',
  'src/components/AdminRestaurantManager.tsx'
];

files.forEach(f => replaceIcons(path.join('c:/Users/shaly/Desktop/FOODAPP', f)));
