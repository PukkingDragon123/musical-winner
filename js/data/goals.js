// ---------- Today's goals: the run always states what it wants ----------
'use strict';
// Each goal reads progress off the run and the day's tally. Meeting one pays out.
const GOALS = {
  earn:      { icon: 'coin',  name: 'TAKE HOME',     text: (g) => 'EARN ' + fmtMoney(g.n) + ' TODAY',        get: (r) => Math.round(r.today.earned), reward: { money: 12 } },
  play:      { icon: 'gig',   name: 'WORK THE TOWN', text: (g) => 'PLAY ' + g.n + ' SETS',                    get: (r) => r.today.gigs,               reward: { money: 10 } },
  combo:     { icon: 'note',  name: 'HOLD IT',       text: (g) => 'HIT A ' + g.n + ' COMBO',                  get: (r) => r.today.bestCombo,          reward: { stamina: 12 } },
  perfect:   { icon: 'star',  name: 'CLEAN HANDS',   text: (g) => 'LAND ' + g.n + ' PERFECTS',                get: (r) => r.today.perfects,           reward: { money: 14 } },
  walk:      { icon: 'fire',  name: 'ON FOOT',       text: (g) => 'WALK ' + g.n + ' BLOCKS',                  get: (r) => r.today.tiles,              reward: { stamina: 10 } },
  recruit:   { icon: 'openmic', name: 'FIND A VOICE', text: () => 'ADD A BUG TO THE BAND',                    get: (r) => r.today.recruited,          n: 1, reward: { money: 18 } },
  upgrade:   { icon: 'case',  name: 'BETTER GEAR',   text: () => 'UPGRADE AN INSTRUMENT',                     get: (r) => r.today.upgrades,           n: 1, reward: { money: 16 } },
  feed:      { icon: 'food',  name: 'NOBODY HUNGRY', text: () => 'END THE DAY WITH EVERYONE FED',             get: (r) => r.members.every(m => m.hunger === 0) ? 1 : 0, n: 1, reward: { money: 15 } },
};
const GOAL_KEYS = Object.keys(GOALS);
// Three goals a day, scaled to how far in you are. One is always a money goal.
function rollGoals(run) {
  const d = run.day, rng = run.rng;
  const out = [];
  out.push({ key: 'earn', n: [18, 30, 46, 64, 86][Math.min(4, d)] });
  const pool = rng.shuffle(['play', 'combo', 'perfect', 'walk', 'recruit', 'upgrade', 'feed']);
  const nums = {
    play: [1, 2, 2, 3, 3][Math.min(4, d)],
    combo: [14, 20, 26, 34, 42][Math.min(4, d)],
    perfect: [18, 28, 40, 55, 70][Math.min(4, d)],
    walk: [14, 20, 26, 32, 38][Math.min(4, d)],
  };
  for (const k of pool) {
    if (out.length >= 3) break;
    if (k === 'upgrade' && d === 0) continue;         // no shop money on day one
    if (k === 'recruit' && d > 3) continue;           // too late to be fair
    out.push({ key: k, n: GOALS[k].n || nums[k] || 1 });
  }
  return out.map(g => Object.assign({ done: false, paid: false }, g));
}
function goalProgress(run, g) { return clamp(GOALS[g.key].get(run) / g.n, 0, 1); }
function goalText(g) { return GOALS[g.key].text(g); }
// Called after anything that could move a goal along.
function checkGoals(run) {
  let paidAny = null;
  for (const g of run.goals || []) {
    if (g.done) continue;
    if (GOALS[g.key].get(run) >= g.n) {
      g.done = true;
      const rw = GOALS[g.key].reward;
      if (rw.money) run.money += rw.money;
      if (rw.stamina) run.rest(rw.stamina);
      paidAny = g;
    }
  }
  return paidAny;
}
function goalRewardText(g) { const rw = GOALS[g.key].reward; return rw.money ? '+' + fmtMoney(rw.money) : '+' + rw.stamina + ' STAMINA'; }
