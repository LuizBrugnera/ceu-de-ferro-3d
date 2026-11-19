'use strict';
/* The procedures (drills) in the unit's mind: the table (DRILLS) scored beside duty, fall and help, its record on the unit and in the review, the
   rules (latitude, roe, leash, cool-down), and the infantry's drills group by group, each from a trigger the squad perceives to what its men do:
   armour (no anti-tank weapon: smoke and out of sight; with one: fire and move), indirect fire and buildings, contact (the first contact, an
   ambush near and far, a strong position, odds against it, heavy losses), sniper and aircraft, movement (bounds in the open, behind a friendly
   tank, a halt, a mine), and fire control (ammunition, enemy smoke, friendly fire). Then honesty: nothing sets a drill off that the squad has not
   perceived, and in AI battles every drill taken answers a contact its squad believes. Last, the AI's cost per frame with and without them
   (SECS, default 120; SECS=0 leaves the battles out) */
const H = require('./harness'), ok = H.ok, SECS = process.env.SECS === undefined ? 120 : +process.env.SECS;
const box = (seed, era) => {
  const C = H.load({ seed: seed || 3 }), $ = C.$, S = C.sandbox(era || 'ww2'), r = S.T.routes[0], mid = r.len / 2;
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const at = (s, off) => { const p = $('routeAt')(r, s); return { x: p.x - p.dz * (off || 0), z: p.z + p.dx * (off || 0), s }; };
  const squad = (t, s, off, kits, O) => { const p = at(s, off); const q = C.dispatch(t, { kind: 'defend', why: 'teste' }, () => C.addSquad(t, p.x, p.z, 0, s, kits)); C.setOrd(q, Object.assign({ k: 'hold', ri: 0, s, x: p.x, z: p.z, R: 8 }, O)); return q; };
  const tank = (t, s, o) => C.dispatch(t, { why: 'teste' }, () => Object.assign(C.addUnit('tank', t, 0, 0, S.E.sides[S.fac[t]].tanks[0], false, 0, s, 0, 0), o || {}));
  const know = (a, t, g) => { const e = $('meter')(a, t); Object.assign(e, { kn: true, t: S.t, kt: S.t - 5, rt: .3, v: 1.2, rc: g >= 2 ? 1 : 0, ic: g >= 3 ? 1 : 0, ex: 0, ez: 0, told: false }); return e; };
  const live = q => q.men.filter(m => !m.dead && !m.down);
  const took = (q, id) => (q.dr && q.dr.id === id) || (q.drH || []).some(h => h[0] === id);
  const clear = () => { for (const q of S.squads) for (const m of q.men) { m.dead = m.gone = true; } for (const u of S.units) { u.dead = u.gone = true; } S.squads.length = 0; S.men.length = 0; S.units.length = 0; S.smokes.length = 0; S.bombs.length = 0; };
  return { C, $, S, r, mid, at, squad, tank, know, live, took, clear, D: $('DRILL') };
};
const NOAT = { ww2: [0, 0, 0, 1, 1], modern: [0, 0, 0, 1, 1, 0] };
const still = u => { u.inv = 1e9; if (u.mis) u.mis.roe = 'hold'; const p = { x: u.x, z: u.z, s: u.s, h: u.h }; u.pin = () => { Object.assign(u, p); u.sp = 0; if (u.v) u.v.x = u.v.z = 0; }; return u; };   // a target that stays where it is (u.pin each step) and does not shoot
const pinAll = S => () => { for (const u of S.units) if (u.pin) u.pin(); };

