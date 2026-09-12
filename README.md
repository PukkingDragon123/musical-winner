# Bug Busker Orchestra

A 2D pixel-art **rhythm roguelike**. Pick a busker, headline a stadium, blow the solo,
get flown to San Francisco, and rebuild a band one street corner at a time.

Open `index.html`, or run `node build.js` for a single-file `dist/bug-busker-orchestra.html`.
No build step, no dependencies. Every sprite, every note and every street is generated in code.

## The opening

**Character select** in fighting-game style: eight buskers with stats, instruments and a
starting ability. Then **RHAPSODY OF THE BUG**, a six-movement stadium set with a four-piece
band (drums, keys, vocals and you), sweeping lights, lasers and pyro that escalate each
movement. The final solo cannot be landed. The crowd boos and throws tomatoes, cans and a
boot. Backstage is silent. They put you on a plane. You practise once at 30,000 feet.

## The city

San Francisco drawn like a street map: white roads with names, beige blocks, green parks,
the bay, Chinatown, the Mission, Twin Peaks, the Sunset, piers and the Golden Gate. Cars and
pedestrians move along the roads; weather rolls through.

You travel on **Uber tickets** — one per hop, two for a long one, seven a day. Pins mark
venues to play, music shops, food (Dumpling Dynasty, Burrito Beetle, Sourdough Sam's),
open mics to recruit, events, rest stops and street-corner pickups. Tickets run out, night
falls, dinner costs money per bug, and the Golden Gate unlocks on the last day.

## Playing

Every set is **real public-domain music** — Ode to Joy, Flight of the Bumblebee, In the Hall
of the Mountain King, The Entertainer, Habanera, Toccata, St. Louis Blues and more. The chart
follows the actual melody, so the notes you hit are the tune.

The play area *is* your instrument. Guitar and bass are a wooden fretboard receding to a
vanishing point, with strings that ring and wobble when you hit them. Keyboard is a real
keyboard whose keys depress. Drums, saxophone, trumpet and violin each draw their own body,
keys, valves and bow.

| Instrument | Keys |
|---|---|
| Guitar / Bass / Keyboard / Tambourine | `D F J K` / `F J` / `S D F J K L` / `Space` |
| Taiko Drums | `F J` don, `D K` ka |
| Saxophone | hold `Space` |
| Trumpet | `J K L` valve combos |
| Violin | `↑/W` up bow, `↓/S` down bow |
| Bandmate spotlight | tap the closing ring |

Gold stars pay triple, red bombs cost you, roll bars are mashed. Applause x Mult = cash,
tallied Balatro-style. **After every set you draft one of three abilities** — more stars,
forgiven misses, per-perfect multipliers, chord bonuses, tip doublers, extra Uber tickets.

## Mobile

Fully touch-playable: tap pins, drag the map, and play on large pads laid out under the note
receptor. Portrait phones rotate to fill the long edge.

## Code

```
js/core     util, bitmap fonts, particles/shake/wind, WebAudio synth
js/art      shaded pixel buffer, bug generator, UI kit, props, buildings, instrument views
js/data     instruments, abilities, venues, the San Francisco map, public-domain tunes
js/sim      chart generation from melody, rhythm engine, scoring, crowd
js/scenes   title and select, concert/backstage/flight, city, gig and draft, shops and night
js/game.js  loop, input, run state, save/load
```
