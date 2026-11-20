'use strict';
/* CEREBRO: soldado (P1), the exercises with no screen of its "ready when" (report cf-cerebro-pesquisa, 3.2):
   (a) a round past a soldier in the open: flat in 0.6 s or less, and in cover within 10 m in 3 s or less when there is cover;
   (b) a grenade at 5 m that he sees: out of its reach or thrown back in 80% of the seeds or more; one he does not perceive: no reaction;
   (c) in panic, alone and with the enemy round him in the open: he surrenders; with his leader within 30 m and his morale shaken or better, never;
   (d) out of rounds and a rifle by a fallen mate 15 m off: he takes it;
   (e) the captain's: a squad in the open 15 m from a house sees a tank 300 m off: in 3 s or less nobody lies in the open, all out of the
   tank's sight (a wall, the house or the ground between).
   Short (a few s of battle each); N seeds (default 10) */
const H = require('./harness'), ok = H.ok, N = +process.env.N || 10;
const box = (seed, era) => {
  const C = H.load({ seed }), $ = C.$, S = C.sandbox(era || 'ww2'), r = S.T.routes[0], mid = r.len / 2;
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const at = (s, off) => { const p = $('routeAt')(r, s); return { x: p.x - p.dz * (off || 0), z: p.z + p.dx * (off || 0), s }; };
  const squad = (t, s, off, kits, O) => { const p = at(s, off); const q = C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, p.x, p.z, 0, s, kits)); C.setOrd(q, Object.assign({ k: 'hold', ri: 0, s, x: p.x, z: p.z, R: 8 }, O)); return q; };
  const know = (a, t, g) => { const e = $('meter')(a, t); Object.assign(e, { kn: true, t: S.t, kt: S.t - 5, rt: .3, v: 1.2, rc: g >= 2 ? 1 : 0, ic: g >= 3 ? 1 : 0, ex: 0, ez: 0, told: false }); return e; };
  return { C, $, S, mid, at, squad, know };
};
const still = m => { m.inv = 1e9; const p = { x: m.x, z: m.z }; m.pin = () => { m.x = p.x; m.z = p.z; m.ctl.fire = false; }; return m; };

console.log('-- (a) a round past him in the open --');
{
  let n = 0, down = 0, cov = 0, hadCov = 0; const dts = [];
  for (let k = 0; k < N; k++) {
    const { C, $, S, mid, squad } = box(100 + k, k & 1 ? 'modern' : 'ww2');
    const q = squad(0, mid, 30), e = squad(1, mid + 400, 30), m = q.men[0], by = e.men[0];
    for (const o of e.men) still(o);
    C.run(1, () => { for (const o of e.men) o.pin(); });
    const t0 = S.t; let tDown = -1, th = { x: by.x, z: by.z };
    for (let i = 0; i < 3; i++) $('drInc')(m, by, (m.x - by.x) * 2, (m.z - by.z) * 2, 1);
    const c0 = $('brTps')(m, 'abrigo', { e: th, r: 10 }), here0 = $('brHere')(m, th);
    const has = c0 && c0[0].sc > here0 + .3 && Math.hypot(c0[0].x - m.x, c0[0].z - m.z) > 1.5;
    let inCov = false;
    C.run(3, () => { for (const o of e.men) o.pin(); if (tDown < 0 && m.st === 2) tDown = S.t - t0; if (!inCov && has && $('brHere')(m, th) >= here0 + .3) inCov = true; });
    n++; if (tDown >= 0 && tDown <= .6 + 1e-6) down++; dts.push(tDown.toFixed(2)); if (has) { hadCov++; if (inCov) cov++; }
  }
  ok(down === n, 'flat in 0.6 s or less: ' + down + '/' + n + ' (s: ' + dts.join(' ') + ')');
  ok(!hadCov || cov / hadCov >= .8, 'in better cover within 3 s where there was some within 10 m: ' + cov + '/' + hadCov);
}

