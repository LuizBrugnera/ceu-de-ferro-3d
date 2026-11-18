'use strict';
/* Buildings (CITY): the plan, what a wall stops and lets through, damage by weapon, what falls and when, soldiers indoors, the AI's use of
   them. PAGE=<page> as the other suites. */
const { load, ok, done } = require('./harness');
const C0 = load({ seed: 5 }), $ = C0.$, C = new Proxy(C0, { get: (t, k) => (k in t ? t[k] : t.$(String(k))) }), CITY = $('CITY'), bWorld = $('bWorld'), manY = $('manY'), manBrain = $('manBrain');
let S, T;
const fresh = era => { S = C.sandbox(era); T = S.T; };
const wx = (B, L, j, i) => (L * B.nz + j) * (B.nx + 1) + i, wz = (B, L, j, i) => B.oZ + (L * (B.nz + 1) + j) * B.nx + i, sl = (B, L, j, i) => B.oS + ((L - 1) * B.nz + j) * B.nx + i;
const st = (o, e) => S.cbs[o.B.off + e], W = (o, x, y, z) => bWorld(o, x, y, z, {});
const pickB = (t, f) => T.houses.filter(o => o.B.t === t && (!f || f(o))).sort((a, b) => Math.hypot(a.x - T.towns[0].x, a.z - T.towns[0].z) - Math.hypot(b.x - T.towns[0].x, b.z - T.towns[0].z))[0];
const man = (team, x, z, ai) => { const m = C.addMan($('INF')[S.era][S.fac[team]][0], team, x, z, 0); if (ai) { m.ai = manBrain(0); m.ai.gx = x; m.ai.gz = z; } return m; };

console.log('-- the plan --');
for (const era of ['ww2', 'modern']) {
  fresh(era);
  const H = T.houses, by = {}; for (const o of H) by[o.B.t] = (by[o.B.t] || 0) + 1;
  console.log('   ' + era + ': ' + H.length + ' buildings, ' + T.bn + ' elements (' + (T.bn * 3 / 1024).toFixed(0) + ' kB of state and kinds), ' + JSON.stringify(by) + '; ' + T.burgs.map(b => b.k[0] + H.filter(o => Math.hypot(o.x - b.x, o.z - b.z) < b.ru + 40).length).join(' '));
  ok(H.length > 250 && H.every((o, i) => o.id === T.bid + i && T.byId[o.id] === o && o.id < T.nid) && T.burgs.filter(b => b.k === 'village').every(b => H.some(o => Math.hypot(o.x - b.x, o.z - b.z) < b.ru)), era + ': towns, villages and hamlets, ids in a row after the works');
  ok(H.every(o => C.routeDist(T, o.x, o.z) > CITY.plan.road && o.y > T.WL + 3), era + ': no building on a road or in the water');
  let bad = 0; for (const r of T.routes) for (let s = 0; s < r.len; s += 6) { const p = C.routeAt(r, s); for (const o of C.near(p.x, p.z, 9)) if (o.B && C.footD(o, p.x, p.z) < 9) bad++; }
  ok(!bad, era + ': nothing built within 9 m of the middle of a road (' + bad + ')');
  ok(['church', 'tower'].every(t => by[t] === 2) && (era === 'ww2' || by.apart > 5), era + ': a church and a tower a town' + (era === 'ww2' ? '' : ', mid-rise blocks today'));
  const C2 = load({ seed: 9 }); C2.sandbox(era); const H2 = C2.$('S').T.houses;
  ok(H2.length === H.length && H2.every((o, i) => o.x === H[i].x && o.z === H[i].z && o.B.n === H[i].B.n && o.B.kd.every((k, e) => k === H[i].B.kd[e])), era + ': the same plan on another client');
}

