'use strict';
/* Civilians online, headless, through the real relay server: a host soldier (side 0), a guest of side 0 and a guest of side 1. The host's civilians
   reach both guests as copies; a guest's round kills one on the host and everyone sees it; a guest recruits one by the host (the militiaman is the
   host's AI soldier, marked on the other guests too); a burst on the host kills the copies; the laws of war (W14): the host charges the side whose
   fire it was and tells the guests (civ k 2), a town that turned against a side is known to the guests and recruits nobody for it; the next host
   after the first leaves runs them.
   With SERVER=<an older server.js> welcome has no civ: the host fields none and nobody is offered a recruit */
const N = require('./net'), H = require('./harness'), { ok, done } = H;
const all = [], dt = 1 / 60;
async function client(name, cls, model) {
  const c = H.load({ WebSocket: N.WebSocket, host: 'localhost:' + N.PORT, seed: name.length * 97 + name.charCodeAt(0) }), $ = c.$, Net = $('Net');
  c.name = name; c.$ = $; c.Net = Net; c.on = true;
  await new Promise((res, rej) => { Net.ui.welcome = () => { c.newState('modern', model, { net: true, cls, mouse: true, host: Net.host === Net.id }); res(); }; Net.ui.refused = code => rej(new Error(name + ' refused: ' + code)); Net.connect('modern', name, cls, model); });
  Object.defineProperty(c, 'S', { get: () => $('S') }); c.id = Net.id; c.plan = () => {}; c.director = () => {};
  all.push(c); return c;
}
async function run(secs, each) {
  for (let i = 0, n = Math.round(secs / dt); i < n; i++) {
    for (const c of all) if (c.on) { c.step(dt); c.Net.tick(dt); }
    if (each && each() === false) return false;
    if (i % 2 === 0) await new Promise(r => setImmediate(r));
    if (i % 20 === 0) await N.sleep(1);
  }
  await N.sleep(30); return true;
}
const put = (c, x, z, h) => { const P = c.S.my; P.x = x; P.z = z; P.y = c.$('manY')(x, z); if (h !== undefined) { P.h = h; if (c.S.aim) c.S.aim.h = h; } P.inv = 1e9; };