console.log('-- (b) a grenade at 5 m --');
{
  let n = 0, safe = 0, back = 0, quiet = 0, nq = 0;
  for (let k = 0; k < N; k++) {
    const { C, $, S, mid, squad } = box(200 + k, k & 1 ? 'modern' : 'ww2');
    const q = squad(0, mid, 30), e = squad(1, mid + 60, 30), m = q.men[0], by = e.men[0];
    for (const o of q.men) if (o !== m) { o.dead = o.gone = true; }
    m.inv = 1e9; for (const o of e.men) if (o.mis) o.mis.roe = 'hold';   // only the grenade can hurt him
    for (const o of e.men) still(o);
    C.run(.5, () => { for (const o of e.men) o.pin(); });
    m.h = Math.atan2(-(by.z - m.z), by.x - m.x); $('manDir')(m);
    const ux = Math.cos(m.h), uz = -Math.sin(m.h), gx = m.x + ux * 5, gz = m.z + uz * 5, gy = C.hgt(gx, gz) + 2;
    const b = $('lobbed')(by, 'nade', $('MAN').nade, gx, gy, gz, 0, -2, 0); b.fz = S.t + $('GRN').fuse;
    let at = null, thrown = false; const nb0 = S.bombs.length;
    C.run(5, () => { for (const o of e.men) o.pin(); if (!at && b.gone) at = { x: b.x, z: b.z, dm: Math.hypot(m.x - b.x, m.z - b.z), t: S.t }; if (S.bombs.some(o => o.k === 'nade' && o.by === m)) thrown = true; });
    n++; if (thrown) back++; else if (at && !m.dead && (at.dm >= 8 || m.st === 2)) safe++;
    // not perceived: one lying behind him, already landed, out of his sight
    const { C: C2, $: $2, S: S2, mid: mid2, squad: sq2 } = box(300 + k, 'ww2');
    const q2 = sq2(0, mid2, 30), m2 = q2.men[0]; for (const o of q2.men) if (o !== m2) { o.dead = o.gone = true; }
    C2.run(.5);
    const hx = Math.cos(m2.h), hz = -Math.sin(m2.h), x2 = m2.x - hx * 6, z2 = m2.z - hz * 6, b2 = $2('lobbed')(m2, 'nade', $2('MAN').nade, x2, C2.hgt(x2, z2) + .1, z2, 0, 0, 0);
    b2.fz = S2.t + 3; b2.rest = 1; b2.l0 = 1; b2.by = { team: 1, x: x2 + 100, z: z2, dead: false };
    let moved = false; const p0 = { x: m2.x, z: m2.z }; m2.est = [];
    C2.run(1.2, () => { if (m2.rf && m2.rf.R && m2.rf.R.k === 'granada') moved = true; });
    nq++; if (!moved) quiet++;
    void p0;
  }
  ok((safe + back) / n >= .8, 'out of its reach (or flat when there was no time) or thrown back: ' + (safe + back) + '/' + n + ' (thrown back ' + back + ')');
  ok(quiet === nq, 'a grenade behind him that he neither saw nor heard land: no reaction in ' + quiet + '/' + nq);
}

console.log('-- (c) surrender --');
{
  let n = 0, yes = 0, never = 0, nn = 0;
  for (let k = 0; k < N; k++) {
    for (const lead of [false, true]) {
      const { C, $, S, mid, squad, know } = box(400 + k, 'ww2');
      const q = squad(0, mid, 60), m = q.men[q.men.length - 1], L = q.men[0];
      for (const o of q.men) if (o !== m && (o !== L || !lead)) { o.dead = o.gone = true; }
      if (lead) { L.x = m.x + 12; L.z = m.z; }
      const foes = [];
      for (let i = 0; i < 3; i++) { const e = squad(1, mid + 40 * (i - 1), 60 + (i === 1 ? 40 : -10)); for (const o of e.men) { still(o); foes.push(o); } }
      $('brMo')(m).m = lead ? .45 : .1; m.mo.s = .5;
      C.run(4, () => { for (const o of foes) { o.pin(); know(m, o, 2); } if (!lead) $('brMo')(m).m = Math.min(m.mo.m, .1); });
      if (lead) { nn++; if (!m.sur) never++; } else { n++; if (m.sur) yes++; }
    }
  }
  ok(yes / n >= .8, 'in panic, alone, the enemy seen round him in the open: surrenders in ' + yes + '/' + n);
  ok(never === nn, 'with his leader 12 m off and his morale shaken: never (' + never + '/' + nn + ')');
}

