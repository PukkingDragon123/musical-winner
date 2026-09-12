// ---------- Map: Spire-style paths laid over a city grid ----------
'use strict';
const MAP_ROWS = 15, MAP_COLS = 7, ROWS_PER_DAY = 3, MAP_ROW_H = 58, MAP_COL_W = 76, MAP_X0 = 88, MAP_TOP = 70;
const MAP_HEIGHT = MAP_TOP + MAP_ROWS * MAP_ROW_H + 40 + 70;
function generateMap(rng) {
  const grid = []; for (let r = 0; r <= MAP_ROWS; r++) grid.push(new Array(MAP_COLS).fill(null));
  const edges = new Set();
  const node = (r, c) => grid[r][c] || (grid[r][c] = { r, c, type: 'gig', next: [], prev: [], visited: false, x: 0, y: 0 });
  const crosses = (r, c, c2) => (c2 === c + 1 && edges.has(r + ',' + (c + 1) + '>' + c)) || (c2 === c - 1 && edges.has(r + ',' + (c - 1) + '>' + c));
  for (let i = 0; i < 6; i++) {
    let c = rng.int(1, MAP_COLS - 2); node(0, c);
    for (let r = 0; r < MAP_ROWS - 1; r++) {
      const opts = [c - 1, c, c + 1].filter(x => x >= 0 && x < MAP_COLS && !crosses(r, c, x)); const c2 = opts.length ? rng.pick(opts) : c;
      const a = node(r, c), b = node(r + 1, c2); if (!a.next.includes(b)) { a.next.push(b); b.prev.push(a); } edges.add(r + ',' + c + '>' + c2); c = c2;
    }
    const boss = node(MAP_ROWS, 3), last = grid[MAP_ROWS - 1][c]; if (!last.next.includes(boss)) { last.next.push(boss); boss.prev.push(last); }
  }
  const all = []; for (let r = 0; r <= MAP_ROWS; r++) for (let c = 0; c < MAP_COLS; c++) if (grid[r][c]) all.push(grid[r][c]);
  for (const n of all) {
    const day = Math.min(4, Math.floor(n.r / ROWS_PER_DAY)); n.day = day;
    if (n.r === MAP_ROWS) { n.type = 'boss'; n.venue = 'bridge'; n.bossMod = rng.pick(['fog', 'heckler', 'snob']); continue; }
    if (n.r === 0) n.type = 'gig';
    else if (n.r === 7) n.type = 'treasure';
    else {
      const roll = rng(), prevTypes = n.prev.map(p => p.type);
      if (roll < 0.14 && n.r >= 3) n.type = 'elite'; else if (roll < 0.28) n.type = 'shop'; else if (roll < 0.48) n.type = 'event';
      else if (roll < 0.57 && !prevTypes.includes('rest') && n.r % ROWS_PER_DAY !== ROWS_PER_DAY - 1) n.type = 'rest'; else if (roll < 0.66) n.type = 'openmic'; else n.type = 'gig';
      if (n.type === 'shop' && prevTypes.includes('shop')) n.type = 'gig';
      if (n.type === 'event' && prevTypes.length && prevTypes.every(t => t === 'event')) n.type = 'gig';
    }
    if (['gig', 'elite', 'openmic'].includes(n.type)) n.venue = rng.pick(DAY_VENUES[day]);
    if (n.type === 'elite') n.bossMod = rng.pick(BOSS_MOD_KEYS);
  }
  for (let d = 0; d < 5; d++) { const r = d * ROWS_PER_DAY + ROWS_PER_DAY - 1; const rowNodes = grid[r].filter(Boolean); if (!rowNodes.some(n => n.type === 'gig' || n.type === 'elite')) { const n = rng.pick(rowNodes); n.type = 'gig'; n.venue = rng.pick(DAY_VENUES[d]); } }
  // guarantee a shop in each of the first two days
  for (let d = 0; d < 2; d++) { const rows = [d * 3 + 1, d * 3 + 2]; const pool = rows.flatMap(r => grid[r].filter(Boolean)); if (!pool.some(n => n.type === 'shop')) { const n = rng.pick(pool.filter(n => n.type !== 'treasure')); n.type = 'shop'; n.venue = undefined; } }
  for (const n of all) { n.x = MAP_X0 + n.c * MAP_COL_W; n.y = MAP_TOP + (MAP_ROWS - n.r) * MAP_ROW_H + 40; }
  const boss = grid[MAP_ROWS][3]; boss.x = MAP_X0 + 3 * MAP_COL_W; boss.y = MAP_TOP + 30;
  return { grid, nodes: all, boss, citySeed: rng.int(1, 99999) };
}