console.log('-- the table: scored in the mind, recorded on the unit, bound by the mission --');
{
  const { C, $, S, mid, squad, tank, know, took, D } = box(3);
  const ids = $('DRILLS').map(d => d.id), inf = $('DRILLS').filter(d => d.cls === 'inf');
  ok(inf.length >= 18 && new Set(ids).size === ids.length && inf.every(d => typeof d.when === 'function' && d.s), inf.length + ' infantry drills in the one table, each named and with its trigger');
  const q = squad(0, mid, 0, NOAT.ww2), u = tank(1, mid + 350); still(u);
  $('mindThink')(q);
  ok(!q.dr && q.mind.k !== 'drill', 'a tank on the map the squad has not perceived sets nothing off (mind: ' + q.mind.k + ')');
  for (const m of q.men) know(m, u, 2); $('mindThink')(q);
  ok(q.mind.k === 'drill' && q.dr && q.dr.id === 'tanque' && q.mind.sc.drill > q.mind.sc.duty && q.dr.of === u, 'recognized: the drill outranks duty (' + q.mind.sc.drill.toFixed(2) + ' against ' + q.mind.sc.duty.toFixed(2) + ') and the unit records it (' + q.dr.id + ', what set it off)');
  const n0 = S.drN.all[0].tanque; u.dead = true; for (let i = 0; i < 30 && q.dr; i++) { S.t += 1; $('mindThink')(q); }
  ok(!q.dr && q.drH.length === 1 && q.drH[0][0] === 'tanque' && q.drC.tanque > S.t && n0 === 1, 'the tank gone: over, into its history ' + JSON.stringify(q.drH[0]) + ', not again for ' + $('drOf')('tanque').cool + ' s');
  u.dead = false; for (const m of q.men) know(m, u, 2); $('mindThink')(q);
  ok(!(q.dr && q.dr.id === 'tanque'), '  and the same drill waits out its cool-down');
  q.drC = {}; q.mis.roe = 'hold'; q.drF = { t: S.t, by: q.men[0] }; S.smokes.push({ x: q.men[0].x + 200, y: C.hgt(q.men[0].x, q.men[0].z), z: q.men[0].z, t0: S.t, r: 30, h: 15 });
  const v = tank(1, mid + 150); still(v); for (const m of q.men) know(m, v, 2);
  const w = $('drPick')(q, $('belief')(q));
  ok(w && w.D.id !== 'fumaca' && !w.D.fire, 'roe hold: a drill that fires of its own accord is not taken (best: ' + (w && w.D.id) + ')');
  q.mis.roe = 'free'; q.mis.lat = 0; q.drF = null; q.mis.area = { x: q.men[0].x, z: q.men[0].z, r: 40 };
  const L = q.men[0], far = $('drLeash')(q, { x: L.x + 500, z: L.z }, L);
  ok(Math.abs(Math.hypot(far.x - L.x, far.z - L.z) - 40) < 1, 'a drill\'s place stays inside the mission\'s leash (500 m asked, ' + Math.round(Math.hypot(far.x - L.x, far.z - L.z)) + ' m given)');
  ok($('DRILLS').filter(d => d.lat).every(d => !$('drPick')(q, $('belief')(q)) || $('drPick')(q, $('belief')(q)).D.id !== d.id), 'latitude 0: no drill that takes the squad toward the enemy');
  $('DRILL').on = 0; q.dr = null; ok(!$('drPick')(q, $('belief')(q)), 'DRILL.on 0: none at all'); $('DRILL').on = 1;
  void took;
}

console.log('-- armour: no anti-tank weapon, smoke and out of its sight; with one, fire and move --');
for (const era of ['ww2', 'modern']) {
  const { C, $, S, mid, squad, tank, live, took } = box(11, era);
  const q = squad(0, mid, 0, NOAT[era]), u = tank(1, mid + 380); still(u);
  const seen = () => live(q).filter(m => $('sees')(u, m)).length, pin = pinAll(S);
  C.run(2, pin); const s0 = seen(), smk0 = S.smokes.length + S.bombs.filter(b => b.k === 'smk').length;
  let t = -1, smk = 0, sum = 0, n = 0, k = 0; C.run(30, () => { pin(); if (t < 0 && took(q, 'tanque')) t = S.t; smk = Math.max(smk, S.smokes.length + S.bombs.filter(b => b.k === 'smk').length - smk0); if (t > 0 && S.t > t + 5 && ++k % 30 === 0) { sum += seen(); n++; } });
  const s1 = sum / (n || 1), R = S.help && S.help.l.find(R => R.by === q);
  ok(t > 0 && smk > 0 && s1 < s0 / 2, era + ': a tank made out at 380 m (drill at ' + (t - 2).toFixed(1) + ' s): smoke thrown, men in its sight ' + s0 + ' -> ' + s1.toFixed(1) + ' of ' + live(q).length + ' on average after' + (R ? ', and it called for ' + R.k : ''));
}
{
  const { C, $, S, mid, squad, tank, took, live } = box(12, 'ww2');
  const q = squad(0, mid, 0, [0, 0, 2, 1]), u = tank(1, mid + 110); still(u); u.inv = 0; u.hp = u.max * 50; u.max = u.hp; const pin = pinAll(S);
  const g = q.men.find(m => m.arms[1] && m.arms[1].d.k === 'heat'); let shot = -1, moved = 0, p0 = null;
  C.run(60, () => { pin(); const a = g.arms[1]; if (shot < 0 && a.t > 1) { shot = S.t; p0 = { x: g.x, z: g.z }; } if (shot > 0 && S.t - shot < 5 && p0) moved = Math.max(moved, Math.hypot(g.x - p0.x, g.z - p0.z)); if (g.dead) return false; });
  ok(took(q, 'anticarro') && shot > 0 && moved > 8, 'with a rocket: the drill taken, the gunner fired at ' + (shot > 0 ? shot.toFixed(0) : '-') + ' s and moved ' + moved.toFixed(0) + ' m aside within 5 s');
  void live;
}

