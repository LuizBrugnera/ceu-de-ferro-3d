'use strict';
/* Posts, the anti-rocket dome and the rocket launchers: the kinds of work and where each may stand (the dome only in its era, the cost
   paid from the economy), the garrison a finished post gets (even at the population cap), the crew-served weapon handed to who mans it
   and back, the player first, the tower that lifts a soldier, an AI gunner at work, the dome against a salvo (what it stops, its
   magazine, the metal it costs, nothing engaged by a guest on its own, the shooter shown), and each launcher's salvo and reload */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 31 }), $ = C.$, POSTS = $('POSTS'), FORT = $('FORT'), ARTS = $('ARTS'), ERAS = $('ERAS'), SARMS = $('SARMS'), IAI = $('IAI'), MAN = $('MAN'), STANCE = $('STANCE');
const hd = $('hdist');
let S, T;
const fresh = (era, c) => { c = c || C; S = c.sandbox(era || 'ww2'); T = S.T; for (const f of S.forts.slice()) c.fortDrop(f); S.forts = []; return S; };
function flat(n, c) {
  c = c || C; let k = 0;
  for (let z = -S.HW + 900; z < S.HW - 900; z += 173) for (let x = 2500; x < S.W - 2500; x += 211) {
    const h = c.hgt(x, z); let lv = h > T.WL + 6 && c.routeDist(T, x, z) > 150;
    for (const [a, b] of [[60, 0], [-60, 0], [0, 60], [0, -60], [140, 0], [-140, 0]]) if (Math.abs(c.hgt(x + a, z + b) - h) > 2.5) lv = false;
    if (lv && !c.near(x, z, 160).length && k++ === (n || 0)) return { x, z };
  }
  throw new Error('no flat ground');
}
/* a solo conquest with the economy on, emptied as the sandbox is */
const ecoState = (c, era) => { const s = c.newState(era, c.$('ERAS')[era].sides[0].fighter, { cls: 'plane' }); s.demo = false; s.over = true; s.units = []; s.planes = []; s.men = []; s.squads = []; for (const f of s.forts.slice()) c.fortDrop(f); s.forts = []; return s; };
const build = (k, t, x, z, a, c) => { c = c || C; const f = c.fortStart(k, t, x, z, a || 0); if (f) c.fortAt(f, 1); return f; };

console.log('-- the kinds and where they may stand --');
fresh('ww2');
{
  const p = flat();
  ok([3, 4, 5, 6].every(k => FORT.K[k] && FORT.K[k].k === k) && FORT.K.length === 7, 'four more kinds of work: ' + [3, 4, 5, 6].map(k => FORT.K[k].name).join(', '));
  ok(C.fortWhy(6, 0, p.x, p.z, 0) === 'era' && C.fortWhy(3, 0, p.x, p.z, 0) === '', 'the anti-rocket dome only in the modern era; the anti-tank post in both');
  for (const k of [3, 4, 5]) for (let i = 0; i < FORT.K[k].cap; i++) build(k, 0, p.x + 30 * i, p.z + 40 * k);
  ok([3, 4, 5].every(k => C.fortWhy(k, 0, p.x - 60, p.z + 40 * k, 0) === 'bcap'), 'a side has at most ' + [3, 4, 5].map(k => FORT.K[k].cap).join(', ') + ' of them');
}
{
  const E = H.load({ seed: 5, eco: true }); S = ecoState(E, 'modern'); T = S.T;
  const p = flat(0, E), d = S.eco && S.eco.d[0];
  if (d) {
    d.en = 250; d.mt = 500; const why = E.fortWhy(6, 0, p.x, p.z, 0); d.en = 400; d.mt = 450;
    const f = E.fortStart(6, 0, p.x, p.z, 0);
    ok(why === 'cost' && f && Math.round(d.en) === 100 && Math.round(d.mt) === 50, 'with the economy on the dome costs ' + POSTS.dome.cost.join(' energy and ') + ' metal, paid when it starts; short of it, it cannot start');
  } else ok(false, 'the economy is on in this test');
  S = null;
}

