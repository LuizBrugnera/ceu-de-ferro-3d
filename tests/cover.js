'use strict';
/* Rocks, bushes and trees (COVERS, TREES: map version 6): where they stand and that every client builds the same ones under the same ids, with map 5
   left as it was; a line of sight past a rock and through a bush, the same for a player's eyes and the AI's (sees, and the AI's meter);
   who is in a bush is made out closer, from the ground and from an aircraft, and sees out; rounds stop at a rock and go through a bush;
   a hull is stopped by a rock and crushes a bush; the AI soldier picks the side of a rock away from the enemy, or a bush; the trees,
   some bigger and some broadleaves, and a wood that hides who is deep in it from the ground and who is under its canopy from the air */
const H = require('./harness'), { ok, done } = H, C = H.load({ mapv: 6 }), $ = C.$;
console.log('page: ' + H.PAGE);
if (!$('typeof COVERS !== "undefined"')) { console.log('no COVERS table: a page before map version 6'); process.exit(0); }
{   /* the whole page script compiles, the scene too (which the harness leaves out): a name declared twice there only shows in a browser */
  const html = require('fs').readFileSync(H.PAGE, 'utf8'), i = html.indexOf("<script>\n'use strict';"), j = html.indexOf('</script>', i);
  let err = null; try { new (require('vm').Script)(html.slice(i + 8, j)); } catch (e) { err = e; }
  ok(i > 0 && !err, 'the page script compiles' + (err ? ': ' + err.message : ''));
}
const COVERS = $('COVERS'), COVER = $('COVER'), MAN = $('MAN'), NDYN = $('NDYN'), NECO = $('NECO');
let S, T;
const fresh = era => { C.seed(7); S = C.sandbox(era); T = S.T; return S; };
const covers = T => T.objs.filter(o => o.k === 'rock' || o.k === 'bush');
const hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const flat = (x, z, r) => Math.abs(C.hgt(x + r, z) - C.hgt(x - r, z)) < r * .12 && Math.abs(C.hgt(x, z + r) - C.hgt(x, z - r)) < r * .12;
/* a soldier: AI (with a brain) or a player's (without one) */
const man = (team, x, z, st, ai) => { const m = C.addMan($('INF')[S.era][team][0], team, x, z, 0); m.st = st || 0; m.ai = ai ? $('manBrain')(0) : null; if (m.ai) { m.ai.gx = x; m.ai.gz = z; } m.cv = null; m.y = $('manY')(x, z); return m; };
const look = (a, t) => { a.f = { x: (t.x - a.x) / hd(a, t), y: 0, z: (t.z - a.z) / hd(a, t) }; a.h = Math.atan2(-a.f.z, a.f.x); };
/* seconds until the AI a knows t, the clock stepped by hand, or Infinity */
function tk(a, t, max) { a.pm = null; t.kn = null;   // what it knows of its own, not what its side was told
  const t0 = S.t; for (; S.t - t0 < (max || 20);) { S.t += .25; look(a, t); if ($('notice')(a, t)) return S.t - t0; } return Infinity; }
const f1 = v => (Number.isFinite(v) ? v.toFixed(1) + ' s' : 'never');
/* a cover object of kind k at least h m high on level ground with nothing else standing within r m, and a direction from which the
   ground lets a soldier at dist m see the place behind it: { o, ux, uz } with (ux, uz) the way from the viewer to the object */
