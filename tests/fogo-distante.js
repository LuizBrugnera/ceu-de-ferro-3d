'use strict';
/* The infantry under fire from far (the drill fogo-distante, cf-inf-fogo-longe), on the sandbox: rounds from a rifleman 600 m off pass
   close by a squad holding on a road, 2.5 a second. In the open, with no cover from him: down, smoke toward him, and sandbags dug 3 m
   toward him (DRILL.inf.far.bags) with a trench beside them. Next to a house: into the house, nothing dug. An assault under 5 rounds
   in 8 s: no drill (rush) */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 21 }), $ = C.$, GR = $('GR');
/* a road point with no woods within 50 m: open, no building within 95 m and the ground round it in sight of the shooter 600 m east; or
   house, a house 18-35 m off with at most 3 buildings within 60 m of it */
function spot(S, house) {
  const T = S.T, kindAt = $('kindAt'), los = $('los'); let best = null;
  for (const r of T.routes) for (let s = 300; s < r.len - 300; s += 30) {
    const p = $('routeAt')(r, s), x = p.x + 12, z = p.z;
    if (x + 700 > S.W - 30) continue;
    let wood = 0; for (let a = 0; a < 16; a++) for (const d of [15, 30, 50]) if (kindAt(x + Math.cos(a) * d, z + Math.sin(a) * d) === 1) wood++;
    if (wood) continue;
    const B = $('near')(x, z, 95).filter(o => o.B && S.os[o.id] < 2);
    if (house) {
      const h = B.find(o => o.B.t === 'house' && Math.hypot(o.x - x, o.z - z) > 18 && Math.hypot(o.x - x, o.z - z) < 35 && $('near')(o.x, o.z, 60).filter(q => q.B).length <= 3);
      if (h) return { x, z, ri: T.routes.indexOf(r), s, o: h };
      continue;
    }
    if (B.length) continue;
    const e = { x: x + 600, z: z + 40 }, ey = C.hgt(e.x, e.z) + 2.5; let seen = 0, n = 0;
    for (let a = 0; a < 12; a++) for (const d of [10, 25, 45, 60]) { const q = { x: x + Math.cos(a * .52) * d, z: z + Math.sin(a * .52) * d }; n++; if (los(e, ey, q, C.hgt(q.x, q.z) + 1)) seen++; }
    if (!best || seen / n > best.k) best = { x, z, ri: T.routes.indexOf(r), s, k: seen / n };
    if (best.k > .95) return best;
  }
  return best;
}
function scene(o) {
  C.seed(21); const S = C.sandbox('ww2'), p = spot(S, o.house);
  const q = C.addSquad(0, p.x, p.z, p.ri, p.s);
  C.setOrd(q, o.assault ? { k: 'assault', ri: p.ri, s: p.s + 700, x: p.x + 700, z: p.z, R: 12 } : { k: 'hold', ri: p.ri, s: p.s, x: p.x, z: p.z, R: 8 });
  C.run(6);
  const e = C.addMan($('INF').ww2[S.fac[1]][0], 1, p.x + 600, p.z + 40, 0); e.ai = null; e.inv = 1e9; e.hp = e.max = 1e9;
  const ids = new Set(S.forts.map(f => f.id)), R = { far: null, smk: [], inB: 0, p }, t0 = S.t; let shots = 0, last = -9;
  const as = $('addSmoke'); C.addSmoke = (x, y, z, ...a) => { R.smk.push({ x: x - p.x, z: z - p.z }); return as(x, y, z, ...a); };
  C.run(o.secs, () => {
    const t = S.t - t0;
    if (t < o.fire && t - last >= o.every && shots < (o.max || 999)) {   // a round past a man, 1.5 m to his side at chest height
      last = t; shots++;
      const l = q.men.filter(m => !m.dead); if (!l.length) return false; const m = l[shots % l.length];
      const ex = e.x, ey = C.hgt(e.x, e.z) + 1.5, ez = e.z, tx = m.x, tz = m.z + 1.5, ty = m.y + 1, D = Math.hypot(tx - ex, tz - ez), T = D / 800;
      S.bullets.push({ x: ex, y: ey, z: ez, vx: (tx - ex) / T, vy: (ty - ey) / T + .5 * GR * T, vz: (tz - ez) / T, life: 1.3, team: 1, dmg: 9, ap: 0, by: e, tr: 0 });
    }
    if (q.dr && q.dr.id === 'fogo-distante') { if (R.far === null) R.far = t; R.inB = Math.max(R.inB, (q.dr.p || []).filter(x => x && x.b).length); }
  });
  C.addSmoke = as;
  R.forts = S.forts.filter(f => f.team === 0 && !ids.has(f.id)).map(f => ({ k: f.k, dx: f.x - p.x, dz: f.z - p.z }));
  R.live = q.men.filter(m => !m.dead).length; R.cbin = q.men.filter(m => !m.dead && m.cbin).length;
  return R;
}

console.log('-- in the open --');
{ const R = scene({ secs: 45, fire: 40, every: .4 }), bags = R.forts.find(f => f.k === 2), toward = R.smk.filter(s => s.x > 10 && s.x < 60);
  ok(R.p.k > .9 && R.far !== null && R.far < 8, 'the drill begins ' + (R.far === null ? 'never' : R.far.toFixed(1) + ' s') + ' after the fire (the ground round the squad ' + Math.round(R.p.k * 100) + '% in the shooter\'s sight)');
  ok(toward.length >= 1, 'smoke toward the shooter: ' + R.smk.map(s => Math.round(s.x) + ',' + Math.round(s.z)).join(' ') + ' (he is at +600, +40)');
  ok(!!bags && bags.dx > 0 && Math.hypot(bags.dx, bags.dz) < 8, 'a wall of sandbags begun ' + (bags ? Math.hypot(bags.dx, bags.dz).toFixed(0) + ' m off toward the fire' : 'nowhere') + ', works: ' + R.forts.map(f => 'k' + f.k + ' ' + Math.round(f.dx) + ',' + Math.round(f.dz)).join(' ')); }
console.log('-- next to a house --');
{ const R = scene({ secs: 30, fire: 30, every: .4, house: 1 });
  ok(R.far !== null && R.inB * 2 >= R.live && !R.forts.length, 'into the house: ' + R.inB + ' of ' + R.live + ' given a place in it, ' + R.cbin + ' inside at the end, nothing dug (' + R.forts.length + ')'); }
console.log('-- an assault under a few rounds --');
{ const R = scene({ secs: 14, fire: 8, every: 1.6, max: 5, assault: 1 });
  ok(R.far === null, 'an assault under 5 rounds in 8 s goes on: no drill (' + (R.far === null ? 'none' : 'at ' + R.far.toFixed(1) + ' s') + ')'); }
done();