console.log('-- what a wall stops and what an opening lets through --');
{
  fresh('ww2');
  const o = pickB('block', o => o.B.nl >= 3 && o.B.nx >= 4), B = o.B, sh = B.sh, iw = [0, 1, 2, 3].find(i => B.kd[wz(B, 1, 0, i)] === 2), is = B.kd.findIndex((k, e) => k === 1 && e >= B.oZ && e < B.oZ + B.nx), eW = wz(B, 1, 0, iw);
  const line = (i, L, v) => { const a = W(o, (i + .5) * B.bw, (L + v) * sh, -7), b = W(o, (i + .5) * B.bw, (L + v) * sh, B.bd * .5); return C.walled(a.x, a.y, a.z, b.x, b.y, b.z); };
  ok(!line(iw, 1, .55) && line(iw, 1, .15) && line(iw, 1, .92), 'a window: sight through the opening, none under its sill or over its top');
  const es = is >= 0 ? is : wz(B, 1, 0, B.sx), i0 = (es - B.oZ) % B.nx, L0 = ((es - B.oZ) / ((B.nz + 1) * B.nx)) | 0;
  S.cbs[B.off + es] = 0; const k0 = B.kd[es]; B.kd[es] = 1;
  ok(line(i0, L0, .2) && line(i0, L0, .55) && line(i0, L0, .9), 'a solid segment hides at every height');
  C.bDmg(o, es, 19, null);
  ok(st(o, es) === 2 && !line(i0, L0, .3) && line(i0, L0, .9), 'holed by one hit of 19: open up to the top of the hole, shut above it');
  C.bDmg(o, es, 30, null);
  ok(st(o, es) === 3 && !line(i0, L0, .9), 'gone after another: open');
  B.kd[es] = k0;
  /* rounds: a rifle bullet through a window reaches the man inside, one at the wall beside it does not */
  const fire = (i, v, sa) => { const a = W(o, (i + .5) * B.bw, (1 + v) * sh, -30), d = W(o, (i + .5) * B.bw, (1 + v) * sh, 0), L = Math.hypot(d.x - a.x, d.z - a.z); S.bullets.push({ x: a.x, y: a.y, z: a.z, vx: (d.x - a.x) / L * 800, vy: 0, vz: (d.z - a.z) / L * 800, life: 1, team: 1, dmg: 12, ap: 0, sa, by: null, tr: 0 }); C.run(.3); };
  const m = man(0, 0, 0), p = W(o, (iw + .5) * B.bw, sh, 2.2); Object.assign(m, { x: p.x, z: p.z, y: p.y, cbo: o, cbl: 1, cbh: sh, cby: p.y, cbin: true, cbpx: p.x, cbpz: p.z });
  m.hp = m.max = 1e4; C.run(.1); const h0 = m.hp; fire(iw, .6, 1); const h1 = m.hp; m.hp = h0; m.bl = 0;   // the wound bleeds (DMG.man.bleed): stanch it so the hp left reads the second round alone
  const jw = [0, 1, 2, 3, 4].find(i => i < B.nx && B.kd[wz(B, 1, 0, i)] === 2 && i !== iw);
  S.cbh[B.off + eW] = 255; fire(iw, .1, 1);
  if (process.env.DBG) console.log(h0, h1, m.hp, m.y - o.y, sh, m.cbl, m.cbin, st(o, eW));
  ok(h1 < h0 && m.hp === h0 && Math.abs(m.y - (o.y + sh)) < .05, 'a bullet through the window hits the soldier behind it on the first floor (' + (h0 - h1).toFixed(1) + '), one under the sill stops in the wall');
  ok(st(o, eW) === 1, 'a small arm breaks the glass and nothing else (state ' + st(o, eW) + ')');
  m.dead = m.gone = true; C.run(.05);
}