function pick(k, h, dist) {
  for (const o of covers(T)) {
    if (o.k !== k || o.h < h || !flat(o.x, o.z, 12)) continue;
    for (let i = 0; i < 16; i++) {
      const a = i * Math.PI / 8, ux = Math.cos(a), uz = Math.sin(a), vx = o.x - ux * dist, vz = o.z - uz * dist;
      if (!flat(vx, vz, 8) || C.hgt(vx, vz) < T.WL + 2) continue;
      let clear = true;   // nothing but the ground and this object on the way, beside it too, and nothing else where the target will lie
      for (const s of [0, 9, -9]) {
        const ax = vx - uz * s, az = vz + ux * s, bx = o.x - uz * s + ux * (o.rd + 1), bz = o.z + ux * s + uz * (o.rd + 1);
        if (C.near(bx, bz, 5).some(n => n !== o)) clear = false;
        for (const y of [.4, 1.2]) for (const md of [0, 1]) { const q = $('ray')(ax, C.hgt(ax, az) + 2.7, az, bx, C.hgt(bx, bz) + y, bz, md); if (q && q !== o) clear = false; }
        if (s && !$('los')({ x: ax, z: az }, C.hgt(ax, az) + 2.7, { x: bx, z: bz }, C.hgt(bx, bz) + .4)) clear = false;
      }
      if (clear) return { o, ux, uz, vx, vz };
    }
  }
  return null;
}

console.log('-- where they stand, and the same on every client --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const cl = covers(T), rocks = cl.filter(o => o.k === 'rock'), bushes = cl.filter(o => o.k === 'bush');
  let bad = 0, nearRoad = 0;
  for (const o of cl) {
    const k = T.kind[$('nodeAt')(T, o.x, o.z)], rd = C.routeDist(T, o.x, o.z);
    if (k === 1 || k === 8 || k === 9 || rd <= COVERS.road || $('hgtT')(T, o.x, o.z) < T.WL + COVERS.wet || !$('cityFar')(T, o.x, o.z) || Math.min(hd(o, T.bases[0]), hd(o, T.bases[1])) < COVERS.base) bad++;
    if (rd < 400) nearRoad++;
  }
  console.log('   ' + era + ': ' + rocks.length + ' rocks and ' + bushes.length + ' bushes, ' + nearRoad + ' of them within 400 m of a road; ids ' + T.cv0 + ' to ' + (T.nid - 1) + ', the dynamic ones up to ' + (T.nid + NDYN + NECO - 1));
  ok(rocks.length > 800 && bushes.length > 1200 && cl.length <= COVERS.max && nearRoad > cl.length / 2, era + ': rocks and bushes all over, most of them by the roads');
  ok(T.nid + NDYN + NECO < 65536 && cl.every((o, i) => o.id === T.cv0 + i && T.byId[o.id] === o), era + ': their ids run on from the buildings\', every dynamic id under the 65536 the server lets through');
  ok(!bad, era + ': none on a road or within ' + COVERS.road + ' m of one, in a dense wood, on an airfield, in the water or in a town');
  const C2 = H.load({ mapv: 6, seed: 99 }), T2 = C2.sandbox(era).T, c2 = covers(T2);
  ok(c2.length === cl.length && c2.every((o, i) => o.id === cl[i].id && o.k === cl[i].k && o.x === cl[i].x && o.z === cl[i].z && o.rd === cl[i].rd && o.h === cl[i].h), era + ': another client builds the same rocks and bushes under the same ids');
  const C5 = H.load({ mapv: 5 }), S5 = C5.sandbox(era), T5 = S5.T;
  ok(!covers(T5).length && T5.nid === T.cv0 && T5.objs.every(o => { const q = T.byId[o.id]; return q && q.k === o.k && q.x === o.x && q.z === o.z; }) && S5.forts.length === S.forts.length, era + ': map 5 is as it was (no rock, no bush, the same ids), and map 6 keeps it whole under them, with the same works dug at the start');
}