(async () => {
  await N.start(); console.log('server: ' + N.SERVER + '\npage:   ' + H.PAGE);
  const h = await client('Hugo', 'inf', 'blueRifle'), a = await client('Ana', 'inf', 'blueSaw'), c = await client('Caio', 'inf', 'redRifle');
  const CIV = h.$('CIV'), B = h.S.base[0];
  put(h, B.x, B.z + 40); put(a, B.x + 30, B.z + 40); put(c, B.x + 60, B.z + 40);
  await run(2);
  if (!h.Net.civ) {
    ok(!a.Net.civ && !c.Net.civ && h.S.host, 'this server does not know civilians: welcome has no civ');
    ok(h.S.civs.length === 0 && a.S.civs.length === 0 && c.S.civs.length === 0, 'and the host fields none: it plays as before');
    await run(3); ok(h.S.civs.length === 0 && !a.S.civU, 'and nobody is offered a recruit');
    for (const x of all) x.Net.close(); N.stop(); return done();
  }
  ok(h.Net.civ && a.Net.civ && c.Net.civ && h.S.host && !a.S.host, 'welcome says civ; Hugo hosts');
  await run(3);
  const nh = h.S.civs.length, na = a.S.civs.length, nc = c.S.civs.length;
  console.log('   civilians: host ' + nh + ', guests ' + na + ' and ' + nc);
  ok(nh > 10 && na === nh && nc === nh, 'the host\'s civilians are on both guests, the same number');
  const near = (x, z, S) => S.civs.filter(o => Math.hypot(o.x - x, o.z - z) < 4).length;
  ok(h.S.civs.filter(o => !o.in).every(o => near(o.x, o.z, a.S) > 0), 'each at about the same place (' + h.S.civs.filter(o => !o.in).length + ' outdoors on the host)');
  ok(a.S.civs.every(o => o.net) && h.S.civs.every(o => !o.net), 'copies are ghosts on the guests, live on the host');
  await run(8);
  const moved = a.S.civs.filter(o => Math.hypot(o.x - o.snap.x, o.z - o.snap.z) < 6).length;
  ok(moved === na, 'and they keep up with the host\'s as these move (' + moved + ' of ' + na + ')');
  /* a guest's round */
  const vc = h.S.civs.find(o => !o.in && !o.dead), va = a.S.civs.find(o => o.id === vc.id);
  put(a, va.x - 30, va.z); const A = a.S.my;
  for (let i = 0; i < 30 && !vc.dead; i++) { const e = a.$('manEye')(A); a.S.bullets.push({ x: va.x - 3, y: va.y + 1.1, z: va.z, vx: 900, vy: 0, vz: 0, life: 1.3, team: 0, dmg: 8, ap: 0, sa: 1, by: A, tr: 0 }); await run(.15); }
  await run(1);
  const vcc = c.S.civs.find(o => o.id === vc.id);
  ok(vc.dead && va.dead && vcc && vcc.dead, 'Ana\'s rounds kill a civilian on the host and on both guests');
  /* a burst on the host */
  const w = h.S.civs.find(o => !o.in && !o.dead && o !== vc);
  h.$('explode')(w.x + 2, w.y, w.z, 12, 90, h.S.my, 0, false); await run(1.5);
  ok(w.dead && a.S.civs.find(o => o.id === w.id).dead, 'a burst of the host\'s kills one and the guests see it');
  /* the laws of war online */
  await run(CIV.say + 1);
  ok(h.S.civD && h.S.civD.n[0] === 2 && !h.S.civD.n[1], 'the host counts side 0 its two (Ana\'s rounds, its own burst)');
  ok([a, c].every(x => x.S.feed.some(f => /civil morto|civis mortos/.test(f.text))), 'both guests are told in the feed (' + ((c.S.feed.find(f => /civ/.test(f.text)) || {}).text) + ')');
  /* recruit by a guest */
  const r = h.S.civs.find(o => !o.in && !o.dead && o.mode < 3), ra = a.S.civs.find(o => o.id === r.id); r.think = 1e9; r.mode = 0; r.goal = null; r.wT = 1e9;   // it stands where it is
  put(a, ra.x + 1.2, ra.z, 0); await run(.6);
  ok(a.S.civU && a.S.civU.id === r.id && !a.S.civW, 'Ana beside a civilian is offered the recruit');
  a.S.input.recruit = true; await run(CIV.hold + .8, () => { const o = a.S.civU; if (o) put(a, o.x + 1.2, o.z); }); a.S.input.recruit = false; await run(1.5);
  const mh = h.S.men.find(m => m.mil);
  ok(mh && mh.team === 0 && mh.own === a.id && mh.aid < 0 && r.gone, 'held for ' + CIV.hold + ' s: the host makes it a militiaman of Ana\'s side, hers, an AI soldier of the host');
  await run(2);
  await run(1.5);
  const ga = a.Net.ai.get(mh.aid), gc = c.Net.ai.get(mh.aid);
  ok(ga && gc && ga.mil && gc.mil && ga.own === a.id && ga.cc.join() === CIV.pal[mh.pi].join(), 'both guests see it, marked as militia in civilian clothes, Ana\'s');
  ok(!a.S.civs.some(o => o.id === r.id) && !c.S.civs.some(o => o.id === r.id), 'and the civilian it was is gone from both');
  put(a, mh.x + 40, mh.z); await run(12);
  ok(Math.hypot(mh.x - a.S.my.x, mh.z - a.S.my.z) < 15, 'it follows Ana on the host');
  /* a town turns against side 1 */
  const tb = h.S.T.burgs.findIndex(b => h.S.civs.filter(o => !o.dead && !o.gone && !o.in && o.g && o.g.b === b).length >= 2);
  h.$('civTurn')(tb, 1); await run(1.5);
  ok(a.$('civHates')(tb, 1) && c.$('civHates')(tb, 1) && !c.$('civHates')(tb, 0), 'a town turns against side 1 on the host: both guests know it (civ k 2)');
  ok(c.S.feed.some(f => /se voltou contra/.test(f.text)), 'Caio is told: ' + ((c.S.feed.find(f => /se voltou contra/.test(f.text)) || {}).text));
  const tv = h.S.civs.find(o => !o.dead && !o.gone && !o.in && o.g && o.g.b === h.S.T.burgs[tb]); tv.think = 1e9; tv.mode = 0; tv.goal = null; tv.wT = 1e9;
  await run(.5); const tc = c.S.civs.find(o => o.id === tv.id);
  put(c, tc.x + 1.2, tc.z, 0); await run(.6);
  ok(c.S.civU && c.S.civU.id === tv.id && c.S.civO, 'Caio beside one of its people is told it turned against his side');
  const ml = h.S.men.filter(m => m.mil && m.team === 1).length;
  c.S.input.recruit = true; await run(CIV.hold + .8, () => { put(c, tc.x + 1.2, tc.z); }); c.S.input.recruit = false; await run(1.5);
  ok(!tv.gone && h.S.men.filter(m => m.mil && m.team === 1).length === ml, 'and the host recruits nobody for him');
  /* the host leaves */
  const live = h.S.civs.filter(o => !o.dead).length;
  h.on = false; h.Net.close(); await run(1.5);
  ok(a.S.host && a.S.civs.every(o => !o.net), 'the next host (Ana) runs the civilians');
  const p0 = a.S.civs.filter(o => !o.dead).map(o => [o.x, o.z]); await run(12);
  const mv = a.S.civs.filter(o => !o.dead).filter((o, i) => p0[i] && Math.hypot(o.x - p0[i][0], o.z - p0[i][1]) > 3).length;
  ok(a.S.civs.filter(o => !o.dead).length > live * .6 && mv > 5, 'and they carry on where they were (' + a.S.civs.filter(o => !o.dead).length + ' of ' + live + ' alive, ' + mv + ' moved)');
  for (const x of all) x.Net.close(); N.stop(); done();
})().catch(e => { console.error(e); N.stop(); process.exit(1); });
