// ---------- The shape of the game ----------
// The game used to be a map you clicked. It is a side-scrolling life now: you
// start broke in Las Vegas, you get on a plane, you land, you find somewhere to
// sleep, and then every day is the same loop - wake up, write down what you
// want, go out, play, get paid, get a bit better known. This file is the
// plumbing that decides which scene comes next, and nothing else.
'use strict';

// Where the day happens. Everything that used to say "back to the map" says
// this instead.
function gameHub(opts) {
  if (typeof QuietStreetScene !== 'undefined') return new QuietStreetScene(opts || {});
  return new CityScene();
}
// The first scene of a new run.
function beginJourney() {
  if (typeof VegasScene !== 'undefined') return new VegasScene();
  return gameHub();
}
// Picking up a saved run: each chapter knows its own door back in.
const CHAPTERS = {
  vegas: () => typeof VegasScene !== 'undefined' ? new VegasScene() : gameHub(),
  plane: () => typeof PlaneScene !== 'undefined' ? new PlaneScene() : gameHub(),
  narita: () => typeof NaritaTerminalScene !== 'undefined' ? new NaritaTerminalScene() : gameHub(),
  uber: () => typeof UberScene !== 'undefined' ? new UberScene() : gameHub(),
  capsule: () => typeof CapsuleNightScene !== 'undefined' ? new CapsuleNightScene() : gameHub(),
  morning: () => typeof MorningScene !== 'undefined' ? new MorningScene() : gameHub(),
  tokyo: () => gameHub(),
};
function chapterResume() {
  const r = Game.run; if (!r) return beginJourney();
  if (r.nightPending && typeof NightScene !== 'undefined') return new NightScene();
  const f = CHAPTERS[r.chapter || 'tokyo'];
  return f ? f() : gameHub();
}
function setChapter(k) { if (Game.run) { Game.run.chapter = k; Game.run.save(); } }

// ---- The old top-down map is not the game any more.
// Rather than chase twenty call sites, the name is rebound: anything that still
// asks for the city gets the street it is standing on. `new CityScene()` still
// works, it just hands back the hub.
if (typeof QuietStreetScene !== 'undefined' && typeof CityScene !== 'undefined') {
  CityScene = function () { return gameHub(); };
}

// ---- The phone in the top bar is a Ladybug 11 now.
function openPhoneScene(back) {
  if (typeof LadybugPhone !== 'undefined') return new LadybugPhone(back);
  return new PhoneScene(back);
}