console.log('-- damage: hits to hole a wall segment and to take it away --');
{
  fresh('modern');
  const OBJD = $('OBJD'), A = $('ARMS'), SA = $('SARMS'), TK = $('TANKS');
  const o = pickB('block', o => o.B.nl >= 3), B = o.B, e = wz(B, 1, 0, 1), max = C.bldHp(B, e);
  const count = dmg => { let a = 0, b = 0; S.cbs[B.off + e] = 0; S.cbh[B.off + e] = max; C.seed(4); for (let n = 1; n <= 4000 && S.cbs[B.off + e] < 3; n++) { C.bDmg(o, e, dmg, null); if (!a && S.cbs[B.off + e] >= 2) a = n; b = n; } S.cbfall.clear(); return [a || b, b]; };
  const rows = [['75 mm M3', 42 * OBJD.shell.hit], ['8,8 cm KwK 36', 56 * OBJD.shell.hit], ['120 mm M256', A.ap.dmg * OBJD.shell.hit], ['105 mm HE, direct', A.he44.hit * OBJD.he.hit], ['155 mm HE, direct', A.he.hit * OBJD.he.hit],
    ['Panzerfaust', SA.pzf.dmg * OBJD.heat.hit], ['RPG-7', SA.rpg.dmg * OBJD.heat.hit], ['CIWS 30 mm', A.ciws.dmg * (OBJD.gun[0] + OBJD.gun[1] * A.ciws.ap) * CITY.dmg.gun], ['GAU-8', 14 * (OBJD.gun[0] + OBJD.gun[1]) * CITY.dmg.gun], ['M2 .50', A.mg.dmg * OBJD.gun[0] * CITY.dmg.gun], ['demolition charge', $('BLD').charge.dmg]];
  const need = {}; for (const [k, d] of rows) { need[k] = count(d); console.log('   ' + k.padEnd(20) + d.toFixed(2).padStart(7) + ' a hit: holed after ' + String(need[k][0]).padStart(4) + ', gone after ' + String(need[k][1]).padStart(4) + '   (brick, ' + max / 4 + ' hp)'); }
  ok(need['120 mm M256'][1] === 1 && need['75 mm M3'][0] === 1 && need['75 mm M3'][1] === 2 && need['RPG-7'][0] === 1 && need['demolition charge'][1] === 1, 'a tank shell or a rocket opens a wall at once, a heavy one takes the segment');
  ok(need['CIWS 30 mm'][0] > 15 && need['CIWS 30 mm'][0] < 120 && need['M2 .50'][0] > 60, 'an autocannon chews it down, a machine gun needs a belt');
  S.cbs[B.off + e] = 0; S.cbh[B.off + e] = max;
  const burst = (name, w, d) => { const s0 = S.cbs.slice(B.off, B.off + B.n), p = W(o, B.nx * B.bw * .5, 2, -d); C.explode(p.x, p.y, p.z, w.r, w.dmg, null, -1, true, 1); let h = 0, g = 0, c = 0; for (let k = 0; k < B.oR; k++) { const v = S.cbs[B.off + k]; if (v === 3) g++; else if (v === 2) h++; else if (v === 1) c++; } console.log('   ' + name.padEnd(28) + ' ' + d + ' m from the front: ' + g + ' gone, ' + h + ' holed, ' + c + ' cracked of ' + B.oR); S.cbs.set(s0, B.off); for (let k = 0; k < B.oR; k++) S.cbh[B.off + k] = C.bldHp(B, k); S.cbfall.clear(); S.os[o.id] = 0; return [g, h, c]; };
  const b1 = burst('155 mm HE (130, r 38)', { r: 38, dmg: 130 }, 2), b2 = burst('500 kg bomb (300, r 70)', { r: 70, dmg: 300 }, 2), b3 = burst('hand grenade', { r: 11, dmg: 60 * OBJD.nade.blast }, 1);
  ok(b1[0] + b1[1] >= 1 && b1[0] + b1[1] <= 10 && b1[2] > 0 && b2[0] > b1[0] + b1[1] + 8 && b3[0] + b3[1] === 0, 'a howitzer shell opens the wall it bursts at and cracks around it, a bomb takes a volume, a grenade nothing');
}

console.log('-- what falls --');
{
  fresh('ww2');
  const o = pickB('block', o => o.B.nl === 3 && o.B.nx >= 4), B = o.B, up = (L, j, i) => st(o, sl(B, L, j, i)) < 3;
  C.bDmg(o, wz(B, 0, 0, 0), 99, null); C.run(CITY.sup.T + 1);
  ok(st(o, wz(B, 0, 0, 0)) === 3 && up(1, 0, 0) && up(1, 0, 1) && !S.cbfall.size, 'one segment gone: nothing falls');
  const m = man(0, 0, 0), u = man(0, 0, 0), p = W(o, B.bw * 1.5, 0, B.bd * .5), q = W(o, B.bw * 1.5, B.sh, B.bd * .5);
  Object.assign(m, { x: p.x, z: p.z, y: p.y, cbo: o, cbl: 0, cbh: 0, cby: p.y, cbpx: p.x, cbpz: p.z }); Object.assign(u, { x: q.x, z: q.z, y: q.y, cbo: o, cbl: 1, cbh: B.sh, cby: q.y, cbpx: q.x, cbpz: q.z });
  C.bDmg(o, wz(B, 0, 0, 1), 99, null);
  ok(!!B.doom && up(1, 0, 1), 'the next one beside it: the bays that shared the post are doomed, and still up');
  const log = []; let n0 = S.cblog.length;
  C.run(CITY.sup.T + CITY.sup.step * 6, () => { if (S.cblog.length !== n0) { log.push(S.t.toFixed(2) + ':' + [1, 2, 3].map(L => (up(L, 0, 0) ? 1 : 0) + '' + (up(L, 0, 1) ? 1 : 0)).join('/')); n0 = S.cblog.length; } });
  console.log('   slabs over the two bays, storey by storey (t: 1st/2nd/roof): ' + log.join('  '));
  ok(![1, 2, 3].some(L => up(L, 0, 0) || up(L, 0, 1)) && log.length >= 3 && up(1, 0, 3) && S.os[o.id] === 1 && st(o, B.oR) > 0, 'they come down a storey at a time, the rest stands, rubble lies at the bottom');
  console.log('   the soldier under them: ' + (m.dead ? 'dead' : 'hp ' + m.hp.toFixed(0) + ' of ' + m.max) + '; the one on the first floor: ' + (u.dead ? 'dead' : 'hp ' + u.hp.toFixed(0) + ', now on storey ' + u.cbl));
  ok(m.dead && (u.dead || (u.hp < u.max && u.cbl === 0)), 'who stood under is killed, who stood on it falls with it');
  for (let i = 0; i < B.nx; i++) { C.bDmg(o, wz(B, 0, 0, i), 99, null); C.bDmg(o, wz(B, 0, B.nz, i), 99, null); }
  C.run(CITY.sup.T + 3);
  ok(S.os[o.id] === 2 && !S.cbfall.size && C.rubble(o.x, o.z) < 1, 'the ground storey gone on two sides: the whole building is a ruin');
  const a = W(o, B.nx * B.bw / 2, 4, -8), b = W(o, B.nx * B.bw / 2, 4, B.nz * B.bd + 8), c = W(o, B.nx * B.bw / 2, 1, -8), d = W(o, B.nx * B.bw / 2, 1, B.nz * B.bd + 8);
  ok(!C.walled(a.x, a.y, a.z, b.x, b.y, b.z) && C.walled(c.x, c.y, c.z, d.x, d.y, d.z), 'sight is open over the ruin and shut through its rubble');
}