console.log('-- indirect fire and buildings: to shelter, out of the beaten zone; out of a building that is being hit --');
{
  const { C, $, S, mid, squad, live, took, clear } = box(7, 'ww2');
  const burst = (x, z) => $('explode')(x, C.hgt(x, z) + .5, z, 12, 0, null, 1, true);
  {
    const q = squad(0, mid, 0); C.run(12); const c = live(q)[0], bx = c.x + 18, bz = c.z + 6;
    for (let i = 0; i < 3; i++) { burst(bx + i * 4, bz); C.run(1.5); }
    const id = q.dr && q.dr.id, l = live(q), sf = () => l.filter(m => m.cbin || m.fc || (Math.hypot(m.x - bx, m.z - bz) > 40 && m.st === 2) || $('kindAt')(m.x, m.z) === 1).length;
    let safe = 0; C.run(14, () => { safe = Math.max(safe, sf()); });
    ok(id === 'artilharia' && safe >= l.length - 1, 'in the open: shells within 25 m, ' + safe + ' of ' + l.length + ' are in shelter or down well away from them (' + l.map(m => Math.round(Math.hypot(m.x - bx, m.z - bz))).join(', ') + ' m)');
    C.run(20); ok(!q.dr && took(q, 'artilharia'), '  quiet for ' + $('DRILL').inf.art.quiet + ' s: back to its order');
    clear();
  }
  {
    const w = S.T.towns[0], p = $('railOf')(w.x, w.z), q = C.dispatch(0, { kind: 'defend', why: 't' }, () => C.addSquad(0, w.x, w.z, p.ri, p.s)); C.setOrd(q, { k: 'hold', ri: p.ri, s: p.s, x: w.x, z: w.z, R: 8 });
    C.run(12); const c = live(q)[0], bx = c.x + 18, bz = c.z + 6;
    for (let i = 0; i < 3; i++) { burst(bx + i * 4, bz); C.run(1.5); }
    let inB = 0; C.run(14, () => { inB = live(q).filter(m => m.cbin).length; if (inB >= live(q).length - 1) return false; });
    ok(took(q, 'artilharia') && inB >= live(q).length - 1, 'in a town: ' + inB + ' of ' + live(q).length + ' go into the buildings');
    const o = live(q).find(m => m.cbin) && live(q).find(m => m.cbin).cbo;
    if (o) {
      const inside = live(q).filter(m => m.cbo === o && m.cbin); let out = 0, id = null;
      for (let i = 0; i < 2; i++) { $('bBurst')(o, o.x, o.y + 2, o.z, 20 * $('CITY').dmg.r, 0, null); C.run(.3); }
      C.run(12, () => { if (q.dr && q.dr.id === 'predio') id = 'predio'; out = inside.filter(m => !(m.cbo === o && m.cbin)).length; });
      ok(id === 'predio' && inside.length && out === inside.length, 'their building takes two heavy bursts while the shells fall: the ' + inside.length + ' inside it leave it for another shelter (' + out + ' out)');
    } else ok(false, 'nobody in a building to hit');
  }
}