console.log('-- (d) a fallen mate\'s rifle --');
{
  let n = 0, took = 0;
  for (let k = 0; k < N; k++) {
    const { C, $, S, mid, squad } = box(500 + k, 'ww2');
    const q = squad(0, mid, 30), m = q.men[1], d = q.men[2];
    for (const o of q.men) if (o !== m && o !== d) { o.dead = o.gone = true; }
    d.x = m.x + 15; d.z = m.z; d.y = C.hgt(d.x, d.z); $('killMan')(d, null); d.gone = false;
    m.arms[0].mag = 0; m.arms[0].res = 0;
    C.run(20);
    n++; if (m.arms[0].mag + m.arms[0].res > 0) took++;
  }
  ok(took / n >= .8, 'out of rounds, a rifle by a fallen mate 15 m off: taken in ' + took + '/' + n);
}
console.log('-- (e) a tank made out, a house 15 m off --');
{
  let n = 0, hid = 0, flat = 0, men = 0; const why = {};
  for (let k = 0; k < N; k++) {
    const { C, $, S, squad, know } = box(600 + k, 'ww2');
    const all = S.T.objs.filter(o => o.B && $('drBldOk')(o) && o.hw && o.hd && Math.max(o.hw, o.hd) < 8);
    if (!all.length) { ok(false, 'no house on the map'); break; }
    let best = null;
    for (let h = 0; h < all.length && !best; h++) {
      const H0 = all[(h + k * 37) % all.length];
      for (let i = 0; i < 16 && !best; i++) {
        const a = i * Math.PI / 8, ux = Math.cos(a), uz = Math.sin(a), px = -uz, pz = ux, sx = H0.x + px * 15, sz = H0.z + pz * 15, tx = sx + ux * 300, tz = sz + uz * 300;
        if (C.hgt(sx, sz) < S.T.WL + 1 || C.hgt(tx, tz) < S.T.WL + 1 || $('near')(sx, sz, 5).some(o => o.B) || $('kindAt')(sx, sz) === 1) continue;
        if ($('los')({ x: tx, z: tz }, C.hgt(tx, tz) + 2.5, { x: sx, z: sz }, C.hgt(sx, sz) + 1)) best = { sx, sz, tx, tz };
      }
    }
    if (!best) continue;
    const p = $('railOf')(best.sx, best.sz), q = C.dispatch(0, { kind: 'defend', why: 'teste' }, () => C.addSquad(0, best.sx, best.sz, p.ri, p.s)); C.setOrd(q, { k: 'hold', ri: p.ri, s: p.s, x: best.sx, z: best.sz, R: 8 });
    for (const m of q.men) { m.x = best.sx + (m.ai.i - 2) * 2; m.z = best.sz; m.y = C.hgt(m.x, m.z); m.inv = 1e9; if (m.arms[1] && (m.arms[1].d.k === 'heat' || m.arms[1].d.k === 'atgm')) { m.arms[1].mag = 0; m.arms[1].res = 0; } }
    const t = C.dispatch(1, { why: 'teste' }, () => C.addUnit('tank', 1, best.tx, best.tz, S.E.sides[S.fac[1]].tanks[0], false));
    t.x = best.tx; t.z = best.tz; t.y = C.hgt(t.x, t.z); if (t.mis) t.mis.roe = 'hold'; t.rail = false;
    const pin = () => { t.x = best.tx; t.z = best.tz; t.v.x = t.v.z = 0; for (const a of t.arms || []) a.cool = 9; };
    C.run(.1, pin); for (const m of q.men) know(m, t, 2);
    C.run(3, () => { pin(); for (const m of q.men) know(m, t, 2); });
    for (const m of q.men) {
      if (m.dead) continue; men++;
      const ey = $('eyeY')(t), seen = $('los')(t, ey, m, $('bodyY')(m));
      if (!seen) hid++; else if (m.st === 2) flat++;
      const w = m.rf && m.rf.R ? m.rf.R.k + (m.rf.p ? ':' + m.rf.p.why : '') : m.ut ? 'u:' + m.ut.k : '-'; why[w] = (why[w] || 0) + 1;
    }
    n++;
  }
  ok(n > 0 && flat === 0, 'nobody flat in the tank\'s sight after 3 s (' + flat + ' of ' + men + ' men, ' + n + ' squads)');
  ok(n > 0 && hid === men, 'out of the tank\'s sight (the captain: all of them): ' + hid + '/' + men + ' ' + JSON.stringify(why));
}
H.done();