console.log('-- a rock: a wall for the eyes and for the rounds --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const P = pick('rock', 1.6, 120); if (!ok(!!P, era + ': a tall rock on level ground with a clear approach')) continue;
  const { o, ux, uz, vx, vz } = P, bx = o.x + ux * (o.rd + .9), bz = o.z + uz * (o.rd + .9);
  const ai = man(1, vx, vz, 0, true), me = man(1, vx + uz * 2, vz - ux * 2, 0, false), t = man(0, bx, bz, 1), sees = $('sees');
  look(ai, t); look(me, t);
  const hidAi = !sees(ai, t), hidMe = !sees(me, t), know = tk(ai, t, 20);
  t.st = 1; t.x = bx - uz * 8; t.z = bz + ux * 8; t.y = $('manY')(t.x, t.z); t.cv = null; const openAi = sees(ai, t), openMe = sees(me, t), knowOpen = tk(ai, t, 20);
  console.log('   ' + era + ': rock ' + o.h.toFixed(1) + ' m high, ' + o.rd.toFixed(1) + ' m round; a soldier crouched behind it at 120 m: the AI knows it in ' + f1(know) + ', 8 m aside in ' + f1(knowOpen));
  ok(hidAi && hidMe, era + ': crouched behind it, neither the AI nor the player\'s soldier sees it');
  ok(know === Infinity && knowOpen < Infinity, era + ': the AI never makes it out behind the rock, and does 8 m aside');
  ok(openAi && openMe, era + ': out beside it, both see it');
  /* rounds: level through the rock, beside it */
  let stopped = 0, beside = 0;
  for (let i = 0; i < 10; i++) {
    const off = (i - 4.5) * o.rd * .15, sx = o.x - ux * 40 - uz * off, sz = o.z - uz * 40 + ux * off, y = o.y + Math.min(.8, o.h * .5);
    S.bullets = [{ x: sx, y, z: sz, vx: ux * 800, vy: 0, vz: uz * 800, life: .2, team: 0, dmg: 9, ap: 0, by: null }]; const b = S.bullets[0];
    C.run(.2, () => !b.gone, .01); if (Math.hypot(b.x - o.x, b.z - o.z) < o.rd + 2) stopped++;
    S.bullets = [{ x: sx - uz * (o.rd + 3), y, z: sz + ux * (o.rd + 3), vx: ux * 800, vy: 0, vz: uz * 800, life: .2, team: 0, dmg: 9, ap: 0, by: null }]; const b2 = S.bullets[0];
    C.run(.12, () => !b2.gone, .01); if ((b2.x - o.x) * ux + (b2.z - o.z) * uz > 20) beside++;
  }
  ok(stopped === 10 && beside === 10, era + ': ' + stopped + ' of 10 rounds into the rock stop at it, ' + beside + ' of 10 beside it fly on');
  ok(S.os[o.id] === 0, era + ': rounds do not wear a rock down');
}