console.log('-- contact: down at the first one, an ambush near and far, a strong position, the odds, heavy losses --');
{
  const { C, $, S, mid, at, squad, know, live, took, clear } = box(21, 'ww2');
  const foe = (s, off, i) => { const p = at(s, off), m = C.addMan($('INF').ww2[S.fac[1]][i || 0], 1, p.x, p.z, 0); m.inv = 1e9; m.ai = null; return m; };
  {
    const q = squad(0, mid, 0), r = foe(mid + 40, 0), g = foe(mid + 200, 0, 1), bel = (o, d, c, thr) => [o, { x: o.x, z: o.z, d, c, g: 2, t: S.t, thr }];
    q.bel = new Map([bel(g, 200, 'mg', 1.01), bel(r, 40, 'man', .49)]); const K = $('drInfo')(q);
    ok(K && K.near && K.near.o === r && K.near.d === 40, 'a rifleman believed at 40 m and a machine gun at 200 m: the nearest contact is the rifleman (' + (K && K.near && K.near.d) + ' m), not the greater threat');
    q.bel = null; clear();
  }
  {
    const q = squad(0, mid, 0); C.run(6); const e = foe(mid + 300, 0); for (const m of live(q)) { m.hitT = S.t; m.sup = S.t + 3; } q.drCt = -1e9;
    C.run(1.2); const id = q.dr && q.dr.id, st = live(q).filter(m => m.st === 2 || m.ctl.st === 2).length, R = (S.rep || [[]])[0].filter(r => r.k === 'contact' && r.data && r.data.dr).length;
    ok(id === 'contato' && st >= live(q).length - 1 && R === 1, 'first contact after a quiet spell: down where they are (' + st + ' of ' + live(q).length + ') and a contact report');
    clear();
  }
  {
    const q = squad(0, mid - 100, 0, null, { k: 'move', s: mid + 400, x: at(mid + 400).x, z: at(mid + 400).z }); C.run(4);
    const L = live(q)[0], p = $('railOf')(L.x, L.z), e = foe(p.s + 35, 12); for (const m of live(q)) { know(m, e, 2); m.hitT = S.t; }
    const L0 = { x: L.x, z: L.z }, d0 = Math.hypot(L.x - e.x, L.z - e.z); C.run(1.1); const id = q.dr && q.dr.id; let past = 0;
    C.run(24, () => { past = Math.max(past, live(q).filter(m => ((m.x - L0.x) * (e.x - L0.x) + (m.z - L0.z) * (e.z - L0.z)) / d0 > d0 + 3).length); });
    ok(id === 'emboscada' && past >= 2, 'ambushed at ' + d0.toFixed(0) + ' m on the move: through it, ' + past + ' already past the ambusher');
    clear();
  }
  {
    const q = squad(0, mid - 100, 0, null, { k: 'move', s: mid + 600, x: at(mid + 600).x, z: at(mid + 600).z }); C.run(4);
    const L = live(q)[0], e = foe(mid + 140, 0); for (const m of live(q)) { know(m, e, 2); m.hitT = S.t; }
    C.run(1.1); const d = q.dr; let fl = 0, base = 0;
    if (d && d.F) C.run(45, () => { fl = Math.max(fl, live(q).filter(m => m.ai.i & 1 && Math.hypot(m.x - d.F.x, m.z - d.F.z) < 25).length); base = live(q).filter(m => !(m.ai.i & 1) && d.p[m.ai.i] && Math.hypot(m.x - d.p[m.ai.i].x, m.z - d.p[m.ai.i].z) < 6).length; });
    ok(d && d.id === 'emboscada-dist' && fl >= 1 && base >= 2, 'ambushed from ' + Math.round(Math.hypot(L.x - e.x, L.z - e.z)) + ' m: one team holds its cover (' + base + '), the other goes round (' + fl + ' at the flank)');
    clear();
  }
  {
    const q = squad(0, mid - 100, 0, null, { k: 'assault', s: mid + 200, x: at(mid + 200).x, z: at(mid + 200).z }); C.run(3);
    const e = foe(mid + 100, 0), T = S.T, F = $('FORT'); C.fortAdd(T.fid + F.pre + 1, 1, 1, e.x, e.z, 0, 1); C.run(.5); for (const m of live(q)) know(m, e, 2); C.run(2.6, () => { for (const m of live(q)) know(m, e, 2); });
    const d = q.dr; ok(!!e.fc && d && d.id === 'fixar' && d.F && Math.hypot(d.F.x - e.x, d.F.z - e.z) > 40, 'an assault meets an enemy dug in: fix from the front, flank (' + (d ? d.id : '-') + ')');
    clear();
  }
  {
    const q = squad(0, mid - 100, 0, null, { k: 'move', s: mid + 600, x: at(mid + 600).x, z: at(mid + 600).z }); C.run(3);
    const L = live(q)[0], es = [0, 1, 2, 3, 4, 5, 6, 7].map(i => foe(mid + 180, -40 + i * 10, i % 3)); for (const m of live(q)) for (const e of es) know(m, e, 2);
    const d0 = Math.hypot(L.x - es[3].x, L.z - es[3].z); C.run(1.1); const id = q.dr && q.dr.id; C.run(25);
    const d1 = Math.min(...live(q).map(m => Math.hypot(m.x - es[3].x, m.z - es[3].z)));
    ok(id === 'romper' && d1 > d0 + 30, 'eight of the enemy believed against five: it breaks contact (' + Math.round(d0) + ' m -> ' + Math.round(d1) + ' m)');
    clear();
  }
  {
    const q = squad(0, mid, 0); C.run(8); q.drP = null;
    const e = foe(mid + 250, 0); for (const m of live(q)) know(m, e, 2); q.men[1].dead = q.men[2].dead = q.men[3].dead = q.men[4].dead = true;
    q.men[0].hitT = S.t; const L = live(q)[0], p0 = { x: L.x, z: L.z }; C.run(1.1); const id = q.dr && q.dr.id;
    ok(id !== 'recuo' && q.state === 1, 'one of five left: that is the rout of before, not an orderly withdrawal');
    clear();
    const q2 = squad(0, mid, 0); C.run(8); const e2 = foe(mid + 250, 0); for (const m of live(q2)) know(m, e2, 2); q2.men[1].dead = q2.men[2].dead = q2.men[3].dead = true;
    q2.men[0].hitT = S.t; const L2 = live(q2)[0], a0 = Math.hypot(L2.x - e2.x, L2.z - e2.z); C.run(1.1); const id2 = q2.dr && q2.dr.id; C.run(30);
    const a1 = Math.min(...live(q2).map(m => Math.hypot(m.x - e2.x, m.z - e2.z)));
    ok(id2 === 'recuo' && a1 > a0 + 60 && !q2.state, 'two of five left in contact: back in order by bounds (' + Math.round(a0) + ' -> ' + Math.round(a1) + ' m from the enemy), not routed');
    void p0;
  }
}

