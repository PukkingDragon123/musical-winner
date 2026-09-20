// Is anything actually on the screen? Sweeps every scene that can be reached,
// on a mouse and on a phone, and fails any frame that is essentially empty.
// Two blank-screen bugs shipped because the scoring passed and nobody looked.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SCENES = [
  ['title', 'new TitleScene()'],
  ['select', 'new SelectScene()'],
  ['city', 'new CityScene()'],
  ['gig-prep', "new GigScene(NODES.filter(n=>n.type=='venue')[0])"],
  ['shop', "new ShopScene(NODES.find(n=>n.type=='shop'))"],
  ['food', "new FoodScene(NODES.find(n=>n.type=='food'))"],
  ['recruit', "new RecruitScene(NODES.find(n=>n.type=='recruit'))"],
  ['rest', "new RestScene(NODES.find(n=>n.type=='rest')||NODES[0])"],
  ['treasure', "new TreasureScene(NODES.find(n=>n.type=='treasure')||NODES[0])"],
  ['mystery', "new MysteryScene(NODES.find(n=>n.type=='mystery'))"],
  ['inside-mall', "new InteriorScene(NODES.find(n=>n.interior=='mall'))"],
  ['inside-metro', "new InteriorScene(NODES.find(n=>n.interior=='metro'))"],
  ['phone', "(()=>{Game.run.contacts=['moth','scout'];return new PhoneScene(()=>new CityScene());})()"],
  ['phone-maps', "(()=>{const p=new PhoneScene(()=>new CityScene());p.open('maps');return p;})()"],
  ['vegas', 'new VegasScene()'],
  ['plane', 'new PlaneScene()'],
  ['narita-arrival', 'new NaritaArrivalScene()'],
  ['narita-terminal', 'new NaritaTerminalScene()'],
  ['narita-kerb', 'new NaritaKerbScene()'],
  ['shop-colonymart', "new ShopInteriorScene(shopById('colonymart') || SHOPS[0], () => new NaritaTerminalScene())"],
  ['uber', 'new UberScene()'],
  ['capsule-night', 'new CapsuleNightScene()'],
  ['ladybug-phone', 'new LadybugPhone(() => new QuietStreetScene())'],
  ['morning', 'new MorningScene()'],
  ['goals-write', 'new GoalsScene(() => new QuietStreetScene())'],
  ['dressup', 'new DressUpScene(() => new QuietStreetScene())'],
  ['quiet-street', 'new QuietStreetScene()'],
  ['tonkatsu', 'new TonkatsuScene(() => new QuietStreetScene())'],
  ['subway-platform', 'new SubwayPlatformScene()'],
  ['subway-carriage', 'new SubwaySideScene("ueno", () => new QuietStreetScene())'],
  ['beatles-bar', 'new BeatlesBarScene()'],
  ['translate-form', 'new TranslateMiniScene(() => new BeatlesBarScene())'],
  ['upgrade-cards', 'new UpgradeScene({ onDone: function(){}, run: Game.run, songIndex: 0 })'],
  ['set-summary', 'new SetSummaryScene({ onDone: function(){}, run: Game.run })'],
  ['airport', 'new AirportScene()'],
  ['platform-narita', "new PlatformScene('narita')"],
  ['platform-ueno', "new PlatformScene('ueno')"],
  ['carriage', 'new CarriageScene()'],
  ['musicshop', "new MusicShopScene(NODES.find(n=>n.type=='shop'))"],
  ['ramen', "new RamenScene(NODES.find(n=>n.type=='food'))"],
  ['capsule', "new CapsuleScene(NODES.find(n=>n.id=='capsule'))"],
  ['busk-setup', "(()=>{const s=Game.scene;return new BuskScene({x: NODES[0].x, y: NODES[0].y + 40}, ()=>new CityScene());})()"],
  ['place-zoo', "new PlaceScene(NODES.find(n=>n.id=='uenozoo'))"],
  ['place-aquarium', "new PlaceScene(NODES.find(n=>n.id=='sumida'))"],
  ['place-anime', "new PlaceScene(NODES.find(n=>n.id=='animate'))"],
  ['place-arcade', "new PlaceScene(NODES.find(n=>n.id=='gamecenter'))"],
  ['skins', "new SkinShopScene(NODES.find(n=>n.id=='animate'),'skin')"],
  ['mods', "new SkinShopScene(NODES.find(n=>n.id=='animate'),'mod')"],
  ['crane', "new CraneScene(NODES.find(n=>n.id=='gamecenter'))"],
  ['arcade-rhythm', "new ArcadeRhythmScene(NODES.find(n=>n.id=='gamecenter'))"],
  ['event', "new EventScene(NODES.find(n=>n.type=='event')||NODES[0])"],
  ['draft', 'new DraftScene()'], ['night', 'new NightScene()'], ['band', 'new BandScene()'],
  ['backstage', 'new BackstageScene()'], ['flight', 'new FlightScene()'],
  ['gameover', 'new GameOverScene()'], ['victory', 'new VictoryScene()'],
];
const INSTR = ['drums', 'guitar', 'piano', 'taiko', 'sax', 'violin', 'trumpet', 'shamisen', 'koto', 'shakuhachi'];
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let bad = 0, checked = 0;
  const litNow = async (p) => p.evaluate(() => { const c = Game.canvas, g = c.getContext('2d');
    const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0, l = 0;
    for (let i = 0; i < d.length; i += 4 * 97) { n++; if (d[i] + d[i+1] + d[i+2] > 90) l++; }
    return Math.round(l / n * 100); });
  // A scene is allowed to be black for a moment — the opening deliberately is,
  // and transitions pass through it. What is not allowed is never showing
  // anything at all, so this waits for the first lit frame and only fails if
  // one never arrives.
  const lit = async (p, ms = 4200) => {
    let best = 0, waited = 0;
    while (waited < ms) { const v = await litNow(p); if (v > best) best = v; if (best >= 12) return best; await p.waitForTimeout(300); waited += 300; }
    return best;
  };
  for (const touch of [false, true]) {
    const ctx = await b.newContext({ viewport: { width: 960, height: 540 }, hasTouch: touch });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('file://' + require('path').resolve(__dirname, '..', 'index.html') + ''); await p.waitForTimeout(700);
    if (touch) await p.touchscreen.tap(480, 270); else await p.mouse.click(10, 10);
    await p.evaluate(() => { Game.run = RunState.newRun(ROSTER[2]); Game.run.day = 2; Game.run.money = 150; Game.run.recruitRandom(); });
    for (const [name, expr] of SCENES) {
      await p.evaluate((e) => { Game.lastError = null; try { Game.setScene(eval(e)); } catch (err) { Game.lastError = 'CTOR ' + err.message; } }, expr);
      await p.waitForTimeout(900);
      const v = await lit(p); checked++;
      const err = await p.evaluate(() => Game.lastError);
      if (v < 12 || err) { bad++; console.log('BLANK', name, (touch ? 'touch' : 'mouse'), v + '%', err || ''); }
    }
    // and every instrument actually playing, in both the gig and the concert
    for (const k of INSTR) {
      await p.evaluate((kk) => { const m = Game.run.members[0]; m.instrument = kk; m.quality = 4; m.gear = gearInstrument(kk, 4);
        Game.lastError = null; Game.setScene(new GigScene(NODES.filter(n => n.type === 'venue')[0])); }, k);
      await p.waitForTimeout(400);
      await p.evaluate(() => { const s = Game.scene; s.crate.slice(0, 3).forEach(x => s.toggleSong(x)); s.startPlay(); });
      await p.waitForTimeout(2600);
      const v = await lit(p); checked++;
      if (v < 12) { bad++; console.log('BLANK gig', k, (touch ? 'touch' : 'mouse'), v + '%'); }
      await p.evaluate((kk) => { Game.run = RunState.newRun(ROSTER.find(r => r.instrument === kk) || ROSTER[1]);
        Game.lastError = null; Game.setScene(new ConcertScene()); }, k);
      await p.waitForTimeout(700);
      for (let i = 0; i < 6; i++) { if (await p.evaluate(() => Game.scene.phase) === 'play') break;
        await p.evaluate(() => Game.scene.key('Enter')); await p.waitForTimeout(500); }
      await p.waitForTimeout(1600);
      const v2 = await lit(p); checked++;
      if (v2 < 12) { bad++; console.log('BLANK concert', k, (touch ? 'touch' : 'mouse'), v2 + '%'); }
    }
    if (errs.length) console.log('page errors', (touch ? 'touch' : 'mouse'), errs.slice(0, 3).join(' | '));
    await ctx.close();
  }
  console.log(bad ? 'FAIL ' + bad + ' blank of ' + checked : 'PASS - nothing blank, ' + checked + ' frames checked');
  await b.close();
})();
