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

You walk it, tile by tile. Drag a route out from the band and it draws itself along the
streets with a chevron ribbon and the price in **stamina** at the end; roads are cheap, cutting
across a park costs double. Walkable ground is read straight off the drawn map, so the band
follows real streets and never crosses the bay. Stamina runs down as you go and a coffee at
any music shop buys some back.

Pins mark venues to play, music shops, food (Dumpling Dynasty, Burrito Beetle, Sourdough
Sam's), open mics to recruit, events, rest stops and street-corner pickups. Stamina runs out,
night falls, dinner costs money per bug, and the Golden Gate unlocks on the last day.

## Playing

Street sets are **real music by real composers** — Beethoven's Ode to Joy and Fur Elise,
Rimsky-Korsakov's Flight of the Bumblebee, Grieg's In the Hall of the Mountain King, Joplin's
The Entertainer, Bizet's Habanera, Offenbach's Can-Can, Bach's Toccata, Mozart's Rondo alla
Turca, Tchaikovsky's Swan Lake, W.C. Handy's St. Louis Blues, Strauss's Blue Danube and Foster's
Camptown Races. Every one is public domain, and the composer's name is on the set. Modern songs
are not: reproducing them would be infringement, so the opening concert is six original
stadium-rock hooks written for the game instead. Either way the chart follows the actual melody,
so the notes you hit are the tune.

**Your gear decides the difficulty and the money.** You start on a BUSTED instrument: fewer
lanes, a wide forgiving timing window, and a payout barely over half. Upgrading at a music shop
gives the lanes back and raises what the crowd pays, so the game gets harder exactly as it gets
richer. BUSTED, PAWN SHOP, WORKING, PRO, SIGNATURE.

The play area *is* your instrument, hung inside a lit stage: a truss of coloured lamps
overhead, beams sweeping across the lanes on the beat, speaker stacks at both edges and a
front row of bugs bobbing with lighters up. Guitar and bass are a wooden fretboard receding to a
vanishing point, with strings that ring and wobble when you hit them. Keyboard is a real
keyboard whose keys depress. Drums, saxophone, trumpet and violin each draw their own body,
keys, valves and bow.

**Every day states what it wants.** Three goals on a clipboard pinned to the map: take home a
number, play a set count, hold a combo, land perfects, walk blocks, add a bug, upgrade an
instrument, end the day with nobody hungry. Each pays cash or stamina the moment it lands.

| Instrument | Keys |
|---|---|
| Guitar / Bass / Keyboard / Tambourine | `D F J K` / `F J` / `S D F J K L` / `Space` |
| Drum Kit | `D` kick, `F` tom, `J` snare, `K` crash |
| Saxophone | hold `Space` |
| Trumpet | `J K L` valve combos |
| Violin | `↑/W` up bow, `↓/S` down bow |
| Bandmate spotlight | tap the closing ring |

Gold stars pay triple, red bombs cost you, roll bars are mashed. Applause x Mult = cash,
tallied Balatro-style. **After every set you draft one of three abilities** — more stars,
forgiven misses, per-perfect multipliers, chord bonuses, tip doublers, extra Uber tickets.

## Rooms, not menus

Most screens are a place rather than a panel. The **music shop** is a room: a pegboard of
hanging guitars, four shelves of stock, gold records on the wall, a counter with a register, a
tip jar and a funko, a snail behind it and other bugs browsing. What is for sale hangs on the
board or stands on the counter with a paper price tag, and you buy it by pointing at the thing
itself.

The **restaurant** hands you a torn-edge paper menu with the dishes drawn on it. Order, and the
food actually takes time: while it cooks you can tap a bandmate to talk to them or take the
warm-up, a short practice set that carries into your next gig. The **airport** has a duty free,
a departures board, planters, travellers asleep across the seats with backpacks at their feet
and kids bouncing beside them.

## Look

The whole city is a tileset. Road, junction, building, park, plaza, water and shore squares are
drawn as 24x24 pixel tiles and assembled with a neighbour mask, so junctions, centre lines,
crossings and surf edges all fall out of the grid. Walkability is the same array the renderer
uses, which is why the band can never walk into the bay.

960x540 internal, integer-scaled, every pixel drawn in code, and nothing is anti-aliased: even
the shadows, cymbals and map pins are scanline pixel shapes. The cast is built from big round
eyes, chunky limbs and one strong silhouette apiece: the drummer is a moose beetle whose
antlers are half his height, the elder carries a staff and a medallion, the firefly's abdomen
glows. Bugs breathe, squash and bounce on a shared animation clock, and switch expression with
what is happening: focused mid-set, grinning on a high combo, shocked on a drop, sad backstage.
Items are drawn at 32x32 in ornate gold slots. Scenes carry vignettes, colour grades, pooled
light from every practical lamp, drifting motes and dust.

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