console.log('-- sniper and aircraft --');
{
  const { C, $, S, mid, at, squad, know, live, took, clear } = box(31, 'ww2');
  {
    const q = squad(0, mid, 0); C.run(4); const p = at(mid + 500, 40), s = C.addMan(Object.keys($('KITS')).find(k => $('KITS')[k].snp && $('KITS')[k].side === S.fac[1] && $('KITS')[k].era === 'ww2'), 1, p.x, p.z, 0); s.ai = null; s.inv = 1e9;
    for (const m of live(q)) know(m, s, 2); C.run(1.1); const id = q.dr && q.dr.id; C.run(10);
    const ey = s.y + 1.6, inSight = live(q).filter(m => $('los')(s, ey, m, $('bodyY')(m)) && !$('smoked')(s.x, ey, s.z, m.x, $('bodyY')(m), m.z)).length;
    ok(id === 'atirador' && inSight <= 1, 'a sniper made out at 500 m: down and out of his line (' + inSight + ' of ' + live(q).length + ' still in it)');
    clear();
  }
  {
    const q = squad(0, mid, 0); C.run(4); const L = live(q)[0], P = C.dispatch(1, { why: 't' }, () => C.addPlane(S.E.sides[S.fac[1]].fighter, 1, L.x + 700, 300, L.z, Math.PI, true));
    if (P) { P.inv = 1e9; for (const m of live(q)) know(m, P, 2); }
    C.run(1.1); const id = q.dr && q.dr.id; C.run(15);
    const l = live(q), hid = l.filter(m => m.cbin || m.fc || $('kindAt')(m.x, m.z) === 1).length, apart = l.every(m => l.every(n => n === m || Math.hypot(n.x - m.x, n.z - m.z) > 6));
    ok(!!P && id === 'aereo' && (hid >= l.length - 1 || apart), 'an aircraft made out: ' + hid + ' of ' + l.length + ' under cover' + (apart ? ', the rest apart' : ''));
    clear();
  }
}

