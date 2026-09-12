// ---------- Slay-the-Spire-style map of San Francisco ----------
'use strict';
const MAP_ROWS = 15;      // regular rows; row 15 = boss
const MAP_COLS = 7;
const ROWS_PER_DAY = 3;
const MAP_ROW_H = 30;

function generateMap(rng) {
  const grid = []; // grid[r][c] = node or null
  for (let r = 0; r <= MAP_ROWS; r++) { grid.push(new Array(MAP_COLS).fill(null)); }
  const edges = new Set(); // "r,c>c2"
  const node = (r, c) => grid[r][c] || (grid[r][c] = { r, c, type: 'gig', next: [], prev: [], visited: false, x: 0, y: 0 });
  const crosses = (r, c, c2) => {
    // would edge (r,c)->(r+1,c2) cross an existing edge?
    if (c2 === c + 1 && edges.has(r + ',' + (c + 1) + '>' + c)) return true;
    if (c2 === c - 1 && edges.has(r + ',' + (c - 1) + '>' + c)) return true;
    return false;
  };
  const numPaths = 6;
  const starts = [];
  for (let i = 0; i < numPaths; i++) {
    let c = rng.int(1, MAP_COLS - 2);
    if (i === 1) { let tries = 0; while (c === starts[0] && tries++ < 10) c = rng.int(0, MAP_COLS - 1); }
    starts.push(c);
    node(0, c);
    for (let r = 0; r < MAP_ROWS - 1; r++) {
      const opts = [c - 1, c, c + 1].filter(x => x >= 0 && x < MAP_COLS && !crosses(r, c, x));
      const c2 = opts.length ? rng.pick(opts) : c;
      const a = node(r, c), b = node(r + 1, c2);
      if (!a.next.includes(b)) { a.next.push(b); b.prev.push(a); }
      edges.add(r + ',' + c + '>' + c2);
      c = c2;
    }
    // connect last regular row to boss
    const boss = node(MAP_ROWS, 3);
    const last = grid[MAP_ROWS - 1][c];
    if (!last.next.includes(boss)) { last.next.push(boss); boss.prev.push(last); }
  }
  // Assign types
  const all = [];
  for (let r = 0; r <= MAP_ROWS; r++) for (let c = 0; c < MAP_COLS; c++) if (grid[r][c]) all.push(grid[r][c]);
  for (const n of all) {
    const day = Math.min(4, Math.floor(n.r / ROWS_PER_DAY));
    n.day = day;
    if (n.r === MAP_ROWS) { n.type = 'boss'; n.venue = 'bridge'; continue; }
    if (n.r === 0) { n.type = 'gig'; }
    else if (n.r === 7) { n.type = 'treasure'; }
    else {
      const roll = rng();
      const prevTypes = n.prev.map(p => p.type);
      if (roll < 0.13 && n.r >= 3) n.type = 'elite';
      else if (roll < 0.26) n.type = 'shop';
      else if (roll < 0.47) n.type = 'event';
      else if (roll < 0.56 && !prevTypes.includes('rest') && n.r % ROWS_PER_DAY !== ROWS_PER_DAY - 1) n.type = 'rest';
      else if (roll < 0.65) n.type = 'openmic';
      else n.type = 'gig';
      // no two shops in a row on the same path
      if (n.type === 'shop' && prevTypes.includes('shop')) n.type = 'gig';
      if (n.type === 'event' && prevTypes.every(t => t === 'event') && prevTypes.length) n.type = 'gig';
    }
    if (n.type === 'gig' || n.type === 'elite' || n.type === 'openmic') n.venue = rng.pick(DAY_VENUES[day]);
  }
  // Guarantee: the last row before each dinner has a gig or elite in most spots (money before meal)
  for (let d = 0; d < 5; d++) {
    const r = d * ROWS_PER_DAY + ROWS_PER_DAY - 1;
    const rowNodes = grid[r].filter(Boolean);
    if (!rowNodes.some(n => n.type === 'gig' || n.type === 'elite')) { const n = rng.pick(rowNodes); n.type = 'gig'; n.venue = rng.pick(DAY_VENUES[d]); }
  }
  // positions (row 0 at bottom)
  for (const n of all) {
    n.x = 48 + n.c * 40 + (n.type === 'boss' ? 0 : rng.int(-5, 5));
    n.y = (MAP_ROWS - n.r) * MAP_ROW_H + 30 + (n.type === 'boss' ? 0 : rng.int(-4, 4));
  }
  const boss = grid[MAP_ROWS][3]; boss.x = 48 + 3 * 40; boss.y = 22;
  return { grid, nodes: all, boss };
}