console.log('-- soldiers indoors --');
{
  fresh('ww2');
  const o = pickB('block', o => o.B.nl >= 3 && o.B.nx >= 4), B = o.B, id = B.nx >> 1, R = $('MAN').r * $('MAN').sc;
  const walk = (m, tx, tz, secs) => C.run(secs, () => { const dx = tx - m.x, dz = tz - m.z, d = Math.hypot(dx, dz); m.ctl.mx = d > .2 ? dx / d : 0; m.ctl.mz = d > .2 ? dz / d : 0; return d > .25; });
  const is = [0, 1, 2, 3].find(i => i !== id && i < B.nx), p0 = W(o, (is + .5) * B.bw, 0, -6), p1 = W(o, (is + .5) * B.bw, 0, 3), m = man(0, p0.x, p0.z);
  B.kd[wz(B, 0, 0, is)] = 1; walk(m, p1.x, p1.z, 6);
  const l0 = (m.x - o.x) * o.s + (m.z - o.z) * o.c + o.hd;
  ok(l0 < -R + .02 && l0 > -R - .3, 'a soldier walking at a wall stops against it (' + (-l0).toFixed(2) + ' m out)');
  const d0 = W(o, (id + .5) * B.bw, 0, -6), d1 = W(o, (id + .5) * B.bw, 0, B.bd * .5); m.x = d0.x; m.z = d0.z; m.cbo = null; m.cbqT = 0;
  walk(m, d1.x, d1.z, 8);
  ok(m.cbo === o && m.cbin && Math.hypot(m.x - d1.x, m.z - d1.z) < .4 && Math.abs(m.y - o.y) < .1, 'through the door it walks in and stands on the floor');
  /* an AI soldier sent to a window of the top storey, then out again */
  const a = man(0, d0.x + 3, d0.z, true), ws = C.bldWins(o, 0, 0).filter(w => w.l === B.nl - 1), w = ws[0]; let stuck = 0, last = null, tUp = 0;
  a.ai.cbp = w; a.ai.cbpT = 1e9;
  C.run(60, () => { if (!tUp && a.cbl === w.l && Math.hypot(a.x - w.x, a.z - w.z) < .6) tUp = S.t; if (S.t % 1 < 1 / 60) { if (last && !tUp && Math.hypot(a.x - last.x, a.z - last.z) + Math.abs(a.y - last.y) < .15) stuck++; last = { x: a.x, y: a.y, z: a.z }; } return !tUp; });
  console.log('   an AI soldier from the street to a window of storey ' + w.l + ': ' + (tUp ? 'there after ' + tUp.toFixed(0) + ' s' : 'not there, on storey ' + a.cbl + ' bay ' + a.cbi + ',' + a.cbj + (a.cbz ? ' on the flight' : '')) + ', ' + stuck + ' s without moving, height ' + (a.y - o.y).toFixed(1) + ' m');
  ok(tUp > 0 && stuck < 3 && Math.abs(a.y - o.y - w.l * B.sh) < .1, 'it finds the door, the stairs and the window');


  a.ai.cbp = null; a.ai.gx = d0.x; a.ai.gz = d0.z - 0; let tOut = 0;
  C.run(60, () => { a.ai.think = 9; if (!a.cbo && !tOut) tOut = S.t; return !tOut; });
  ok(tOut > 0 && Math.abs(a.y - manY(a.x, a.z)) < .3, 'with nothing to do there it comes down and out (' + (tOut ? tOut.toFixed(0) + ' s' : 'still on storey ' + a.cbl) + ')');
}