console.log('-- movement: bounds in the open, behind a friendly tank, a halt, a mine --');
{
  const { C, $, S, mid, at, squad, tank, know, live, took, clear } = box(41, 'ww2');
  {
    const q = squad(0, mid - 400, 0, null, { k: 'move', s: mid + 200, x: at(mid + 200).x, z: at(mid + 200).z }); C.run(3);
    const e = (() => { const p = at(mid + 300, 60), m = C.addMan($('INF').ww2[S.fac[1]][0], 1, p.x, p.z, 0); m.ai = null; m.inv = 1e9; return m; })();
    let moving = 0, n = 0, both = 0;
    C.run(40, () => { for (const m of live(q)) if (!m.dead) know(m, e, 1); if (q.dr && q.dr.id === 'lances') { n++; const mv = t => live(q).filter(m => (m.ai.i & 1) === t && Math.hypot(m.v.x, m.v.z) > 1.5).length; if (mv(q.dr.t ^ 1) > 1) both++; moving = Math.max(moving, mv(q.dr.t)); } });
    ok(took(q, 'lances') && n > 60 && both < n * .2 && moving >= 2, 'in the open with the enemy believed 600 m off: by bounds, the covering team still ' + (100 - 100 * both / (n || 1)).toFixed(0) + '% of the time');
    clear();
  }
  {
    const q = squad(0, mid + 200, 0, null, { k: 'assault', s: mid - 600, x: at(mid - 600).x, z: at(mid - 600).z }), u = tank(0, mid + 190); u.inv = 1e9; let s = u.s;
    C.__walk = () => { s -= 2.5 / 60; const p = $('routeAt')(S.T.routes[0], s); Object.assign(u, { s, x: p.x, z: p.z, h: Math.atan2(p.dz, -p.dx) }); u.y = C.hgt(p.x, p.z); u.v = { x: -p.dx * 2.5, y: 0, z: -p.dz * 2.5 }; };   // at the infantry's pace, before the minds look
    $('mindStep = (f => dt => { if (__walk) __walk(); f(dt); })(mindStep)'); C.run(25); C.__walk = null;
    const fx = Math.cos(u.h), fz = -Math.sin(u.h), l = live(q), behind = l.filter(m => ((m.x - u.x) * fx + (m.z - u.z) * fz) < 0 && Math.hypot(m.x - u.x, m.z - u.z) < 30).length;
    ok(took(q, 'com-carro') && behind >= l.length - 1, 'with a tank of its side moving its way: ' + behind + ' of ' + l.length + ' walk behind it');
    clear();
  }
  {
    const q = squad(0, mid, 0, null, { k: 'move', s: mid, x: at(mid).x, z: at(mid).z }), l = live(q), mid0 = () => ({ x: l.reduce((a, m) => a + m.x, 0) / l.length, z: l.reduce((a, m) => a + m.z, 0) / l.length });
    let out = 0; C.run(20, () => { if (q.dr && q.dr.id === 'perimetro') { const c = mid0(); out = Math.max(out, l.filter(m => m.f && ((m.x - c.x) * m.f.x + (m.z - c.z) * m.f.z) > 0).length); } });
    const c = mid0(), ang = l.map(m => Math.atan2(m.z - c.z, m.x - c.x)).sort((a, b) => a - b);
    let gap = 0; for (let i = 0; i < ang.length; i++) gap = Math.max(gap, ((ang[(i + 1) % ang.length] - ang[i]) + Math.PI * 2) % (Math.PI * 2) || Math.PI * 2);
    ok(took(q, 'perimetro') && gap < Math.PI * .9 && out >= l.length - 1, 'halted at the end of its walk with nothing near: a ring all round that it keeps (widest gap ' + (gap * 180 / Math.PI).toFixed(0) + ' deg), ' + out + ' of ' + l.length + ' facing out as it formed');
    const h = q.drH.find(h => h[0] === 'perimetro');
    ok(!(q.dr && q.dr.id === 'perimetro') && h && h[2] - h[1] < 15, 'the ring formed, the perimeter is over (from ' + (h && h[1]) + ' s to ' + (h && h[2]) + ' s), not held to its ' + $('drOf')('perimetro').max + ' s');
    C.run(130);
    ok(q.at && S.drN.all[0].perimetro === 1 && !(q.dr && q.dr.id === 'perimetro'), 'still halted 130 s on: the perimeter taken once for the halt (' + S.drN.all[0].perimetro + ')');
    clear();
  }
  {
    const q = squad(0, mid - 300, 0, null, { k: 'move', s: mid + 600, x: at(mid + 600).x, z: at(mid + 600).z }); C.run(2); q.rd = { st: 'call', sP: q.ts, T: S.t + 999 };   // waiting at the meeting place for its ride
    C.run(25); const R = q.drPer, l = live(q), ring = () => l.filter(m => R && R.p[m.ai.i] && $('hdist')(m, R.p[m.ai.i]) < 2.5).length;
    const n0 = ring(), ended = !(q.dr && q.dr.id === 'perimetro') && took(q, 'perimetro'); C.run(40); const n1 = ring();
    q.rd = null; const col = l.filter(m => R && R.p[m.ai.i] && $('hdist')($('slot')(q, m.ai.i), R.p[m.ai.i]) > .1).length;
    ok(ended && n0 >= l.length - 1 && n1 >= l.length - 1 && col === l.length, 'waiting for its ride: the ring formed, the drill over, ' + n1 + ' of ' + l.length + ' still in their ring places 40 s on; the ride gone, ' + col + ' back to the column\'s places');
    clear();
  }
  {
    const q = squad(0, mid, 0, null, { k: 'move', s: mid, x: at(mid).x, z: at(mid).z }); q.at = true;
    const t0 = $('lodTier')(q); q.dr = { id: 'perimetro' }; const t1 = $('lodTier')(q); q.dr = { id: 'artilharia' }; const t2 = $('lodTier')(q); q.dr = null;
    ok(t0 > 0 && t1 === t0 && t2 === 0, 'a far, quiet squad: its pace (LOD tier ' + t0 + ') kept in the perimeter (' + t1 + '), the usual pace under shells (' + t2 + ')');
    clear();
  }
  {
    const q = squad(0, mid - 120, 0, null, { k: 'move', s: mid + 300, x: at(mid + 300).x, z: at(mid + 300).z }); C.run(14);
    const L = live(q)[0], back0 = L.ai.trl && L.ai.trl.length;
    $('mineAdd')(900, 1, 1, L.x + 4, L.z, 0, true); $('mineBoom')($('S').mines[$('S').mines.length - 1], null, true);
    C.run(1.5, () => q.dr ? false : undefined); const id = q.dr && q.dr.id, p0 = live(q).map(m => ({ x: m.x, z: m.z })); C.run(1.5);
    const still = live(q).every((m, i) => Math.hypot(m.x - p0[i].x, m.z - p0[i].z) < 2.5); C.run(15);
    const back = live(q).filter((m, i) => Math.hypot(m.x - p0[i].x, m.z - p0[i].z) > 8).length, sus = $('sus')(0).some(s => Math.hypot(s.x - L.x, s.z - L.z) < 20);
    ok(id === 'mina' && still && back >= live(q).length - 1 && sus && back0 > 0, 'a mine goes off by them: still (' + still + '), then back along their own track (' + back + ' of ' + live(q).length + ' moved back), the place marked suspect for the sappers (' + sus + ', drill ' + id + ')');
    clear();
  }
}

