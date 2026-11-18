'use strict';
/* helicopters, AI: the attack helicopter's mask, pop-up and drop, going home hurt, a transport's run, and what the other AI does to one */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 31 }), $ = C.$;
const HELIS = $('HELIS'), HAI = $('HAI'), f1 = v => v.toFixed(1), N = +process.env.TRIALS || 10, SECS = +process.env.SECS || 420;
let S;
const agl = p => p.y - C.hgt(p.x, p.z) - p.def.gh, hd = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const seen = () => { for (const u of S.units) if (u.team === 1) { u.seenT = S.t; u.sx = u.x; u.sz = u.z; } };

console.log('an attack helicopter against a parked column, ' + SECS + ' s (the column is on its side\'s maps the whole time)');
for (const [id, team] of [['ah64', 0], ['mi28', 0]]) {
  C.seed(id.length * 7 + 3); S = C.sandbox('modern'); S.fac = [HELIS[id].side, 1 - HELIS[id].side];
  const r = S.T.routes[0], q = C.routeAt(r, r.len * .5), foes = [];
  for (let i = 0; i < 4; i++) { const u = C.addUnit(i < 3 ? 'tank' : 'truck', 1, q.x + i * 30, q.z + (i % 2) * 40, i < 3 ? S.E.sides[S.fac[1]].tanks[0] : null, true); u.inv = 0; foes.push(u); }
  const p = C.heliAir(0, id, 0), st = {}, log = [], smk0 = foes.reduce((a, u) => a + u.smk, 0); let last = '', fired = [p.ord[0], p.ord[1], p.ammo], maxAgl = 0, sumAgl = 0, n = 0, t1 = 0;
  C.run(SECS, () => { seen(); const A = p.ha; if (A && A.st !== last) { last = A.st; st[last] = (st[last] || 0) + 1; if (log.length < 14) log.push(S.t.toFixed(0) + ' ' + last); } if (!p.dead && !p.land) { maxAgl = Math.max(maxAgl, agl(p)); if (A && (A.st === 'go' || A.st === 'mask')) { sumAgl += agl(p); n++; } } if (foes.every(u => u.dead) && !t1) t1 = S.t; if (p.gone) return false; });
  const X = S.hx || [], mean = X.reduce((a, b) => a + b, 0) / (X.length || 1);
  console.log('  ' + id + ': ' + log.join(', '));
  console.log('    engagements ' + X.length + ', exposure mean ' + f1(mean) + ' s, longest ' + f1(Math.max(0, ...X)) + ' s (limit ' + HAI.expo + ' s of fire), from open ground ' + (S.hxo || 0) + '; height in transit and behind the mask mean ' + f1(sumAgl / (n || 1)) + ' m, highest pop-up ' + f1(maxAgl) + ' m');
  console.log('    fired ' + (fired[1] - p.ord[1]) + ' missiles, ' + (fired[0] - p.ord[0]) + ' rockets, ' + (fired[2] - p.ammo) + ' rounds; the tanks fired ' + (smk0 - foes.reduce((a, u) => a + u.smk, 0)) + ' smoke salvos; destroyed ' + foes.filter(u => u.dead).length + ' of 4' + (t1 ? ' by ' + t1.toFixed(0) + ' s' : '') + '; helicopter ' + (p.dead ? 'LOST' : 'structure ' + Math.round(p.hp / p.def.hp * 100) + '%') + '; trips home ' + (st.home || 0));
  ok(X.length >= 2 && mean < 10 && foes.filter(u => u.dead).length >= 1 && !p.dead, id + ' masks, pops up, fires and drops back, and kills through the tanks\' smoke');
  ok(sumAgl / (n || 1) < 30, id + ' stays low on the way and behind its mask');
}
console.log('hurt, it goes home');
{
  C.seed(5); S = C.sandbox('modern'); const r = S.T.routes[0], q = C.routeAt(r, r.len * .5), u = C.addUnit('tank', 1, q.x, q.z, 't90', true), p = C.heliAir(0, 'ah64', 2500);
  C.run(25, seen); p.hp = p.def.hp * .4; p.parts[p.def.parts.ix.tail].hp = p.def.parts[p.def.parts.ix.tail].max * .5; C.refit(p); const t0 = S.t; let tl = 0, tb = 0;
  C.run(400, () => { seen(); if (p.land && !tl) tl = S.t; if (tl && !p.land && p.hp >= p.def.hp) { tb = S.t; return false; } if (p.dead) return false; });
  console.log('  at 40% and a damaged tail rotor it turned for home, landed after ' + f1(tl - t0) + ' s ' + Math.round(hd(p, S.base[0])) + ' m from the base, and was airborne again whole after ' + f1(tb - t0) + ' s');
  ok(tl > 0 && tb > 0 && !p.dead && p.hp === p.def.hp && !p.mod.hurt, 'it lands by its airfield, is repaired and rearmed, and takes off again');
}
console.log('a transport\'s run');
for (const team of [0, 1]) {
  C.seed(9 + team); S = C.sandbox('modern'); const p = C.heliLiftRun(team), id = p.id, t0 = S.t; let tu = 0, lz = null, maxA = 0;
  C.run(600, () => { if (!p.cargo && !tu) { tu = S.t; lz = { x: p.x, z: p.z }; } if (!p.land) maxA = Math.max(maxA, agl(p)); if (p.gone) return false; });
  const sq = S.squads[0], fr = $('frontR')(), line = C.routeAt(S.T.routes[fr], $('lineS')(team, fr));
  console.log('  ' + id + ': squad out after ' + f1(tu - t0) + ' s, ' + (lz ? Math.round(hd(lz, S.base[team])) + ' m from its base and ' + Math.round(hd(lz, line)) + ' m from its side\'s line' : 'never') + ', highest ' + f1(maxA) + ' m; ' + S.men.filter(m => !m.dead).length + ' men, order ' + (sq && sq.ord.k) + '; home and gone after ' + f1(S.t - t0) + ' s' + (p.dead ? ' DESTROYED' : ''));
  ok(tu > 0 && sq && S.men.length === $('SQUAD').modern.length && p.gone && !p.dead && hd(lz, line) < 900, id + ' delivers its squad near the line and goes home');
}
console.log('what the other AI does to a helicopter hovering in the open, ' + N + ' trials each (it does nothing but hover' + ', and throw flares as the AI does where said)');
function trial(name, secs, h, flares, setup, spot) {
  let kills = 0, tsum = 0, hpsum = 0;
  for (let i = 0; i < N; i++) {
    C.seed(500 + i * 13 + name.length); S = C.sandbox('modern'); const q = C.heliPad(0, 8), p = C.addHeli('ah64', 0, q.x, C.hgt(q.x, q.z) + HELIS.ah64.gh + h, q.z, q.h, false); p.inv = 0; p.ctl.vs = 0; p.ctl.free = true; p.flares = p.def.flares;
    setup(p, i);
    C.run(secs, dt => { if (spot) { p.seenT = S.t; p.sx = p.x; p.sz = p.z; } if (flares) { const m = S.missiles.find(o => o.target === p && Math.hypot(o.x - p.x, o.y - p.y, o.z - p.z) < HAI.msl); if (m && p.flares > 0 && p.fcool <= 0 && Math.random() < dt * 2.5) { p.ai = true; C.dropFlare(p); p.ai = false; } } if (p.dead) return false; });
    if (p.dead) { kills++; tsum += S.t; } else hpsum += p.hp / p.def.hp;
  }
  console.log('  ' + name + ': ' + kills + '/' + N + ' shot down in ' + secs + ' s' + (kills ? ', after ' + f1(tsum / kills) + ' s on average' : '') + (kills < N ? '; survivors at ' + Math.round(hpsum / (N - kills) * 100) + '% of structure' : ''));
  return kills;
}
const at = (p, d, a) => { const h = Math.atan2(-p.f.z, p.f.x) + (a || 0); return { x: p.x + Math.cos(h) * d, z: p.z - Math.sin(h) * d }; };
{
  const fx = (kind, id, d) => (p, i) => { const o = at(p, d, i * .6), u = C.addUnit(kind, 1, o.x, o.z, id, true); u.inv = 0; };
  const a = trial('Pantsir at 2.5 km, helicopter 60 m up, no flares', 40, 60, false, fx('aa', 'pantsir', 2500)), b = trial('Pantsir at 2.5 km, 60 m up, flares', 40, 60, true, fx('aa', 'pantsir', 2500));
  const c = trial('Pantsir at 1.2 km, helicopter 12 m up, flares: its guns', 40, 12, true, fx('aa', 'pantsir', 1200));
  const d = trial('T-90 at 500 m, helicopter 30 m up: roof machine gun and main gun', 30, 30, false, fx('tank', 't90', 500)), d2 = trial('T-90 at 950 m, 30 m up: the roof machine gun alone', 30, 30, false, fx('tank', 't90', 950));
  const jet = (p, i) => { const o = at(p, 6000, i * .6); if (o.x < 0) o.x = 2 * p.x - o.x; if (Math.abs(o.z) > S.HW) o.z = 2 * p.z - o.z;   // a start off the map is mirrored across the helicopter onto it
    C.addPlane('su57', 1, o.x, C.hgt(o.x, o.z) + 900, o.z, Math.atan2(-(p.z - o.z), p.x - o.x), true, 'fighter'); };
  // the helicopter is on the jet's side's map the whole time, as the column above is: a fighter is tasked by the map (told) and does not find a still helicopter in an empty sky by itself
  const e = trial('Su-57 from 6 km, helicopter 80 m up, no flares (missiles only: it does not come down for a gun pass)', 120, 80, false, jet, true), e2 = trial('Su-57, flares', 120, 80, true, jet, true);
  void ((p, i) => { const o = at(p, 6000, i * .6); C.addPlane('su57', 1, o.x, C.hgt(o.x, o.z) + 900, o.z, Math.atan2(-(p.z - o.z), p.x - o.x), true, 'fighter'); });
  const f = trial('a squad with one Igla at 700 m, helicopter 60 m up, no flares', 60, 60, false, (p, i) => { const o = at(p, 700, i * .6); C.addSquad(1, o.x, o.z, 0, 0); });
  const g = trial('the same squad, flares', 60, 60, true, (p, i) => { const o = at(p, 700, i * .6); C.addSquad(1, o.x, o.z, 0, 0); });
  ok(a >= N * .7 && b <= a && d >= N * .3 && d2 < d && e >= N * .7 && e2 <= e && f >= N * .5 && g < f, 'AA, tanks, fighters and the shoulder missile all bring down a helicopter that sits in the open');
  ok(c >= 1, 'flying low does not hide it from an AA vehicle that has it in sight');
}
done();