console.log('-- a bush: it hides, it does not stop --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const P = pick('bush', 1.3, 120); if (!ok(!!P, era + ': a bush on level ground with a clear approach')) continue;
  const { o, ux, uz, vx, vz } = P, sees = $('sees'), hid = $('hid');
  const ai = man(1, vx, vz, 0, true), me = man(1, vx + uz * 2, vz - ux * 2, 0, false), t = man(0, o.x + ux * (o.rd + .8), o.z + uz * (o.rd + .8), 2);
  look(ai, t);
  const behind = [sees(ai, t), sees(me, t)], kb = tk(ai, t, 20);
  t.x = o.x + ux * (o.rd + .8) - uz * 9; t.z = o.z + uz * (o.rd + .8) + ux * 9; t.y = $('manY')(t.x, t.z); t.cv = null;
  const aside = [sees(ai, t), sees(me, t)], ka = tk(ai, t, 20);
  console.log('   ' + era + ': bush ' + o.h.toFixed(1) + ' m high, ' + o.rd.toFixed(1) + ' m round; a soldier prone just behind it at 120 m: the AI knows it in ' + f1(kb) + ', 9 m aside in ' + f1(ka));
  ok(!behind[0] && !behind[1] && kb === Infinity, era + ': prone behind the bush, neither the AI nor the player\'s soldier sees it, and the AI never makes it out');
  ok(aside[0] && aside[1] && ka < Infinity, era + ': 9 m aside both see it and the AI makes it out');
  /* in the bush: seen only close, from the ground and from the air, and it sees out */
  t.x = o.x; t.z = o.z; t.y = $('manY')(t.x, t.z); t.cv = null;
  const vin = $('visR')(t); t.x = o.x - uz * 9; t.z = o.z + ux * 9; t.cv = null; const vout = $('visR')(t); t.x = o.x; t.z = o.z; t.cv = null;
  ok(Math.abs(vin - vout * (1 - COVER.bush[0])) < 1e-6, era + ': prone in it, made out at ' + vin.toFixed(0) + ' m, against ' + vout.toFixed(0) + ' m in the open');
  const at = (a, d) => { a.x = o.x - ux * d; a.z = o.z - uz * d; a.y = $('manY')(a.x, a.z); look(a, t); };
  at(ai, (vin + vout) / 2); at(me, (vin + vout) / 2);
  const mid = [sees(ai, t), sees(me, t)], km = tk(ai, t, 20);
  at(ai, vin * .6); at(me, vin * .6);
  const close = [sees(ai, t), sees(me, t)], kc = tk(ai, t, 30);
  ok(!mid[0] && !mid[1] && km === Infinity, era + ': at ' + ((vin + vout) / 2).toFixed(0) + ' m, where it would be seen in the open, neither sees it in the bush');
  ok(close[0] && close[1] && kc < Infinity, era + ': at ' + (vin * .6).toFixed(0) + ' m both see it, and the AI makes it out in ' + f1(kc));
  ok($('los')(t, $('eyeY')(t), ai, $('bodyY')(ai)), era + ': the one in the bush sees out of it');
  /* from the air: a pilot's eyes and an AI pilot's, by the same rule (MAN.air) */
  const pl = (ai) => { const p = C.addPlane(S.E.sides[1].fighter, 1, o.x - ux * 300, C.hgt(o.x, o.z) + 300, o.z - uz * 300, 0, !!ai); p.v = { x: 0, y: 0, z: 0 }; return p; };
  const pa = pl(true), pm = pl(false), d = hd(pa, t), sl = Math.hypot(d, pa.y - t.y);
  const inAir = [!hid(pa, t), !hid(pm, t)], kin = tk(pa, t, 30);
  t.x = o.x - uz * 9; t.z = o.z + ux * 9; t.y = $('manY')(t.x, t.z); t.cv = null;
  const outAir = [!hid(pa, t), !hid(pm, t)], kout = tk(pa, t, 30);
  console.log('   ' + era + ': from an aircraft ' + sl.toFixed(0) + ' m off, prone: made out to ' + (vin * MAN.air).toFixed(0) + ' m in the bush, ' + (vout * MAN.air).toFixed(0) + ' m in the open; the AI pilot knows it in ' + f1(kin) + ' in the bush, ' + f1(kout) + ' beside it');
  ok(!inAir[0] && !inAir[1] && kin === Infinity, era + ': in the bush, hidden from the pilot and from the AI pilot');
  ok(outAir[0] && outAir[1] && kout < kin, era + ': beside it, both pilots can make it out');
  /* rounds go through it */
  let through = 0;
  for (let i = 0; i < 10; i++) {
    const off = (i - 4.5) * o.rd * .15, sx = o.x - ux * 40 - uz * off, sz = o.z - uz * 40 + ux * off;
    S.bullets = [{ x: sx, y: o.y + .8, z: sz, vx: ux * 800, vy: 0, vz: uz * 800, life: .12, team: 0, dmg: 9, ap: 0, by: null }]; const b = S.bullets[0];
    C.run(.12, () => !b.gone, .01); if ((b.x - o.x) * ux + (b.z - o.z) * uz > 20) through++;
  }
  const cv = C.coverAt(o.x, o.z, {});
  ok(through === 10 && cv.p === 0 && cv.c === COVER.bush[0] && cv.all, era + ': ' + through + ' of 10 rounds through the bush fly on, and it gives concealment, no protection');
  /* a burst clears it, and then it hides nothing */
  t.x = o.x + ux * (o.rd + .8); t.z = o.z + uz * (o.rd + .8); t.y = $('manY')(t.x, t.z); t.cv = null; at(ai, 120); at(me, 120);
  C.explode(o.x, o.y + 1, o.z, 8, 60, null, 0);
  ok(S.os[o.id] === 2 && sees(me, t), era + ': a burst on it leaves nothing, and the one behind it is in sight');
}

