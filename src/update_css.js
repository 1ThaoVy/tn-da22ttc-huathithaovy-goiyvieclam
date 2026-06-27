const fs = require('fs');
let css = fs.readFileSync('d:/KHOALUAN/frontend/css/style.css', 'utf8');

// Replace Root Tokens
const newRoots = `:root {
  --primary: #2563eb;
  --primary-dark: #1d4ed8;
  --primary-light: #60a5fa;
  --secondary: #475569;
  --accent: #3b82f6;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  
  --bg-base: #f8fafc;
  --bg-surface: #ffffff;
  --bg-card: #ffffff;
  --bg-card-hover: #f1f5f9;
  --bg-input: #ffffff;
  
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-muted: #64748b;
  
  --border: #e2e8f0;
  --border-focus: #2563eb;
  
  --gradient-primary: #2563eb;
  --gradient-card: #ffffff;
  --gradient-hero: #f8fafc;
  
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-glow: none;
`;

css = css.replace(':root {', newRoots);

// Remove old tokens
css = css.replace(/--primary: #6366f1;[\s\S]*?--shadow-glow: 0 0 30px rgba\(99, 102, 241, 0\.3\);/m, '');

// Navbar
css = css.replace('background: rgba(15, 15, 26, 0.9);', 'background: rgba(255, 255, 255, 0.95);');

// Change hover effects from white to black alpha
css = css.replace(/rgba\(255,255,255,0\.05\)/g, 'rgba(0,0,0,0.05)');
css = css.replace(/rgba\(255,255,255,0\.1\)/g, 'rgba(0,0,0,0.1)');
css = css.replace(/rgba\(255,255,255,0\.02\)/g, 'rgba(0,0,0,0.02)');
css = css.replace(/rgba\(255,255,255,0\.04\)/g, 'rgba(0,0,0,0.04)');
css = css.replace(/rgba\(255,255,255,0\.03\)/g, 'rgba(0,0,0,0.03)');
css = css.replace(/rgba\(255,255,255,0\.3\)/g, 'rgba(0,0,0,0.1)'); // Shimmer

// Fix gradient text to normal text
css = css.replace(
  /.gradient-text {[\s\S]*?}/m,
  `.gradient-text { color: var(--primary); }`
);

// Fix btn-primary box shadow
css = css.replace(/box-shadow: 0 4px 15px rgba\(99, 102, 241, 0\.4\);/g, 'box-shadow: var(--shadow-sm);');
css = css.replace(/box-shadow: 0 8px 25px rgba\(99, 102, 241, 0\.5\);/g, 'box-shadow: var(--shadow-md);');

fs.writeFileSync('d:/KHOALUAN/frontend/css/style.css', css);
console.log('CSS updated successfully');
