'use strict';
/* CEREBRO: urbano (G7 of the General 2, cf-g2-g7-urbano): the exercises without a screen of each case of cf-ia-opensource §2.4, each with
   URB.on 0 (the page as before) and 1 on the same seed:
   1. the anti-tank man and a moving tank: a squad holding beside a road, an enemy tank driving past it within the launcher's range (not
      firing, as atprobe of §2.4 had it, but moving): anti-tank rounds fired;
   2. the sniper's post: a squad holding a place with a sniper; his place is a post of his own (outdoors, off the squad's slot, a line of
      fire to the ground ahead), not the squad's slot;
   3. the garrison of a town: a squad holding a town point by the defence plan (DFP): its places in buildings;
   4. clearing a town: a squad assaulting a town point nobody holds goes building by building: buildings cleared, men inside them;
   5. the switch: with URB.on 0 the battle is the one before (the same squads, the same steps, the same fingerprint); and PARITY=<an older
      page> plays SECS s of the same AI × AI match on both (URB.on 0 on this one; map 11, the game's, or MAPV): the same fingerprint every 15 s (the meters do not change it).
   SEEDS=3 seeds each (default 3), ERA ww2|modern (default both for 1), ONLY=1,3 some of them, ATD and ATV the squad's distance off the road
   and the tank's speed in 1. Prints the numbers; fails only when on is not better than off. */