console.log('-- hulls --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const P = pick('bush', 1.2, 60), R = pick('rock', 1.4, 60);
  if (!ok(P && R, era + ': a bush and a rock with room around them')) continue;
  const tank = Object.keys($('TANKS')).find(id => $('TANKS')[id].era === era);
  const drive = (q, kind, id) => { S.units = []; const u = C.addVehicle(kind, id, 0, q.o.x - q.ux * 40, q.o.z - q.uz * 40, Math.atan2(-q.uz, q.ux)); u.ctl.drive = 1; C.run(12, () => (u.x - q.o.x) * q.ux + (u.z - q.o.z) * q.uz < 25); return u; };
  const u = drive(P, 'tank', tank), past = (u.x - P.o.x) * P.ux + (u.z - P.o.z) * P.uz;
  ok(past >= 25 && S.os[P.o.id] === 2, era + ': a tank drives over a bush, crushing it (' + past.toFixed(0) + ' m past it)');
  const w = drive(R, 'truck', null), off = Math.abs((w.x - R.o.x) * -R.uz + (w.z - R.o.z) * R.ux), at = (w.x - R.o.x) * R.ux + (w.z - R.o.z) * R.uz;
  ok(S.os[R.o.id] === 0 && (at < 0 || off > R.o.rd), era + ': a truck driven at a rock does not go through it (' + (at < 0 ? 'stopped ' + (-at).toFixed(1) + ' m short of its middle' : 'pushed ' + off.toFixed(1) + ' m aside') + ')');
}

