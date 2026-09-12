// Bundles the game into dist/bug-busker-orchestra.html (standalone) and dist/artifact.html (body-only fragment).
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const code = files.map(f => '// ===== ' + f + ' =====\n' + fs.readFileSync(f, 'utf8')).join('\n');
fs.mkdirSync('dist', { recursive: true });
let standalone = html.replace(/<script src="[^"]+"><\/script>\n?/g, '').replace('</body>', '<script>\n' + code + '\n</script>\n</body>');
fs.writeFileSync('dist/bug-busker-orchestra.html', standalone);
const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const fragment = `<title>Bug Busker Orchestra</title>\n<style>:root{color-scheme:dark}${style}</style>\n<canvas id="game" width="640" height="360"></canvas>\n<div id="hint">Click once for sound. Arrows + Enter, or mouse. On a phone: tap and use the pads.</div>\n<script>\n${code}\n</script>`;
fs.writeFileSync('dist/artifact.html', fragment);
console.log('bundled', files.length, 'modules ->', (standalone.length / 1024).toFixed(0) + ' KB');