console.log('-- the garrison and the weapon --');
for (const era of ['ww2', 'modern']) {
  fresh(era); const p = flat(1);
  for (let i = S.men.length; i < IAI.cap; i++) { const m = C.addMan($('INF')[era][1][0], 1, p.x + 5000 + i, p.z - 3000, 0); m.ai = null; }
  const at = build(3, 0, p.x, p.z, 0), mg = build(4, 0, p.x, p.z + 60, 0), tw = build(5, 0, p.x, p.z + 120, 0), sq = [at, mg, tw].map(f => f.garr);
  ok(sq.every(q => q && q.job === 'fpost' && q.wpost) && sq[0].men.length === 2 && sq[1].men.length === 2 && sq[2].men.length === 1 && sq[2].men[0].def.snp, era + ': at the population cap (' + IAI.cap + ') each finished post still gets its garrison: two soldiers at a gun, a sniper at the tower');
  C.run(25);
  const g = [at, mg].map(f => f.gm), gun = f => SARMS[f.F.gun[era][0]];
  console.log('   ' + era + ': ' + [at, mg].map(f => f.F.name + ': ' + (f.gm ? f.gm.def.name + ' with ' + f.gm.arms.map(a => a.d.name).join(' + ') : 'nobody')).join('; ') + '; tower: ' + (tw.garr.men[0].tw ? 'the sniper is up, eye ' + ($('eyeY')(tw.garr.men[0]) - C.hgt(tw.x, tw.z)).toFixed(1) + ' m over the ground' : 'nobody up'));
  ok(g[0] && g[0].arms[1].d === gun(at) && g[1] && g[1].arms[0].d === gun(mg) && sq.every(q => q.men.every(m => hd(m, q.wpost) < 8)), era + ': the garrison holds its post; one of them fires the ' + gun(at).name + ' (special) and one the ' + gun(mg).name + ' (in place of his rifle)');
  const s = tw.garr.men[0];
  ok(s.tw === tw && $('eyeY')(s) - C.hgt(tw.x, tw.z) > POSTS.twr.eye, era + ': the sniper stands on the tower, his eye over ' + POSTS.twr.eye + ' m up');
  const m = g[0], had = m.pa.a; m.x += 25; C.run(.3);
  ok(m.pa === null && m.arms[1] === had && at.gm !== m, era + ': a gunner who steps out of the post has his own weapon back');
  const P = C.addMan($('INF')[era][0][0], 0, mg.x - Math.cos(mg.a) * (mg.o.hd + .7), mg.z, 0); P.ai = null; S.my = P; P.me = true; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } }; S.input = {}; const was = mg.gm; C.run(.3);
  ok(mg.gm === P && P.arms[0].d === gun(mg) && was && was.arms[0].d !== gun(mg), era + ': the player who steps into a manned post takes the gun over, and the soldier there has his rifle back');
  const rounds = mg.ga.mag + mg.ga.res; P.x -= 30; C.run(.3); P.x += 30; C.run(.3);
  ok(mg.gm === P && mg.ga.mag + mg.ga.res === rounds, era + ': the gun keeps its own rounds: stepping out and back in does not fill it');
  S.my = null; P.x -= 30; C.run(.3); const ai = mg.gm;
  const R = C.addMan($('INF')[era][0][0], 0, P.x + 30, P.z, 0); R.ai = null; R.net = true; R.pid = 9; R.v = { x: 0, y: 0, z: 0 }; R.snap = { x: R.x, z: R.z, h: 0, ap: 0, age: 0 }; C.run(.3);
  ok(ai && !ai.pid && mg.gm === R && R.arms[0].d === gun(mg) && ai.arms[0].d !== gun(mg), era + ': another client\'s player (a ghost here) who steps in takes the gun from the AI soldier, as he does on his own client');
  P.x += 30; S.my = P; C.run(.3);
  ok(mg.gm === R && P.arms[0].d !== gun(mg), era + ': and keeps it when this client\'s player steps in after him');
  S.my = null; P.x -= 30; R.x = R.snap.x += 30; C.run(.3);
  const t0 = tw.garr.men[0]; t0.x = tw.x + 30; C.run(.3); const down = !t0.tw && Math.abs(t0.y - $('manY')(t0.x, t0.z)) < .01;
  t0.x = tw.x + tw.o.hw + 1.5; t0.z = tw.z; C.run(.3);
  ok(down && t0.tw === tw && Math.abs(t0.x - tw.x) <= tw.o.hw, era + ': stepped off the platform he is on the ground; from beside the tower he climbs back onto it');
}

