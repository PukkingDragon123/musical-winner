# Bug Busker Orchestra

A 2D pixel-art **rhythm roguelike**. You lead a street band of bug musicians through a
Slay-the-Spire style map of San Francisco, busk for tips at BART stations, street corners,
Chinatown alleys and piers, and try to afford a full meal for every band member each night.

Runs in any modern browser with no build step: open `index.html` (or serve the folder with
any static file server). Everything, including the music, is generated procedurally in code.

## How to play

* **Map** – Arrow keys pick a path, Enter travels. `TAB` opens the band screen, `Esc` saves and exits.
  Nodes: Gig, Big Gig, Music Shop, `?` Event, Rest, Treasure, Open Mic, and the Finale at the Golden Gate.
* **Gigs** are skill-based rhythm minigames. Each instrument plays differently:

  | Instrument | Game | Keys |
  |---|---|---|
  | Guitar | 4-lane falling notes (Guitar Hero), hold notes | `D F J K` |
  | Bass | 2 fat lanes, long slides | `F J` |
  | Keyboard | 6 lanes with chords | `S D F J K L` |
  | Tambourine | 1 lane, humble | `Space` |
  | Taiko Drums | Beat game: red DON / blue KA, big notes need both hands, mash rolls | `F J` don, `D K` ka |
  | Saxophone | Hold for each phrase, release on time, manage your breath meter | `Space` |
  | Trumpet | Press the lit valve combination together on the beat | `J K L` |
  | Violin | Bow up / bow down on the marker, hold long bows | `↑/W`, `↓/S` |

* With several members the song **switches instruments every 4 bars**. Watch the SWITCH warning.
* PERFECT hits raise **hype**; misses drop it. Hyped passers-by stop, watch and throw coins and bills
  into the hat. Combo milestones make the whole crowd cheer and tip at once.
* Every night dinner costs money per bug. Hungry bugs play with smaller timing windows;
  a starving bug leaves at dawn. If **you** starve, the run is over.
* Shops sell instruments (quality stars raise tips), relics (passive boosts) and consumables.
  Events, rests and open mics hold surprises, skill-ups and new recruits.
* `Esc` pauses a gig, `M` mutes. Progress autosaves after every node.

## Structure

```
index.html        canvas shell
js/util.js        RNG, math, drawing helpers
js/font.js        3x5 bitmap font
js/sprites.js     pixel-art bugs, instruments, props, icons
js/audio.js       WebAudio synth voices, drums, UI sounds
js/data.js        instruments, items, venues, events
js/music.js       procedural songs, charts, backing band
js/rhythm.js      rhythm engine and the five minigame styles
js/crowd.js       passers-by, watchers, tips
js/mapgen.js      Slay-the-Spire style map generator
js/scenes.js      title, map, band, shop, event, rest, treasure, night, endings
js/perform.js     performance scene (prep, play, results)
js/game.js        game loop, input, run state, save/load
```

## Mobile

The game is fully playable by touch. Every screen is tap-driven, the map scrolls by
dragging, and gigs get a row of large pads along the bottom of the screen, laid out per
instrument (four lanes, DON/KA drum pads, a BLOW pad for the sax, three trumpet valves,
two bowing pads). During a touch gig the street scene moves to a strip along the top so
the pads sit directly under the note receptor. A portrait phone rotates the game to fill
the long edge; `SCREEN: TURN` on the title menu overrides that either way.

## Builds

```
node build.js           # dist/bug-busker-orchestra.html  (standalone single file)
node build-artifact.js  # dist/artifact.html              (body-only fragment for publishing)
```
