# Bug Busker Orchestra

A 2D pixel-art **rhythm roguelike**. You were MONARCH's lead guitarist until The Solo.
Now you busk the streets of San Francisco with six dollars and a four-string guitar,
building a bug orchestra that puts hers to shame.

Runs in any modern browser with no build step: open `index.html`, or run `node build.js`
for a single-file `dist/bug-busker-orchestra.html`. Everything, including the music and
every sprite, is generated procedurally in code.

## The run

* **Opening concert.** A six-movement stadium set in the spirit of a certain rhapsody:
  ballad, riff, opera, fanfare, band spotlight, and The Solo. Each movement teaches an
  instrument. The Solo is unwinnable. You are fired on stage.
* **The map.** An oblique-view San Francisco with skyscrapers, Victorians, parks, the bay,
  landmarks, traffic and pedestrians. Slay-the-Spire paths run north: gigs, Big Gigs with
  crowd modifiers, shops, `?` events, rests, open mics, treasure, and the Golden Gate finale.
  Every three stops it is night and dinner costs money per bug. Starving bugs leave.
* **Gigs.** Detailed street venues with parallax facades, passers-by, cars, wind-blown
  leaves, fog and pigeons. Your instrument leads; bandmates take spotlights you back with
  quick-time taps. Hype draws watchers who tip.
* **Payout.** Every hit and every watcher adds APPLAUSE. Combos, hype and your CHARMS build
  MULT. Cash = Applause x Mult, tallied Balatro-style at the end of each set.
* **Builds.** 30 charms in five slots (instrument boosts, crowd synergies, band-composition
  bonuses, genre multipliers, risky trade-offs), permanent vouchers, one-shot consumables,
  instrument swaps, recruits with skill levels, and shop rerolls.

## Instruments

| Instrument | Minigame | Keys |
|---|---|---|
| Guitar / Bass / Keyboard / Tambourine | Falling lanes with holds, gold stars, bombs and roll bars | `D F J K` / `F J` / `S D F J K L` / `Space` |
| Taiko Drums | DON and KA notes, big notes with both hands, rolls | `F J` don, `D K` ka |
| Saxophone | Hold through phrases, release on the marker, manage breath | `Space` |
| Trumpet | Press the lit valve combination together | `J K L` |
| Violin | Bow up or down on the marker, hold long bows | `↑/W`, `↓/S` |
| Bandmate spotlight | Tap the closing ring | `Space` / `F` / `J` |

## Mobile

Fully touch-playable: tap menus, drag the map, and play with a row of large pads laid out
per instrument directly under the note receptor. Portrait phones rotate the game to fill
the long edge; `SCREEN: TURN` on the title overrides that.

## Code

```
js/core     util, fonts (5x7 and 3x5 bitmap), effects (particles, shake, wind), WebAudio synth
js/art      Pix buffer with auto-shading and outlines, procedural bug generator, UI kit,
            props, vehicles, trees, building facades, skylines, map blocks, landmarks
js/data     instruments, charms, vouchers, consumables, venues, boss modifiers, story, events
js/sim      songs and charts, rhythm engine with QTE, applause x mult scoring, crowd, map generator
js/scenes   title and cutscenes, stadium concert, city map, street gigs, shop/event/rest/night/band
js/game.js  loop, input (keyboard, mouse, multi-touch), run state, save/load
build.js    bundles dist/bug-busker-orchestra.html and dist/artifact.html
```
