const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.html') || dirPath.endsWith('.js')) {
        callback(dirPath);
      }
    }
  });
}

walkDir('frontend', (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/>\s*Tuyển Dụng\s*</g, '>SmartJob<')
    .replace(/Tuyển Dụng —/g, 'SmartJob —')
    .replace(/alt="Tuyển Dụng/g, 'alt="SmartJob')
    .replace(/alt='Tuyển Dụng/g, "alt='SmartJob")
    .replace(/Tuyển Dụng<\/span>/g, 'SmartJob</span>')
    .replace(/<title>Tuyển Dụng/g, '<title>SmartJob')
    .replace(/class="text-primary">Tuyển Dụng/g, 'class="text-primary">SmartJob')
    .replace(/ Tuyển Dụng</g, ' SmartJob<')
    .replace(/ Tuyển Dụng<\/span>/g, ' SmartJob</span>')
    .replace(/Tuyển Dụng Logo/g, 'SmartJob Logo')
    .replace(/© 2025 Tuyển Dụng/g, '© 2025 SmartJob');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent);
    console.log('Updated: ' + file);
  }
});