const H = require('./harness'), { ok, done } = H, crypto = require('crypto');
console.log('page: ' + H.PAGE);
const SEEDS = +process.env.SEEDS || 3, ERAS = process.env.ERA ? [process.env.ERA] : ['ww2', 'modern'], ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null, run = k => !ONLY || ONLY.includes(k);
const pick = (a, n) => a.slice(0, n);
/* a stretch of open road on route 0, with a place 60 m off it that sees the road */
function roadSpot(C, S, side) {
  const $ = C.$, r = S.T.routes[0];
  for (let s = 600; s < r.len - 600; s += 97) {
    const p = $('routeAt')(r, s), x = p.x - p.dz * side, z = p.z + p.dx * side;
    if (C.hgt(x, z) < S.T.WL + 1 || C.hgt(p.x, p.z) < S.T.WL + 1 || $('kindAt')(x, z) === 1 || $('near')(x, z, 10).some(o => o.B)) continue;
    if ($('los')({ x: p.x, z: p.z }, C.hgt(p.x, p.z) + 2.5, { x, z }, C.hgt(x, z) + 1)) return { s, x, z, r };
  }
  return null;
}
if (run(1)) console.log('-- 1. the anti-tank man and a moving tank --');
const D = +process.env.ATD || 100, V = +process.env.ATV || 8;   // the squad D m off the road (out of a Panzerfaust's 70 m and nearly of a bazooka's 120: he must go to it); the tank at V m/s
if (run(1)) for (const era of ERAS) {
  const res = { 0: { at: 0, rk: 0, n: 0 }, 1: { at: 0, rk: 0, n: 0 } };
  for (let k = 0; k < SEEDS; k++) for (const on of [0, 1]) {
    const C = H.load({ seed: 700 + k }), $ = C.$, S = C.sandbox(era); $('URB.on = ' + on);
    S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
    const sp = roadSpot(C, S, D); if (!sp) continue;
    const tm = [0, 1].find(f => $('INF')[era][S.fac[f]].some(id => { const d = $('KITS')[id]; return d.arms[1] && d.arms[1].k === 'heat'; })), E = $('INF')[era][S.fac[tm]];   // the side whose launcher is a rocket (modern: the Russians; the USA's is a guided missile)
    const at = E.findIndex(id => { const d = $('KITS')[id]; return d.arms[1] && d.arms[1].k === 'heat'; }), kits = [0, 0, at, 0, 1];
    const pr = $('railOf')(sp.x, sp.z), q = C.dispatch(tm, { kind: 'defend', why: 'teste' }, () => C.addSquad(tm, sp.x, sp.z, pr.ri, pr.s, kits));
    C.setOrd(q, { k: 'hold', ri: pr.ri, s: pr.s, x: sp.x, z: sp.z, R: 10 });
    const ats = q.men.filter(m => m.arms[1] && m.arms[1].d.k === 'heat');
    const s0 = sp.s - 450, v = V, p0 = $('routeAt')(sp.r, s0);
    const t = C.dispatch(1 - tm, { why: 'teste' }, () => C.addUnit('tank', 1 - tm, p0.x, p0.z, S.E.sides[S.fac[1 - tm]].tanks[0], false));
    t.rail = false; t.inv = 1e9; if (t.mis) t.mis.roe = 'hold';
    let rk = 0; $('globalThis').__rk = () => rk++;
    $("manFire = (f => function (m, a) { const n0 = a && a.mag; const r = f(m, a); if (m && m.ai && a && a.d && a.d.k === 'heat' && a.mag < n0) globalThis.__rk(); return r; })(manFire)");
    const T0 = S.t;
    C.run(170, () => {   // it drives along the road past the squad, V m/s, 900 m
      const s = s0 + (S.t - T0) * v, p = $('routeAt')(sp.r, s), dx = p.dx, dz = p.dz;
      t.x = p.x; t.z = p.z; t.y = C.hgt(p.x, p.z); t.v.x = dx * v; t.v.z = dz * v; t.h = Math.atan2(-dz, dx); for (const a of t.arms || []) a.cool = 9;
      if (s > sp.s + 400) return false;
    });
    const o = res[on]; o.at += ats.length; o.rk += rk; o.n++;
  }
  console.log('   ' + era + ': URB.on 0: ' + res[0].rk + ' rounds by ' + res[0].at + ' anti-tank men in ' + res[0].n + ' runs; URB.on 1: ' + res[1].rk + ' by ' + res[1].at + ' in ' + res[1].n);
  ok(res[1].n > 0 && res[1].rk >= res[0].rk && res[1].rk >= res[1].n, era + ': with URB.on the anti-tank men fire at the moving tank, a round a run or more and no fewer than before (' + res[1].rk + ' rounds, ' + res[0].rk + ' before)');
}
/* a village of the map: a town point held by side 0 there (the DFP test's way), and a road near it */
function town(C, S, hold) {
  const $ = C.$, w = S.T.towns[0], pr = $('railOf')(w.x, w.z);
  return { P: { x: w.x, z: w.z, r: 150, tw: 1, hold, L: 'X', name: 'Vila de teste', links: [], ri: pr.ri, s: pr.s }, pr };
}
if (run(2)) {
  console.log('-- 2. the sniper\'s post --');
  const out = { 0: [], 1: [] };
  for (let k = 0; k < SEEDS; k++) for (const on of [0, 1]) {
    const era = ERAS[k % ERAS.length], C = H.load({ seed: 720 + k }), $ = C.$, S = C.sandbox(era); $('URB.on = ' + on);
    S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
    const { P, pr } = town(C, S, 0), E = $('INF')[era][S.fac[0]], sn = E.findIndex(id => $('KITS')[id].snp);
    const q = C.dispatch(0, { kind: 'defend', why: 'teste' }, () => C.addSquad(0, P.x + 30, P.z, pr.ri, pr.s, [0, 0, sn, 1, 2]));
    C.setOrd(q, { k: 'hold', ri: pr.ri, s: pr.s, x: P.x, z: P.z, tw: P, R: 0 });
    const m = q.men.find(o => o.def.snp);
    C.run(60);
    const sl = $('slot')(q, m.ai.i), post = m.urbS && m.urbS.x !== undefined ? m.urbS : null;
    out[on].push({ d: Math.round(Math.hypot(m.x - P.x, m.z - P.z)), post: !!post, off: post ? Math.round(Math.hypot(post.x - P.x, post.z - P.z)) : null, at: post ? Math.round(Math.hypot(m.x - post.x, m.z - post.z)) : null, st: m.st, in: !!m.cbin });
  }
  console.log('   URB.on 0: ' + JSON.stringify(out[0]) + '\n   URB.on 1: ' + JSON.stringify(out[1]));
  ok(out[1].filter(o => o.post).length >= Math.ceil(out[1].length / 2) && out[0].every(o => !o.post), 'with URB.on the sniper takes a post of his own in most runs (' + out[1].filter(o => o.post).length + ' of ' + out[1].length + '), never without it');
  ok(out[1].filter(o => o.post).every(o => o.at <= 6 && o.st === 2 && !o.in), 'and he is at it, lying, out of doors, after 60 s');
}
if (run(3)) {
  console.log('-- 3. the garrison of a town --');
  const sh = { 0: [], 1: [] };
  for (let k = 0; k < SEEDS; k++) for (const on of [0, 1]) {
    const era = ERAS[k % ERAS.length], C = H.load({ seed: 740 + k }), $ = C.$, S = C.sandbox(era); $('URB.on = ' + on);
    S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
    const { P, pr } = town(C, S, 0), sq = [0, 1].map(j => { const q = C.addSquad(0, P.x + 20 * j, P.z + 10, pr.ri, pr.s); C.setOrd(q, { k: 'hold', ri: pr.ri, s: pr.s, x: P.x, z: P.z, tw: P, R: 0 }); q.at = true; return q; });
    const pts = sq.flatMap(q => { q.pts = null; return [...Array(q.n0).keys()].map(i => $('slot')(q, i)); });
    sh[on].push(Math.round(100 * pts.filter(p => p && p.b).length / pts.length));
  }
  console.log('   places in a building (%): URB.on 0 ' + sh[0].join(', ') + '; URB.on 1 ' + sh[1].join(', '));
  const a = sh[0].reduce((x, y) => x + y, 0), b = sh[1].reduce((x, y) => x + y, 0);
  ok(b > a && b / sh[1].length >= 40, 'with URB.on more of the defenders\' places of a town are in its buildings (' + Math.round(b / sh[1].length) + '% against ' + Math.round(a / sh[0].length) + '%; the target ≥ 40%)');
}
if (run(4)) {
  console.log('-- 4. clearing a town --');
  const r = { 0: [], 1: [] };
  for (let k = 0; k < SEEDS; k++) for (const on of [0, 1]) {
    const era = ERAS[k % ERAS.length], C = H.load({ seed: 760 + k }), $ = C.$, S = C.sandbox(era); $('URB.on = ' + on);
    S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
    const { P, pr } = town(C, S, 1), a = $('routeAt')(S.T.routes[pr.ri], pr.s - 260 * (pr.s > 300 ? 1 : -1)), q = C.addSquad(0, a.x, a.z, pr.ri, pr.s - 260);
    C.setOrd(q, { k: 'assault', ri: pr.ri, s: pr.s, x: P.x, z: P.z, tw: P, R: 0, ax: P.x, az: P.z });
    let inB = 0, n = 0; const bs = new Set();
    C.run(180, () => { if ((n++ % 30) === 0) for (const m of q.men) if (!m.dead && m.cbin && m.cbo && Math.hypot(m.cbo.x - P.x, m.cbo.z - P.z) < P.r) { inB++; bs.add(m.cbo.id); } });
    const cl = S.urbClr ? [...S.urbClr.values()].filter(v => v[0] !== undefined).length : 0;
    r[on].push({ cleared: cl, entered: bs.size, inB: Math.round(inB / 2) });
  }
  console.log('   URB.on 0: ' + JSON.stringify(r[0]) + '\n   URB.on 1: ' + JSON.stringify(r[1]));
  const e0 = r[0].reduce((x, o) => x + o.entered, 0), e1 = r[1].reduce((x, o) => x + o.entered, 0);
  ok(r[1].every(o => o.cleared >= 1) && e1 > e0, 'with URB.on the squad clears the town building by building (' + r[1].map(o => o.cleared).join(', ') + ' cleared; ' + e1 + ' buildings entered against ' + e0 + ')');
}
if (run(5)) {
  console.log('-- 5. the switch --');
  const fp = S => { const h = crypto.createHash('md5'); for (const m of S.men) h.update(m.x.toFixed(3) + ',' + m.z.toFixed(3) + ',' + (m.dead ? 1 : 0)); for (const u of S.units) h.update(u.x.toFixed(3) + ',' + u.z.toFixed(3) + ',' + u.hp); h.update(JSON.stringify(S.cq ? S.cq.ps : 0)); return h.digest('hex').slice(0, 12); };
  const play = (page, on, secs) => {
    const C = H.load({ seed: 3, eco: 1, lg: 1, rec: 1, mapv: +process.env.MAPV || 11, ana: true, page }), $ = C.$; $('AIB').now = () => 0;
    if (on !== null) $('URB.on = ' + on);
    const S = C.watch('ww2', { doc: ['balanced', 'aggressive'], len: 0 }), l = []; let nx = 15;
    C.run(secs, () => { if (S.t >= nx) { nx += 15; l.push(fp(S)); } return !S.over; });
    return { l, urb: S.urbD ? JSON.stringify(S.urbD) : null };
  };
  const secs = +process.env.SECS || 60, a = play(undefined, 0, secs), b = play(undefined, 1, secs);
  ok(a.l.length && a.l.join() !== b.l.join(), 'URB.on 1 changes the battle (' + secs + ' s: ' + a.l.join(' ') + ' against ' + b.l.join(' ') + ')');
  ok(!!a.urb, 'the meters run in an AI × AI match with the analytics: ' + (a.urb || '').slice(0, 160));
  if (process.env.PARITY) {
    const o = play(require('path').resolve(process.env.PARITY), null, secs);
    ok(o.l.join() === a.l.join(), 'PARITY: the older page and this one with URB.on 0 play the same ' + secs + ' s (' + o.l.join(' ') + ')');
  }
}
done();