console.log('-- fire control: ammunition, enemy smoke, friendly fire --');
{
  const { C, $, S, mid, at, squad, know, live, took, clear } = box(51, 'ww2');
  {
    const q = squad(0, mid, 0); C.run(4); const e = (() => { const p = at(mid + 200, 0), m = C.addMan($('INF').ww2[S.fac[1]][0], 1, p.x, p.z, 0); m.ai = null; m.inv = 1e9; return m; })();
    for (const m of live(q)) { m.arms[0].res = 0; m.arms[0].mag = Math.ceil(m.arms[0].d.mag / 2); }
    const shots = () => live(q).reduce((a, m) => a + (m.arms[0].d.mag - m.arms[0].mag), 0);
    C.run(12, () => { for (const m of live(q)) know(m, e, 2); }); const n1 = shots(); const id = took(q, 'municao');
    ok(id && (S.rep[0] || []).some(r => r.k === 'need' && r.data && r.data.k === 'ammo'), 'under a quarter of its rounds in contact: single rounds and a report that it needs ammunition (' + n1 + ' rounds in 12 s)');
    clear();
  }
  {
    const q = squad(0, mid, 0); C.run(4); const L = live(q)[0], e = (() => { const p = at(mid + 320, 0), m = C.addMan($('INF').ww2[S.fac[1]][0], 1, p.x, p.z, 0); m.ai = null; m.inv = 1e9; return m; })();
    for (const m of live(q)) know(m, e, 1); const sp = at(mid + 220, 0); $('addSmoke')(sp.x, C.hgt(sp.x, sp.z), sp.z);
    C.run(1.1); const id = q.dr && q.dr.id; let fired = 0, aimed = 0;
    C.run(6, () => { for (const m of live(q)) if (m.ctl.fire) fired++; aimed = live(q).filter(m => m.ctl.aim && (m.ctl.aim.x * (sp.x - m.x) + m.ctl.aim.z * (sp.z - m.z)) / Math.hypot(sp.x - m.x, sp.z - m.z) > .9).length; });
    const R = S.help && S.help.l.find(R => R.by === q && R.k === 'arty');
    ok(id === 'fumaca' && aimed >= live(q).length - 1 && fired > 0 && !!R, 'smoke goes up between it and the enemy it believes: weapons on the smoke (' + aimed + '), fire into it, and indirect fire called on it');
    clear();
  }
  {
    const q = squad(0, mid, 0), q2 = squad(0, mid + 150, 0); C.run(4); const by = live(q2)[0];
    $('FF').on = 1; $('impact')(live(q)[1], $('HK').bullet, 4, by, 0, 0, 0);
    C.run(1.1); const id = q.dr && q.dr.id; let f = 0; C.run(3, () => { for (const m of live(q)) if (m.ctl.fire) f++; });
    ok(id === 'fogo-amigo' && f === 0 && by.ffQ > S.t && S.glog.l[0].some(e => /Fogo amigo/.test(e.s)), 'hit by a friend: cease fire, the shooter told to hold, signal and report');
    $('FF').on = 0;
  }
}

