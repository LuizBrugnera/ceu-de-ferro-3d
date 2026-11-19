'use strict';
/* Hulls ramming buildings and objects (RAM, cf-tanque-casa): a tank at speed breaks into a house and drives on through it, slowly it breaks
   nothing; a light hull (car, truck) crashes into a house and bounces, losing hp, but opens a barn's wall (shed) and knocks a pole down; a big
   building (row, block) takes holes from a tank and is not driven through; a soldier on the ground storey by the blow is hurt. ww2, seed 5.
   PAGE=<page> as the other suites */
const { load, ok, done, nan } = require('./harness');
const C = load({ seed: 5 }), $ = C.$, CITY = $('CITY'), RAM = $('RAM'), GSPD = $('GSPD');
const TK = $('TANKS'), tiger = Object.keys(TK).find(k => /tiger/i.test(k)) || Object.keys(TK).find(k => TK[k].era === 'ww2');
let S, T;
const broken = o => { let n = 0; for (let e = 0; e < o.B.n; e++) if (S.cbs[o.B.off + e] >= 2) n++; return n; };
const cracked = o => { let n = 0; for (let e = 0; e < o.B.n; e++) if (S.cbs[o.B.off + e] >= 1) n++; return n; };
/* a building of type bt with a clear run-up of 45 m (no other building on the line), and hull kind/id driven at it from there */
function ram(bt, kind, id, o2) {
  o2 = o2 || {}; S = C.sandbox('ww2'); T = S.T;
  for (const o of T.houses.filter(o => o.B.t === bt)) for (let a = 0; a < 16; a++) {
    const ux = Math.cos(a * Math.PI / 8), uz = Math.sin(a * Math.PI / 8), L = Math.max(o.hw, o.hd) + (o2.L || 40), sx = o.x - ux * L, sz = o.z - uz * L;
    let clear = true; for (let d = Math.max(o.hw, o.hd) + 4; d <= L; d += 2.5) { const x = o.x - ux * d, z = o.z - uz * d; if ($('near')(x, z, 5).some(q => q !== o && q.B)) { clear = false; break; } }
    if (!clear || C.hgt(sx, sz) < T.WL + 1 || Math.abs(C.hgt(sx, sz) - C.hgt(o.x, o.z)) > 4) continue;
    S.units = []; S.men = [];
    const u = $('addVehicle')(kind, id, 0, sx, sz, Math.atan2(-uz, ux)), hp0 = u.hp, ahead = () => (u.x - o.x) * ux + (u.z - o.z) * uz;
    const m = o2.man ? C.addMan($('INF').ww2[S.fac[0]][0], 0, o.x - ux * (Math.max(o.hw, o.hd) - 2.5), o.z - uz * (Math.max(o.hw, o.hd) - 2.5), 0) : null;
    if (m) { m.ai = null; m.y = $('manY')(m.x, m.z); }
    const mh0 = m ? m.hp : 0;
    let inside = 0, vin = 0, past = false;
    if (process.env.DBG) { C.__cb = (r, d) => console.log('   blow r', r.toFixed(1), 'dmg', d.toFixed(1), 'v', (Math.abs(u.sp) * GSPD).toFixed(1)); C.$('cityBlast = (g => (x, y, z, r, dmg, by, rx) => { __cb(r * CITY.dmg.r, dmg * CITY.dmg.k); return g(x, y, z, r, dmg, by, rx); })(cityBlast)'); }
    C.run(o2.T || 20, () => { u.ctl.drive = 1; if (o2.slow) u.sp = Math.min(u.sp, o2.slow / GSPD); if ($('footD')(o, u.x, u.z) < .5) { inside++; vin = Math.max(vin, Math.abs(u.sp) * GSPD); } if (ahead() > Math.max(o.hw, o.hd) + 3) past = true; return !u.dead && !past; });
    return { o, u, hp0, inside, vin, past, top: u.def.spd * GSPD, m, mh0, br: broken(o), cr: cracked(o), st: S.os[o.id] };
  }
  return null;
}

