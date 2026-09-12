# Bug Busker Orchestra

A 2D pixel-art **rhythm roguelike**. Pick a busker, headline a stadium, blow the solo,
get flown to San Francisco, and rebuild a band one street corner at a time.

Open `index.html`, or run `node build.js` for a single-file `dist/bug-busker-orchestra.html`.
No build step, no dependencies. Every sprite, every note and every street is generated in code.

## The opening

The title curtain lifts straight onto the stage. **Four bugs stand in the lights** — Merc on
keys and vocals, Stag on lead guitar, Dot on drums, Slim on bass. A spotlight slides between
them while you choose. The one you take is the one you play for the rest of the run.

Then **A NIGHT AT THE HIVE**, a six-movement stadium set of original stadium-rock hooks:
House Lights, Slow Burn, Low Road, Six Strings, Choir of Thousands, and the solo nobody has
ever landed. Every non-playing beat is framed full-screen and cinematic — lights, lasers and
pyro escalate each movement, the band cheers or slumps with your accuracy, and a lower-third
plate names the movement instead of a wall of text.

The last solo cannot be landed. The crowd boos and throws tomatoes, cans and a boot.
Backstage is a dressing room with a bulb-lit mirror, a costume rack, gold records and one
open door. They put you on a plane. You practise once at 30,000 feet.

## The city

San Francisco drawn like a street map: white roads with names, beige blocks, green parks,
the bay, Chinatown, the Mission, Twin Peaks, the Sunset, piers and the Golden Gate. Cars and
pedestrians move along the roads; weather rolls through.

You travel on **Uber tickets** — one per hop, two for a long one, seven a day. Pins mark
venues to play, music shops, food (Dumpling Dynasty, Burrito Beetle, Sourdough Sam's),
open mics to recruit, events, rest stops and street-corner pickups. Tickets run out, night
falls, dinner costs money per bug, and the Golden Gate unlocks on the last day.

## Playing

Street sets are **real public-domain music** — Ode to Joy, Flight of the Bumblebee, In the
Hall of the Mountain King, The Entertainer, Habanera, Toccata, St. Louis Blues and more. The
opening concert is six original stadium-rock hooks written for it. Either way the chart
follows the actual melody, so the notes you hit are the tune.

The play area *is* your instrument, hung inside a lit stage: a truss of coloured lamps
overhead, beams sweeping across the lanes on the beat, speaker stacks at both edges and a
front row of bugs bobbing with lighters up. Guitar and bass are a wooden fretboard receding to a
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

## Look

960x540 internal, integer-scaled, every pixel drawn in code. Bugs breathe, squash and bounce
on a shared animation clock, and switch expression with what is happening: focused mid-set,
grinning on a high combo, shocked on a drop, sad backstage. Scenes carry vignettes, warm and
cool colour grades, pooled light from every practical lamp, drifting motes and dust.

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