console.log('-- honesty: only what the squad perceived --');
{
  const { C, $, S, mid, squad, tank, live } = box(61, 'ww2');
  const q = squad(0, mid, 0, NOAT.ww2), u = tank(1, mid + 380); still(u);
  for (const m of live(q)) { m.pm = new Map(); }
  let any = false; C.run(1); $('PERC').base = 0; $('HEAR').mv.tank = 0; C.run(10, () => { for (const m of live(q)) if (m.pm) m.pm.delete(u); if (q.dr) any = true; });
  ok(!any, 'a tank the squad cannot make out (no sight, no sound) sets nothing off, 380 m away in the open');
  const far = { x: live(q)[0].x + $('DRILL').inf.art.hear + 40, z: live(q)[0].z }; $('explode')(far.x, C.hgt(far.x, far.z) + .5, far.z, 12, 0, null, 1, true); C.run(2);
  ok(!(q.dr && q.dr.id === 'artilharia') && !(q.drB || []).length, 'a burst beyond hearing of every man (' + ($('DRILL').inf.art.hear + 40) + ' m) is not one it reacts to');
}
if (SECS) for (const era of ['ww2', 'modern']) {
  const C = H.load({ seed: 9, mapv: 4 }), $ = C.$, S = C.newState(era, null, { watch: 1 });
  const bad = [], seen = {}; let n = 0;
  C.$('drRun = (f => (o, p) => { __chk(o, p); return f(o, p); })(drRun)'); C.__chk = (o, p) => {
    if (o.dr && o.dr.id === p.D.id) return;
    n++; seen[p.D.id] = (seen[p.D.id] || 0) + 1; const f = typeof p.f === 'object' ? p.f : {};
    if (f.of && !(o.bel && o.bel.has(f.of))) bad.push(p.D.id + ': ' + (f.of.kind || (f.of.man ? 'man' : 'plane')) + ' not believed');
    if (p.D.id === 'artilharia' && !(o.drB || []).length) bad.push('artilharia without a burst');
  };
  C.run(SECS);
  ok(n > 0 && !bad.length && !H.nan(S), era + ': AI battle of ' + SECS + ' s: ' + n + ' drills taken ' + JSON.stringify(seen) + ', every one from what the squad believed' + (bad.length ? ' (' + bad.slice(0, 3).join('; ') + ')' : ''));
}

console.log('-- the review and the cost --');
{
  const C = H.load({ seed: 5, ana: true }), $ = C.$, S = C.watch('ww2', {}); C.run(70);
  const ev = $('ANA').ev, sn = ev.filter(e => e.k === 'sn' && e.dr), R = $('anaReport')(ev), tot = [0, 1].map(s => Object.values(R.drills[s] || {}).reduce((a, b) => a + b, 0));
  const all = [0, 1].map(s => Object.values(S.drN ? S.drN.all[s] : {}).reduce((a, b) => a + b, 0));
  ok(sn.length > 0 && tot[0] + tot[1] > 0 && tot[0] <= all[0] && tot[1] <= all[1], 'the snapshots carry the drills each side took and the review adds them up (' + JSON.stringify(R.drills) + ')');
  ok(R.drills[1] === null || $('anaReport')(ev, 0).drills[1] === null, 'a side\'s view of a match on keeps the other side\'s drills out');
}
if (SECS) {
  const cost = on => { const C = H.load({ seed: 5, mapv: 4 }); C.performance = require('perf_hooks').performance; C.$('DRILL').on = on; C.newState('ww2', null, { watch: 1 }); C.run(Math.min(SECS, 90)); return C.$('AIB').stat(); };
  const a = cost(0), b = cost(1);
  console.log('  AI ms a frame, without the drills: mean ' + a.avg + ', worst ' + a.worst + '; with them: mean ' + b.avg + ', worst ' + b.worst);
  ok(b.avg <= a.avg * 1.25 + .1, 'the drills cost little of the AI\'s frame (mean ' + a.avg + ' -> ' + b.avg + ' ms)');
}
H.done();