console.log('-- the AI uses them --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const P = pick('rock', 1.4, 150); if (!ok(!!P, era + ': a rock')) continue;
  const { o, ux, uz } = P, m = man(0, o.x - ux * 14, o.z - uz * 14, 1, true), e = man(1, o.x - ux * 150, o.z - uz * 150, 0, true);
  m.ai.i = 0; const sl = { x: m.x + uz * 5, z: m.z - ux * 5 }, c0 = $('coverSpot')(m, sl, e), cs = { x: c0.x - 2.5, z: c0.z }, back = ((o.x - cs.x) * (e.x - cs.x) + (o.z - cs.z) * (e.z - cs.z)) / hd(e, cs);   // less the spread that keeps a squad off one spot (A.i 0: 2.5 m along x)
  const cv = C.coverAt(cs.x, cs.z, {}), face = cv.x * (e.x - cs.x) + cv.z * (e.z - cs.z) > 0;
  ok(cv.p > 0 && face && C.near(cs.x, cs.z, 4).some(n => n.K.rock), era + ': a soldier meeting an enemy beside a rock takes a rock\'s cover between him and the enemy (' + hd(cs, o).toFixed(1) + ' m from the first rock\'s middle)');
  const B = pick('bush', 1.2, 150); if (!ok(!!B, era + ': a bush')) continue;
  const h = $('hideAt')(B.o.x + 5, B.o.z, 7), by = C.near(h.x, h.z, 10).filter(n => n.K.veil ? C.footD(n, h.x, h.z) < 4 : n.K.rock).concat($('kindAt')(h.x, h.z) === 1 ? [{ k: 'wood', x: h.x, z: h.z, rd: 0 }] : []);
  ok(by.length > 0, era + ': a scout looking for a hidden place on open ground picks one in a bush, by a rock or in a wood (' + by.map(n => n.k + (n.K ? ' ' + C.footD(n, h.x, h.z).toFixed(1) + ' m' : '')).join(', ') + ')');
  const q = man(0, B.o.x + 15, B.o.z, 0, true), A = q.ai, was = $('dNear');
  C.FAKE = { x: q.x, y: q.y + 40, z: q.z, team: 1, dead: false }; $('dNear = () => globalThis.FAKE');   // a drone over him
  A.dsh = 0; $('dHide')(q, A, null); C.WAS_ = was; $('dNear = globalThis.WAS_');
  ok(A.bx !== undefined && C.footD(B.o, A.bx, A.bz) < 1.5, era + ': a soldier with a drone over him in the open runs into the nearest bush');
}
console.log('-- the trees: bigger ones, broadleaves, and woods that hide from the ground and from the air --');
/* the middle of a dense wood on level ground, and the way out of it to open level ground: { w, ux, uz, edge } with edge m to its edge */
function deep(min) {
  const N = T.N, wd = $('woodAt');
  for (let j = 2; j < N - 1; j++) for (let i = 2; i < N - 1; i++) {
    const x = T.x0 + i * T.cx, z = T.z0 + j * T.cz;
    if (!wd(x, z) || !flat(x, z, 60)) continue;
    for (let a = 0; a < 8; a++) {
      const ux = Math.cos(a * Math.PI / 4), uz = Math.sin(a * Math.PI / 4); let e = 0;
      while (e < 700 && wd(x + ux * e, z + uz * e)) e += 4;
      if (e < min || e > 400) continue;
      const vx = x + ux * (e + 160), vz = z + uz * (e + 160);
      if (wd(vx, vz) || !flat(vx, vz, 10) || C.near(vx, vz, 6).length || !$('los')({ x: vx, z: vz }, C.hgt(vx, vz) + 2.7, { x: x + ux * (e - 8), z: z + uz * (e - 8) }, C.hgt(x + ux * (e - 8), z + uz * (e - 8)) + 1)) continue;
      return { w: { x, z }, ux, uz, edge: e, vx, vz };
    }
  }
  return null;
}
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const tr = T.objs.filter(o => o.k === 'tree'), big = tr.filter(o => o.sc > 1.6 + 1e-9), leaf = tr.filter(o => o.v), C5 = H.load({ mapv: 5 }), T5 = C5.sandbox(era).T, t5 = T5.objs.filter(o => o.k === 'tree');
  const T2 = H.load({ mapv: 6, seed: 3 }).sandbox(era).T, tr2 = T2.objs.filter(o => o.k === 'tree');
  console.log('   ' + era + ': ' + tr.length + ' trees, ' + big.length + ' grown past the largest of before (up to ' + (Math.max(...tr.map(o => o.h))).toFixed(0) + ' m high, against ' + Math.max(...t5.map(o => o.h)).toFixed(0) + '), ' + leaf.length + ' broadleaves');
  ok(big.length > tr.length * .05 && leaf.length > tr.length * .25 && leaf.length < tr.length * .6 && Math.max(...tr.map(o => o.sc)) <= $('TREES').max, era + ': some trees much bigger, conifers and broadleaves');
  ok(t5.length === tr.length && t5.every(o => !o.v && o.sc <= 1.6) && t5.every((o, i) => o.id === tr[i].id && o.x === tr[i].x && o.z === tr[i].z), era + ': map 5 keeps its trees as they were, map 6 the same trees in the same places');
  ok(tr2.every((o, i) => o.sc === tr[i].sc && o.v === tr[i].v), era + ': another client grows the same trees');
  const D = deep(70); if (!ok(!!D, era + ': a dense wood with open level ground beside it')) continue;
  const { w, ux, uz, edge, vx, vz } = D, sees = $('sees'), hid = $('hid');
  const ai = man(1, vx, vz, 0, true), me = man(1, vx + uz * 2, vz - ux * 2, 0, false), t = man(0, w.x, w.z, 0);
  look(ai, t); look(me, t);
  const inner = [sees(ai, t), sees(me, t)], ki = tk(ai, t, 20);
  const set = (x, z) => { t.x = x; t.z = z; t.y = $('manY')(x, z); t.cv = null; };
  set(w.x + ux * (edge - 10), w.z + uz * (edge - 10)); look(ai, t);
  const rim = [sees(ai, t), sees(me, t)], kr = tk(ai, t, 20);
  set(w.x, w.z); const old = !$('woodCut')(ai.x, $('eyeY')(ai), ai.z, t.x, $('bodyY')(t), t.z);
  console.log('   ' + era + ': a soldier standing ' + edge.toFixed(0) + ' m inside a wood, from 160 m out: the AI knows it in ' + f1(ki) + '; 10 m inside, in ' + f1(kr));
  ok(!inner[0] && !inner[1] && ki === Infinity, era + ': deep in the wood, neither the AI nor the player\'s soldier sees it');
  ok(rim[0] && rim[1] && kr < Infinity, era + ': at the edge of the wood both see it, and the AI makes it out');
  ok(!old, era + ': it is the wood between them that hides it');
  ok($('los')(t, $('eyeY')(t), { x: w.x + ux * 20, z: w.z + uz * 20 }, C.hgt(w.x + ux * 20, w.z + uz * 20) + 1.5), era + ': in the wood one sees the next man 20 m off');
  /* from the air */
  const pl = (ai, d) => { const p = C.addPlane(S.E.sides[1].fighter, 1, w.x - uz * d, C.hgt(w.x, w.z) + d * .45, w.z + ux * d, 0, ai); p.v = { x: 0, y: 0, z: 0 }; return p; };
  const tank = Object.keys($('TANKS')).find(id => $('TANKS')[id].era === era), u = C.addVehicle('tank', tank, 0, w.x, w.z, 0);
  const pa = pl(true, 1000), pm = pl(false, 1000), kt = tk(pa, u, 20), tin = [hid(pa, u), hid(pm, u)];
  const ox = vx + uz * 20, oz = vz - ux * 20, u2 = C.addVehicle('tank', tank, 0, ox, oz, 0), pa2 = C.addPlane(S.E.sides[1].fighter, 1, ox - uz * 1000, C.hgt(ox, oz) + 450, oz + ux * 1000, 0, true), pm2 = C.addPlane(S.E.sides[1].fighter, 1, ox - uz * 1000, C.hgt(ox, oz) + 450, oz + ux * 1000, 0, false); pa2.v = pm2.v = { x: 0, y: 0, z: 0 };
  const tout = [hid(pa2, u2), hid(pm2, u2)], ko = tk(pa2, u2, 20);
  console.log('   ' + era + ': a tank in the wood from an aircraft ' + $('dist')(pa, u).toFixed(0) + ' m off: the AI pilot knows it in ' + f1(kt) + '; on open ground ' + f1(ko));
  ok(tin[0] && tin[1] && kt === Infinity, era + ': a tank under the canopy is hidden from the pilot and from the AI pilot at 1 km');
  ok(!tout[0] && !tout[1] && ko < Infinity, era + ': on open ground both can make it out');
  const pc = pl(true, 330), pmc = pl(false, 330);
  ok(!hid(pc, u) && !hid(pmc, u), era + ': flying over it, inside ' + $('TREES').air + ' m, both can');
  S.units = [];
  set(w.x, w.z); const ps = pl(true, 650), pms = pl(false, 650), vR = $('visR')(t), ks = tk(ps, t, 20);
  ok(hid(ps, t) && hid(pms, t) && ks === Infinity && $('dist')(ps, t) < vR * MAN.air, era + ': a soldier standing in the wood, ' + $('dist')(ps, t).toFixed(0) + ' m from an aircraft: hidden from both pilots by the canopy (it would be made out to ' + (vR * MAN.air).toFixed(0) + ' m without it, ' + (vR * MAN.air * $('TREES').canopy).toFixed(0) + ' under it)');
  const lone = tr.find(o => o.sc > 1.8 && !$('woodAt')(o.x, o.z) && S.os[o.id] < 2);
  if (lone) { const q = man(0, lone.x + lone.rd + 1.5, lone.z, 0); ok($('canopy')(q), era + ': under the crown of a lone big tree is under a canopy too'); }
}
done();