console.log('-- the AI in buildings --');
for (const era of ['ww2', 'modern']) {
  C.seed(21); S = C.newState(era); T = S.T; S.over = false;
  const garr = () => S.squads.filter(q => q.job === 'garr'), cnt = () => { const l = garr().flatMap(q => q.men.filter(m => !m.dead)); return [l.length, l.filter(m => m.cbo && m.cbin).length, l.filter(m => m.cbl > 0).length, l.filter(m => { const sl = C.slot(m.sq, m.ai.i); return sl.b && Math.hypot(m.x - sl.x, m.z - sl.z) < 1 && m.cbl === sl.l; }).length]; };
  C.run(50); const n = cnt(), q = garr()[0], pts = q && q.pts;
  console.log('   ' + era + ': ' + garr().length + ' garrison squads, ' + n[0] + ' men: ' + n[1] + ' indoors, ' + n[2] + ' upstairs, ' + n[3] + ' at their window after 50 s');
  ok(garr().length >= 2 && n[1] >= n[0] * .6 && n[2] >= 2 && n[3] >= n[0] * .5, era + ': a garrison mans the windows of its buildings, on more than one storey');
  /* a man at his window sees and is seen through it only: an enemy in front of the window, another behind the building */
  const m = garr().flatMap(q => q.men).find(m => !m.dead && m.cbo && m.cbl > 0 && (() => { const sl = C.slot(m.sq, m.ai.i); return sl.b && Math.hypot(m.x - sl.x, m.z - sl.z) < 1; })());
  if (m) {
    const o = m.cbo, B = o.B, sl = C.slot(m.sq, m.ai.i), ey = m.y + $('STANCE')[1].eye * $('MAN').sc, px = sl.x - o.x, pz = sl.z - o.z, lx = px * o.c - pz * o.s + o.hw, lz = px * o.s + pz * o.c + o.hd; C.bAt(B, sl.e);
    const P = $('BP'), nx = P.f ? 0 : (P.i ? 1 : -1), nz = P.f ? (P.j ? 1 : -1) : 0, a = bWorld(o, lx + nx * 160, 0, lz + nz * 160, {}), b = bWorld(o, lx - nx * 60, .5, lz - nz * 60, {});
    const hitA = C.ray(sl.x, ey, sl.z, a.x, ey, a.z, 1), sa = hitA !== o, sb = C.ray(sl.x, ey, sl.z, b.x, b.y, b.z, 1) === o;
    ok(sa && sb, era + ': from its window on storey ' + m.cbl + ' its own walls do not hide what is level in front of it, and hide the ground behind the building');
  } else ok(false, era + ': a man upstairs at his window to look from');
  /* an occupied building, once its men are seen, is a target for a battery and for a tank with nothing else to shoot */
  const o = garr().flatMap(q => q.men).find(m => !m.dead && m.cbo && m.cbin).cbo, team = garr()[0].team;
  for (const m of S.men) if (m.cbo === o) m.seenT = S.t;
  C.run(.1); const all = []; C.bldTargets({ team: 1 - team }, all);
  const tk = Object.keys($('TANKS')).find(id => $('TANKS')[id].era === era && $('TANKS')[id].side === S.fac[1 - team]), front = bWorld(o, o.hw, 0, -150, {}), u = C.addVehicle('tank', tk, 1 - team, front.x, front.z, 0);
  for (const m of S.men) if (m.cbo === o) m.seenT = S.t;
  const tg = C.bldTarget(u, 1e9);
  ok(all.some(g => g.bld === o) && $('GAI').art.val.bld > 0 && (!tg || tg.kind === 'bld'), era + ': it is on the battery\'s list' + (tg ? ' and a tank 150 m away takes its wall for a target' : ' (the tank has no line to it)'));
  u.dead = u.gone = true;
}
done();
