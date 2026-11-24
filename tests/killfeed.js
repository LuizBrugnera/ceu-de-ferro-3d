'use strict';
/* the kill feed and the scoreboard (KF, SB; cf-pol2 P27). The simulation: a death the player cares about is a row of S.kf (who, whom,
   with what, how far): his own kills and death, a human player's, a vehicle or aircraft lost near him; an AI soldier's death far from him
   is not. A death is listed once, also when the server echoes the room's down and aidown back to the host that sent them, and the centre
   feed no longer says the kill in words. The view: the rows on the HUD's right column, each name in its side's colour; Tab tapped opens
   the general's view on its release, Tab held shows the scoreboard until it is let go */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- the kill feed and the scoreboard (cf-pol2 P27)'), b = html.indexOf('/* ---------- missiles: what the player is shown');
console.log('page: ' + H.PAGE);
if (a < 0 || b < a) { console.log('no kill feed (KF): a page before it'); process.exit(0); }

console.log('-- the rows: whose deaths are listed --');
{
  const C = H.load({ seed: 5 }), $ = C.$, S = C.sandbox('modern'), B = S.base[0], KF = $('KF');
  const me = C.addMan('blueRifle', 0, B.x + 100, B.z + 50, 0), foe = C.addMan('redRifle', 1, B.x + 184, B.z + 50, 0);
  me.me = 1; S.my = me;
  C.killMan(foe, me);
  const r = S.kf[0];
  ok(S.kf.length === 1 && r.k === 'Você' && r.kme && r.v === foe.name && r.vt === 1 && r.mine, 'the player kills an enemy soldier: "Você ▸ ' + (r && r.v) + '"');
  ok(r.w === me.arms[me.w].d.name && r.d === 84, '  with his weapon and the distance (' + r.w + ', ' + r.d + ' m)');
  C.killMan(foe, me); $('kfNote')(foe, me); ok(S.kf.length === 1, 'the same death noted again (the server\'s echo): still one row');
  const far1 = C.addMan('redRifle', 1, B.x + 2900, B.z, 0), far0 = C.addMan('blueRifle', 0, B.x + 2950, B.z, 0);
  C.killMan(far1, far0); ok(S.kf.length === 1, 'an AI soldier killed by an AI soldier far away: not listed');
  const W = C.watch('modern', { len: 0 }); C.run(1, null, 1 / 20);
  const P = C.addMan('blueRifle', 0, 0, 0, 0); P.me = 1; W.my = P; W.demo = false;   // the watch is a demo: a player's match is not
  const u = W.units.find(v => v.team === 1 && !v.dead), uf = W.units.find(v => v.team === 1 && !v.dead && v !== u);
  P.x = u.x + 600; P.z = u.z; u.inv = 0; C.ruin(u, 1e6, null);
  ok(W.kf.length === 1 && W.kf[0].v === u.name && !W.kf[0].k, 'an enemy ' + u.kind + ' lost 600 m from the player, nobody\'s credit: "✕ ' + u.name + '"');
  if (uf) { P.x = uf.x + KF.r + 200; P.z = uf.z; uf.inv = 0; C.ruin(uf, 1e6, null); ok(W.kf.length === 1, '  one ' + (KF.r + 200) + ' m away: not listed'); }
  const pal = C.addMan('blueRifle', 0, P.x + 10, P.z, 0), sq = C.addMan('blueRifle', 0, P.x + 20, P.z, 0), f2 = C.addMan('redRifle', 1, P.x + 40, P.z, 0);
  sq.psq = 1; C.killMan(f2, sq); ok(W.kf.length === 2 && W.kf[1].k === sq.name && W.kf[1].mine, 'a soldier of the player\'s squad (psq) kills one: listed as the player\'s own');
  const f3 = C.addMan('redRifle', 1, P.x + 50, P.z, 0); C.killMan(P, f3);
  const d = W.kf[W.kf.length - 1]; ok(d.v === 'Você' && d.vme && d.k === f3.name, 'the player killed: "' + d.k + ' ▸ Você"');
  for (let i = 0; i < 8; i++) { const x = C.addMan('redRifle', 1, P.x + 30, P.z, 0); C.killMan(x, pal); pal.psq = 1; }
  ok(W.kf.length === KF.n, 'never more than ' + KF.n + ' rows');
  const ff = C.addMan('blueRifle', 0, P.x + 5, P.z, 0); C.killMan(ff, sq); ok(W.kf[W.kf.length - 1].ff, 'a friend killed by a friend: marked (ff)');
  const t0 = W.t; W.t += KF.life + .1; const l1 = $('kfLive')(); W.t = t0 + KF.mine + .1; const l2 = $('kfLive')();
  ok(l1.length > 0 && l1.every(e => e.mine) && !l2.length, 'rows fade after ' + KF.life + ' s, the player\'s own after ' + KF.mine + ' s');
}

console.log('-- online: the server echoes down and aidown back to the sender --');
{
  const C = H.load({ seed: 7 }), $ = C.$, S = C.sandbox('modern'), B = S.base[0], Net = $('Net');
  const me = C.addMan('blueRifle', 0, B.x + 100, B.z + 50, 0); me.me = 1; S.my = me; S.net = true; S.host = true; Net.id = 1;
  Net.players.set(1, { id: 1, name: 'Ana', cls: 'inf', model: 'blueRifle', kills: 0, deaths: 0, ai: 0 });
  const foe = C.addMan('redRifle', 1, B.x + 140, B.z + 50, 0); foe.aid = -5; C.$('Net').send = () => {};
  C.killMan(foe, me);
  const f0 = S.feed.length; Net.rx.aidown({ id: -5, by: 1, model: 'redRifle', det: 0 });
  ok(S.kf.length === 1 && S.feed.length === f0, 'the host\'s kill, echoed back: one row, nothing said in the centre feed');
  const G = H.load({ seed: 8 }), $g = G.$, Sg = G.sandbox('modern'), Ng = $g('Net');
  const mine = G.addMan('blueRifle', 0, Sg.base[0].x + 100, Sg.base[0].z, 0); mine.me = 1; Sg.my = mine; Sg.net = true; Sg.host = false; Ng.id = 2;
  Ng.players.set(1, { id: 1, name: 'Ana', cls: 'inf', model: 'blueRifle', kills: 0, deaths: 0, ai: 0 }); Ng.players.set(2, { id: 2, name: 'Caio', cls: 'inf', model: 'blueRifle', kills: 0, deaths: 0, ai: 0 });
  const ana = G.addMan('blueRifle', 0, mine.x + 2000, mine.z, 0); Object.assign(ana, { net: true, pid: 1, name: 'Ana' }); Ng.ghosts.set(1, ana);
  const gh = G.addMan('redRifle', 1, ana.x + 120, ana.z, 0); Object.assign(gh, { net: true, aid: -9 }); Ng.ai.set(-9, gh);
  const g0 = Sg.feed.length; Ng.rx.aidown({ id: -9, by: 1, model: 'redRifle', det: 0 });
  const r = Sg.kf[0]; ok(Sg.kf.length === 1 && r.k === 'Ana' && r.v === gh.name && r.d === 120 && Sg.feed.length === g0, 'a guest sees another player\'s kill 2 km away in the kill feed (Ana ▸ ' + (r && r.v) + ' · ' + (r && r.d) + ' m), not in the centre feed');
  Ng.rx.down({ id: 1, by: -9, det: 0 }); ok(Sg.kf.length === 2 && Sg.kf[1].v === 'Ana', 'a player\'s death in the room: listed');
  Ng.rx.down({ id: 2, by: 0, det: 0, left: 1 }); ok(Sg.kf.length === 2 && /deixou o posto/.test(Sg.feed[Sg.feed.length - 1].text), 'an abandoned post: not a kill, still said in the centre feed');
}

console.log('-- the view: the rows on the HUD, the scoreboard on Tab --');
function view() {
  const texts = [], calls = { gen: [] }, els = {};
  const el = id => els[id] || (els[id] = { hidden: true, textContent: '', kids: [], append(e) { this.kids.push(e); } });
  const hx = { font: '', textAlign: '', fillStyle: '', globalAlpha: 1, measureText: s => ({ width: s.length * 7 }), fillRect() {}, fillText(s, x, y) { texts.push({ s, x, y, col: this.fillStyle }); } };
  const st = { S: { t: 10, me: 0, modern: true, kf: [], cq: null, net: false } }, ls = {};
  const ctx = vm.createContext({
    console, Math, hx, setTimeout, clearTimeout, performance: { now: () => Date.now() }, KF: { n: 5, life: 6, mine: 9 }, FRIEND: '#6fc3b2', FOE: '#e2604f', foeCol: () => '#e2604f',
    clamp: (v, a, b) => (v < a ? a : v > b ? b : v), kfLive: () => st.S.kf.filter(e => st.S.t - e.t < (e.mine ? 9 : 6)), kfName: () => 'Você',
    $: s => el(s.slice(1)), document: { createElement: () => ({ textContent: '', className: '', style: {} }) }, addEventListener: (k, f) => { ls[k] = f; },
    drawHud: () => {}, genOpen: (v, u) => calls.gen.push(v), GV: { on: false }, overShown: false, playMode: 'play', mmss: s => String(s), cqHeld: () => 0, DEFS: {}, Net: {}, pSide: () => 0,
    get S() { return st.S; }
  });
  vm.runInContext(html.slice(a, b) + '\n;globalThis.$$ = s => eval(s);', ctx, { filename: 'kf.js' });
  return { $: ctx.$$, ctx, texts, calls, els, st, ls };
}
{
  const V = view(), S = V.st.S;
  S.kf.push({ t: 9.5, k: 'Você', kme: true, kt: 0, v: 'Fuzileiro', vt: 1, w: 'M4A1', d: 84, mine: true }, { t: 9.8, k: 'T-90', kt: 1, v: 'M1A2', vt: 0, w: '', d: 0, ff: false });
  const y = V.$('kfDraw')(1266, 200, 1, 0, '#c4f1f7');
  const col = s => (V.texts.find(t => t.s === s && t.col !== 'rgba(8,12,13,.88)') || {}).col;
  ok(y > 200 + 2 * 15, 'two rows drawn, the column goes on under them (y ' + y + ')');
  ok(col('Você') === '#ffffff' && col('Fuzileiro') === '#e2604f' && col(' · M4A1') && col(' · 84 m'), 'the player in white, the enemy in the foe\'s colour, the weapon and the distance after');
  ok(col('T-90') === '#e2604f' && col('M1A2') === '#6fc3b2', 'an enemy tank killing a friendly one: each name in its side\'s colour');
  const right = Math.max(...V.texts.filter(t => t.col !== 'rgba(8,12,13,.88)').map(t => t.x + t.s.length * 7));
  ok(Math.abs(right - 1266) < 1e-6, 'right-aligned on the column\'s edge');
  S.t = 30; V.texts.length = 0; ok(V.$('kfDraw')(1266, 200, 1, 0, '#c4f1f7') === 200 && !V.texts.length, 'once their time is up: nothing drawn, the column does not move');
}
(async () => {
  const V = view(), SB = V.$('SB'), key = (up, rep) => (up ? V.ls.keyup({ code: 'Tab', preventDefault() {} }) : V.$('sbKey')({ code: 'Tab', repeat: !!rep }, false));
  SB.hold = .05;
  key(false); await new Promise(r => setTimeout(r, 10)); key(true);
  ok(V.calls.gen.length === 1 && V.calls.gen[0] === true && !SB.on, 'Tab tapped: the general\'s view opens on its release, no scoreboard');
  key(false); await new Promise(r => setTimeout(r, 90)); key(false, true);
  ok(SB.on && V.els.board.hidden === false && V.calls.gen.length === 1, 'Tab held past ' + SB.hold + ' s: the scoreboard shows, the view does not open');
  key(true); ok(!SB.on && V.els.board.hidden === true && V.calls.gen.length === 1, 'released: the scoreboard goes, still no view');
  key(false); V.ls.blur(); await new Promise(r => setTimeout(r, 90)); ok(!SB.on, 'the window loses the focus with Tab down: no scoreboard stuck on');
  done();
})();
