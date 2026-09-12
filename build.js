// Bundles index.html + js/*.js into a single self-contained HTML file.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync('index.html', 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const code = files.map(f => '// ===== ' + f + ' =====\n' + fs.readFileSync(f, 'utf8')).join('\n');
let out = html.replace(/<script src="[^"]+"><\/script>\n?/g, '');
out = out.replace('</body>', '<script>\n' + code + '\n</script>\n</body>');
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', 'bug-busker-orchestra.html'), out);
console.log('dist/bug-busker-orchestra.html', (out.length / 1024).toFixed(1) + ' KB, ' + files.length + ' modules');