console.log('-- a tank --');
{
  const r = ram('house', 'tank', tiger);
  ok(!!r, 'a house with a clear run-up');
  ok(r.br > 0 && r.st >= 1, 'at speed it breaks into the house (' + r.br + ' elements broken, stage ' + r.st + ')');
  ok(r.past && r.inside > 0 && r.vin <= r.top * RAM.thru + 1, 'and drives on through it, creeping inside (' + r.vin.toFixed(1) + ' m/s at most, top ' + r.top.toFixed(1) + ')');
  ok(r.u.hp < r.hp0 && r.u.hp > r.hp0 * .8, 'paying a little of its hp (' + Math.round(r.hp0) + ' -> ' + Math.round(r.u.hp) + ')');
  const s = ram('house', 'tank', tiger, { slow: RAM.v[0] * .8, T: 15 });
  ok(s && s.cr === 0 && !s.past, 'under ' + RAM.v[0] + ' m/s it is no blow: nothing breaks and it does not get in');
  const b = ram('block', 'tank', tiger, { T: 15, L: 25 }) || ram('row', 'tank', tiger, { T: 15, L: 25 }) || ram('hall', 'tank', tiger, { T: 15, L: 25 });
  ok(b && b.br > 0 && !b.past, 'a big building (' + (b && b.o.B.t) + '): holes in its walls (' + (b && b.br) + '), not driven through');
  const w = ram('house', 'tank', tiger, { man: 1 });
  ok(w && w.m && w.m.hp < w.mh0, 'a soldier on the ground storey by the blow is hurt (' + (w && w.m ? Math.round(w.mh0) + ' -> ' + Math.round(w.m.hp) : '-') + ')');
}

console.log('-- light hulls --');
{
  const c = ram('house', 'car', 'kubel');
  ok(c && c.br === 0 && !c.past && c.u.hp < c.hp0 && c.u.hp > 0, 'a car at speed into a house crashes: the wall stands, it bounces and loses hp (' + (c && Math.round(c.hp0) + ' -> ' + Math.round(c.u.hp)) + ')');
  const k = ram('house', 'truck', 'opel'); let n = 1;
  if (k) for (; n < 4 && !k.u.dead; n++) { const L = Math.max(k.o.hw, k.o.hd) + 40, ux = (k.o.x - k.u.x), uz = (k.o.z - k.u.z), d = Math.hypot(ux, uz) || 1; k.u.x = k.o.x - ux / d * L; k.u.z = k.o.z - uz / d * L; k.u.sp = 0; k.u.y = C.hgt(k.u.x, k.u.z); C.run(10, () => { k.u.ctl.drive = 1; return !k.u.dead; }); }
  ok(k && !k.u.dead && k.u.hp < k.hp0, 'a truck driven at a house four times at speed: dented, not destroyed (' + (k && Math.round(k.hp0) + ' -> ' + Math.round(k.u.hp)) + '; crash ' + RAM.crash + ', was .25: the AI\'s trucks driven through towns died of a few such blows)');
  const b = ram('barn', 'car', 'kubel');
  ok(b && b.br > 0, 'into a barn (shed) it opens the wall (' + (b && b.br) + ' elements broken)');
  const t = ram('barn', 'truck', 'opel');
  ok(t && t.br > 0, 'a truck too (' + (t && t.br) + ')');
  const s = ram('barn', 'car', 'kubel', { slow: RAM.v[0] * .8, T: 12 });
  ok(s && s.cr === 0, 'slowly, nothing');
}

console.log('-- a pole --');
{
  S = C.sandbox('ww2'); T = S.T;
  const pole = $('near')(S.base[0].x, S.base[0].z, 500).find(o => o.K === $('OBJ').pole);   // the base's flag pole
  ok(!!pole, 'a pole by a road');
  if (pole) {
    let a = 0; for (; a < 16; a++) { const ux = Math.cos(a * Math.PI / 8), uz = Math.sin(a * Math.PI / 8); let c = true; for (let d = 3; d <= 35; d += 2) if ($('near')(pole.x - ux * d, pole.z - uz * d, 4).some(q => q !== pole && !(q.K && q.K.crush))) { c = false; break; } if (c) break; }
    const ux = Math.cos(a * Math.PI / 8), uz = Math.sin(a * Math.PI / 8); S.units = []; const u = $('addVehicle')('car', 'kubel', 0, pole.x - ux * 35, pole.z - uz * 35, Math.atan2(-uz, ux));
    C.run(6, () => { u.ctl.drive = 1; return S.os[pole.id] < 2; });
    ok(S.os[pole.id] >= 1 && !u.dead, 'a car drives a pole down (stage ' + S.os[pole.id] + ')');
  }
}
ok(nan(S) === null, 'no NaN');
done();