console.log('-- an AI gunner at work --');
fresh('modern');
{
  const p = flat(2), E = S.E.sides, at = build(3, 0, p.x, p.z, 0); C.run(20);
  const g = at.gm, ey = g ? $('eyeY')(g) : 0, clear = (x, z) => { const b = C.hgt(x, z) + 2.5; for (let i = 1; i < 60; i++) { const k = i / 60; if (C.hgt(g.x + (x - g.x) * k, g.z + (z - g.z) * k) > ey + (b - ey) * k - .5) return false; } return true; };
  let q = null; for (const d of [1200, 1100, 1000, 1300, 900]) for (let a = -1; a <= 1 && !q; a += .1) { const x = g.x + Math.cos(a) * d, z = g.z - Math.sin(a) * d; if (clear(x, z) && x < S.W - 100 && Math.abs(z) < S.HW - 100 && C.hgt(x, z) > T.WL + 2) q = { x, z, d }; }
  const u = C.addUnit('tank', 1, q.x, q.z, E[1].tanks[1], true); u.ai = null; const hp0 = u.hp; let shots = 0;
  const n0 = g ? g.arms[1].mag + g.arms[1].res : 0;
  C.run(120, () => { if (u.dead) return false; });
  shots = g ? n0 - (g.arms[1].mag + g.arms[1].res) : 0;
  console.log('   a ' + u.def.name + ' ' + q.d + ' m off the anti-tank post, in the open: ' + shots + ' TOW-2 fired, hp ' + Math.round(hp0) + ' to ' + Math.max(0, Math.round(u.hp)) + (u.dead ? ', destroyed' : ''));
  ok(g && shots >= 1 && (u.dead || u.hp < hp0), 'the post\'s gunner takes a tank ' + q.d + ' m off with the guided missile');
}

console.log('-- the dome --');
function salvo(c, S, p, n) {
  const u = c.addUnit('art', 1, p.x + 6000, p.z, S.E.sides[1].mlrs, true); u.ai = null;
  const L = [];
  for (let i = 0; i < n; i++) { const R = Math.round, vx = R((-6000 / 52 + (i % 7) * .3 - 1) * 10) / 10, vz = R((i % 5 - 2) * 3) / 10; L.push(c.lob(u, u.arms[0].d, R(u.x * 10) / 10, R((u.y + 4) * 10) / 10, R(u.z * 10) / 10, vx, 255, vz)); }
  return { u, L };
}
{
  fresh('modern'); const p = flat(3), D = build(6, 0, p.x, p.z, 0), { u, L } = salvo(C, S, p, 40), seen0 = u.seenT;
  C.run(60);
  const fell = L.filter(b => b.px !== undefined && Math.hypot(b.px - p.x, b.pz - p.z) < POSTS.dome.r).length;
  console.log('   a salvo of ' + L.length + ' rockets at a dome (' + fell + ' come down within ' + POSTS.dome.r + ' m): it fired ' + D.ds + ' interceptors and stopped ' + D.dk + '; magazine ' + POSTS.dome.mag + ', ' + D.dm + ' left');
  ok(D.dk >= 10 && D.dk < fell && D.ds <= POSTS.dome.mag + 12, 'the dome stops part of the salvo: its magazine of ' + POSTS.dome.mag + ' and its rate are overwhelmed by ' + L.length + ' rockets');
  ok(u.seenT > seen0, 'its radar shows its side the launcher that fired');
  const own = salvo(C, S, p, 1).L[0]; own.team = 0; C.run(60); ok(!own.dj, 'it lets its own side\'s rounds through');
}
{
  fresh('modern'); const p = flat(3), D = build(6, 0, p.x, p.z, 0);
  /* across the flat ground round the dome, so the seeker has the tank from launch (from 700 m out the rise hid it, and it was a draw whether
     the seeker found it again before the dome could see a target) */
  const tk = C.addUnit('tank', 0, p.x - 40, p.z, S.E.sides[0].tanks[1], true); tk.ai = null;
  const at = C.addMan($('INF').modern[1][0], 1, p.x + 140, p.z, 0); at.ai = null; const atSeen = at.seenT, e = $('manEye')(at);
  const ms = $('MSHOT').atgm(at, SARMS.kornet, e, $('vnorm')({ x: tk.x - e.x, y: 0, z: tk.z - e.z }), tk); C.run(1);
  ok(ms.dj && at.seenT > atSeen, 'a guided missile fired at its side within its radius is engaged, and its radar shows who fired it too');
}
{
  const E = H.load({ seed: 6, eco: true }), S3 = ecoState(E, 'modern'); S = S3; T = S3.T;
  const p = flat(3, E), d = S3.eco.d[0]; d.en = 1000; d.mt = 1000; const D = build(6, 0, p.x, p.z, 0, E); d.mt = POSTS.dome.mt * 3 + 5;
  const r = salvo(E, S3, p, 10); E.run(60);
  ok(D.ds === 3 && d.mt < POSTS.dome.mt, 'every interceptor costs ' + POSTS.dome.mt + ' metal; with none left the dome is silent (' + D.ds + ' shots at 10 rounds with metal for 3)');
  const G = H.load({ seed: 7, eco: true }), S4 = ecoState(G, 'modern'); S = S4; T = S4.T;
  const p4 = flat(3, G), d4 = S4.eco.d[0], D4 = build(6, 0, p4.x, p4.z, 0, G); S4.net = true; S4.host = false; d4.mt = 1000;
  const g4 = salvo(G, S4, p4, 10); G.run(60);
  ok(!D4.ds && d4.mt === 1000 && g4.L.every(b => !b.dj), 'on a guest the dome engages nothing of its own, whatever its side\'s metal: the host alone decides (dint)');
}

