// ---------- The phone ----------
// People you meet give you their number. The phone keeps them, and each one
// will do exactly one thing for you when you call it in.
'use strict';
const CONTACTS = {
  moth:    { name: 'THE OLD MOTH', who: 'DANGO CART', icon: 'dango', tint: '#ffd24a',
             desc: 'Feeds the whole band, once, for nothing.',
             use: (s, log) => { s.members.forEach(m => m.stamina = 100); log('He sends three trays down on the back of a bike. Everyone eats. (Full stamina)'); } },
  officer: { name: 'THE OFFICER', who: 'KOBAN', icon: 'cop', tint: '#8ab0e0',
             desc: 'Nobody moves you on tonight, and a bigger pitch.',
             use: (s, log) => { s.buffs.crowd = (s.buffs.crowd || 1) * 1.5; log('A word on the radio and the whole corner is yours. (Much bigger crowd)'); } },
  rival:   { name: 'THE OTHER BUSKER', who: 'UNDERPASS', icon: 'openmic', tint: '#8ad8ff',
             desc: 'Sits in for a set. Two acts pay better than one.',
             use: (s, log) => { s.buffs.mult = (s.buffs.mult || 0) + 2; log('He turns up with the good amp and plays the whole set with you. (+2 Mult)'); } },
  scout:   { name: 'A&R', who: 'THE CARD', icon: 'elite', tint: '#c58bff',
             desc: 'One booking, paid up front, no contract.',
             use: (s, log) => { s.money += 55; log('"One night. No paperwork." The money lands before you play it. (+$55)'); } },
  monk:    { name: 'THE MONK', who: 'THE TEMPLE', icon: 'rest', tint: '#ffd9a0',
             desc: 'The temple yard, to yourselves, for a night.',
             use: (s, log) => { s.members.forEach(m => m.stamina = Math.min(100, m.stamina + 40)); s.karma += 2; log('Gravel, cedars, and nobody at all. (+40 stamina each)'); } },
  vendor:  { name: 'THE FIXER', who: 'AMEYOKO', icon: 'shop', tint: '#6be585',
             desc: 'Gets you a piece of gear at cost.',
             use: (s, log) => { const me = s.members[0]; if (me.quality < 5) { me.quality = Math.min(5, me.quality + 1); s.today.upgrades++; log('A box arrives with no receipt in it. Your kit is a rung better.'); } else { s.money += 30; log('Nothing left to sell you, so he just hands over $30.'); s.money += 0; } } },
};
const CONTACT_KEYS = Object.keys(CONTACTS);
