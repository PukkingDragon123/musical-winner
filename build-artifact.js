// Bundles the game into a body-only HTML fragment for publishing as an Artifact.
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const files = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
const code = files.map(f => '// ===== ' + f + ' =====\n' + fs.readFileSync(f, 'utf8')).join('\n');
const page = `<title>Bug Busker Orchestra</title>
<style>
  :root { color-scheme: dark; }
  html, body {
    margin: 0; padding: 0; height: 100%; overflow: hidden;
    background: #07060f;
    overscroll-behavior: none;
    -webkit-user-select: none; user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  body { display: flex; align-items: center; justify-content: center; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: #cfc9e6; }
  canvas { image-rendering: pixelated; image-rendering: crisp-edges; display: block; background: #000; touch-action: none; }
  #hint { position: fixed; bottom: 5px; left: 0; right: 0; text-align: center; font-size: 11px; letter-spacing: 0.04em; color: #5a5478; pointer-events: none; }
</style>
<canvas id="game" width="480" height="270"></canvas>
<div id="hint">Click once for sound. Arrows + Enter, or mouse. On a phone: tap and use the pads.</div>
<script>
${code}
</script>`;
fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/artifact.html', page);
console.log('dist/artifact.html', (page.length / 1024).toFixed(1) + ' KB');
