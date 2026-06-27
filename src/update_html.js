const fs = require('fs');
const path = require('path');
const dir = 'd:/KHOALUAN/frontend';

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach(file => {
    file = path.join(directory, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.html')) {
      results.push(file);
    }
  });
  return results;
}

const htmlFiles = walk(dir);

htmlFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace AI/Startup terminology
  content = content.replace(/JobAI/g, 'Tuyển Dụng');
  content = content.replace(/AI Skill Matching/g, 'Gợi ý thông minh');
  content = content.replace(/AI-Powered Job Matching/g, 'Hệ Thống Gợi Ý Việc Làm');
  content = content.replace(/✨/g, '');
  content = content.replace(/🚀/g, '');
  content = content.replace(/🎯/g, '');
  content = content.replace(/🏢/g, '');
  content = content.replace(/💼/g, '');
  content = content.replace(/🔍/g, '');
  content = content.replace(/📋/g, '');
  content = content.replace(/🛠️/g, '');
  content = content.replace(/📍/g, '');
  content = content.replace(/⏰/g, '');
  content = content.replace(/💰/g, '');
  content = content.replace(/🕐/g, '');
  content = content.replace(/🎓/g, '');
  content = content.replace(/💻/g, '');
  content = content.replace(/✅/g, '');
  content = content.replace(/❌/g, '');
  content = content.replace(/⏳/g, '');
  content = content.replace(/🔥/g, '');
  content = content.replace(/👍/g, '');
  content = content.replace(/😊/g, '');
  content = content.replace(/📚/g, '');
  content = content.replace(/🎉/g, '');
  content = content.replace(/🗣️/g, '');
  content = content.replace(/👥/g, '');
  content = content.replace(/🌐/g, '');
  content = content.replace(/Gợi Ý Việc Làm AI/g, 'Gợi Ý Việc Làm');
  content = content.replace(/Gợi Ý AI/g, 'Gợi Ý Việc Làm');

  // Remove styling classes that look too modern
  content = content.replace(/class="gradient-text"/g, 'class="text-primary"');
  content = content.replace(/<span class="gradient-text">/g, '<span class="text-primary">');
  
  // Specific replacements in index.html for animations
  if (file.endsWith('index.html')) {
    content = content.replace(/<div style="position:absolute;top:-20px;right:-20px[^>]*><\/div>/g, '');
    content = content.replace(/<div style="position:absolute;bottom:20px;left:-30px[^>]*><\/div>/g, '');
    content = content.replace(/<div style="position:absolute;top:-100px;right:-100px[^>]*><\/div>/g, ''); // For register/login
  }

  // Rewrite
  fs.writeFileSync(file, content);
});

// Update style.css to support .text-primary
let css = fs.readFileSync(path.join(dir, 'css', 'style.css'), 'utf8');
css += '\n.text-primary { color: var(--primary); font-weight: inherit; }\n';
fs.writeFileSync(path.join(dir, 'css', 'style.css'), css);

console.log('Cleaned up HTML files from emojis and AI text');