console.log('-- the rocket launchers --');
for (const era of ['ww2', 'modern']) for (let side = 0; side < 2; side++) {
  fresh(era); const id = ERAS[era].sides[side].mlrs, A = ARTS[id], w = A.arms[0];
  const u = C.addUnit('art', side, 9000, 0, id, true); u.ai = null; u.arms[0].ammo = w.sal * 2; u.ctl.fire[0] = true; u.ctl.ch = 5; u.tp = .7; $('gunDir')(u);
  const t = []; let n0 = 0;
  C.run(w.rl + w.sal * w.rip + 5, () => { if (u.arms[0].n !== n0) { n0 = u.arms[0].n; t.push(S.t); } });
  const first = t.slice(0, w.sal), gap = t[w.sal] - t[w.sal - 1];
  console.log('   ' + era + ' ' + A.name + ': ' + w.name + ', ' + w.sal + ' rockets in ' + (first[first.length - 1] - first[0]).toFixed(1) + ' s, the next salvo ' + gap.toFixed(1) + ' s later, range ' + (w.range / 1000).toFixed(1) + ' km');
  ok(A.era === era && A.side === side && first.length === w.sal && Math.abs(first[1] - first[0] - w.rip) < .05 && Math.abs(gap - w.rl) < 1, era + ' ' + A.name + ': a salvo of ' + w.sal + ' rockets ' + w.rip + ' s apart, then ' + w.rl + ' s to load the tubes');
}
{
  fresh('modern'); const id = 'bm21', w = ARTS[id].arms[0], u = C.addUnit('art', 1, 9000, 0, id, true); u.ai = null; u.ctl.fire[0] = true; u.ctl.ch = 5; u.tp = .7; $('gunDir')(u);
  const tr = C.addUnit('truck', 1, 9015, 5, null, true); tr.kind = 'truck';
  const t = []; let n0 = 0; C.run(w.rl + w.sal * w.rip + 5, () => { if (u.arms[0].n !== n0) { n0 = u.arms[0].n; t.push(S.t); } });
  const gap = t[w.sal] - t[w.sal - 1];
  ok(gap < w.rl * .8, 'with a truck of its side beside it the ' + ARTS[id].name + ' loads its tubes faster (' + gap.toFixed(1) + ' s instead of ' + w.rl + ')');
}
H.done();
