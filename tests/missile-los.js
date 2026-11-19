'use strict';
/* guided missiles need the seeker's line (seekLine): no lock, no launch and no guidance through a hill, a building, a tree line or smoke,
   for the player and the AI alike, and a heat seeker that loses its target when the target ducks behind the ground in flight */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 41 }), $ = C.$;
const OBJ = $('OBJ'), MSL = $('MSL'), f1 = v => v.toFixed(1);
let S, T, B;
const fresh = () => { S = C.sandbox('modern'); T = S.T; B = S.base[0]; return S; };
const hdg = p => Math.atan2(-p.f.z, p.f.x);
/* the point k of the way from a to b, and the side step across that line */
const along = (a, b, k, side) => { const dx = b.x - a.x, dz = b.z - a.z, L = Math.hypot(dx, dz); return { x: a.x + dx * k - dz / L * (side || 0), z: a.z + dz * k + dx / L * (side || 0) }; };

/* the cover put up between a shooter and a target, on the target's side of the line (at d m short of it), and taken down again */
const COVER = {
  house(a, b, d) {
    const L = Math.hypot(b.x - a.x, b.z - a.z), p = along(a, b, 1 - d / L), o = C.addObj(T, T.fid++, 'house', p.x, p.z, 16, 16, 10, Math.atan2(-(b.z - a.z), b.x - a.x));
    const G = T.grid; $('cellsOf')(T, o, k => { (G.c[k] || (G.c[k] = [])).push(o); G.f[k] |= 3; });
    const w = [o.x - o.r, o.z - o.r, o.x + o.r, o.z + o.r]; T.walls.push(w); S.os[o.id] = 0; S.oh[o.id] = o.hp;
    return () => { T.objs.splice(T.objs.indexOf(o), 1); delete T.byId[o.id]; T.walls.splice(T.walls.indexOf(w), 1); $('cellsOf')(T, o, k => { G.c[k] = G.c[k].filter(q => q !== o); }); T.fid--; };
  },
  trees(a, b, d) {   // a tree line three deep across the line, crowns touching
    const L = Math.hypot(b.x - a.x, b.z - a.z), G = T.grid, l = [];
    for (let r = 0; r < 3; r++) for (let s = -36; s <= 36; s += 6) { const p = along(a, b, 1 - (d + r * 7) / L, s + (r % 2) * 3), o = $('woodTree')(T, p.x, p.z, 1); S.os[o.id] = 0; S.oh[o.id] = o.hp; l.push(o); }
    return () => { for (const o of l) { T.objs.splice(T.objs.indexOf(o), 1); delete T.byId[o.id]; $('cellsOf')(T, o, k => { G.c[k] = G.c[k].filter(q => q !== o); }); } T.fid -= l.length; };
  },
  rock(a, b, d) { return COVER.low(a, b, d, 'rock'); },
  bush(a, b, d) { return COVER.low(a, b, d, 'bush'); },
  low(a, b, d, k) {   // a row of rocks or bushes (#32's cover, OBJ.rock a wall, OBJ.bush a veil) 3 m high across the line, d m short of the target
    const L = Math.hypot(b.x - a.x, b.z - a.z), G = T.grid, l = [], w = [1e9, 1e9, -1e9, -1e9];
    for (let s = -12; s <= 12; s += 3) {
      const p = along(a, b, 1 - d / L, s), o = Object.assign(C.addObj(T, T.fid++, k, p.x, p.z, 0, 0, 3, 0, 2), { sc: 2 });
      $('cellsOf')(T, o, c => { (G.c[c] || (G.c[c] = [])).push(o); G.f[c] |= o.K.veil ? 1 : 3; }); S.os[o.id] = 0; S.oh[o.id] = o.hp; l.push(o);
      w[0] = Math.min(w[0], o.x - o.r); w[1] = Math.min(w[1], o.z - o.r); w[2] = Math.max(w[2], o.x + o.r); w[3] = Math.max(w[3], o.z + o.r);
    }
    T.walls.push(w);
    return () => { for (const o of l) { T.objs.splice(T.objs.indexOf(o), 1); delete T.byId[o.id]; $('cellsOf')(T, o, c => { G.c[c] = G.c[c].filter(q => q !== o); }); } T.walls.splice(T.walls.indexOf(w), 1); T.fid -= l.length; };
  },
  hill(a, b, d, top, w) {   // a ridge top m high (14) and some 4 w m across (w 20), square to the line
    const L = Math.hypot(b.x - a.x, b.z - a.z), p = along(a, b, 1 - d / L), ux = (b.x - a.x) / L, uz = (b.z - a.z) / L;
    C.H0 = $('hgt'); C.RIDGE = (x, z) => { const s = (x - p.x) * ux + (z - p.z) * uz; return (top || 14) * Math.exp(-(s * s) / (2 * (w || 20) * (w || 20))); };
    $('hgt = (x, z) => H0(x, z) + RIDGE(x, z)');
    return () => { $('hgt = H0'); };
  }
};
const KINDS = ['hill', 'house', 'trees'];

console.log('the seeker\'s line itself');
{
  fresh(); const a = { x: B.x, y: C.hgt(B.x, B.z) + 2, z: B.z }, t = C.addVehicle('tank', 't72', 1, B.x + 700, B.z, 0); t.ai = null;
  ok($('seekLine')(a, a.y, t, t.y + 2.5, true), 'in the clear the line is open');
  for (const k of KINDS) {
    const off = COVER[k](a, t, 40), los = C.los(a, a.y, t, t.y + 2.5), sl = $('seekLine')(a, a.y, t, t.y + 2.5, true); off();
    ok(!sl, k + ': the seeker\'s line is cut (the sight rule alone ' + (los ? 'sees through it' : 'is cut too') + ')');
  }
  for (const k of ['rock', 'bush']) { const off = COVER[k](a, t, 20), sl = $('seekLine')(a, a.y, t, t.y + 2.5, true); off(); ok(!sl, k + ' (the map\'s new cover): the seeker\'s line is cut'); }
  ok($('seekLine')(a, a.y, t, t.y + 2.5, true), 'with the cover gone it is open again');
}

/* the player in a helicopter hovering h m over its airfield, the target r m ahead */
function heli(h) {
  S = C.sandbox('modern'); T = S.T; B = S.base[0]; S.cls = 'heli'; S.model = 'ah64'; S.pref = true; const p = C.spawnPlayer(); p.inv = 0;
  p.y += h; p.land = false; p.ct = p.ctl.col = .6; return p;
}
const ahead = (p, d) => { const a = hdg(p), x = p.x + Math.cos(a) * d, z = p.z - Math.sin(a) * d; return { x, z }; };
function aimAt(p, t) {
  const A = S.aim, ty = t.y + 2; let d = { x: t.x - p.x, y: ty - p.y, z: t.z - p.z };
  for (let i = 0; i < 4; i++) { const l = Math.hypot(d.x, d.y, d.z), a = { x: d.x / l, y: d.y / l, z: d.z / l }, e = $('heliEye')(p, a); d = { x: t.x - e.x, y: ty - e.y, z: t.z - e.z }; }
  A.h = Math.atan2(-d.z, d.x); A.p = Math.asin(d.y / Math.hypot(d.x, d.y, d.z));
}
console.log('the player: a helicopter 25 m up, a T-90 1.5 km ahead');
for (const k of [null].concat(KINDS)) {
  const p = heli(25), at = ahead(p, 1500), t = C.addVehicle('tank', 't90', 1, at.x, at.z, 0); t.ai = null; t.inv = 0;
  const off = k ? COVER[k](p, t, 45) : () => {};
  C.run(3, () => { aimAt(p, t); });
  const lock = S.lockGnd, nl = S.noLos;
  S.input.ordB = true; C.run(.1); S.input.ordB = false; const m = S.missiles[0];
  C.run(1); const tg = m && m.tg0; off();
  console.log('  ' + (k || 'clear') + ': lock ' + (lock === t ? 'on the tank' : lock ? 'on something else' : 'none') + ', HUD ' + (nl === t ? 'SEM LINHA DE VISADA' : nl ? 'no line to another' : '-') + ', missile ' + (m ? (tg === t ? 'guided to the tank' : 'unguided') : 'not fired'));
  if (!k) ok(lock === t && !nl && tg === t, 'in the clear: locked, no warning, and the missile is guided');
  else ok(!lock && nl === t && m && !tg, k + ': no lock, "SEM LINHA DE VISADA" over the tank, and what leaves is unguided');
}

console.log('the AI: an anti-tank soldier (Javelin) and a T-72 at 600 m, left to itself for 20 s');
for (const k of [null].concat(KINDS, ['rock', 'bush'])) {
  fresh(); const t = C.addVehicle('tank', 't72', 1, B.x + 600, B.z, 0), m = C.addMan('blueAT', 0, B.x, B.z, 0); t.ai = null; t.inv = 0; t.hp = 1e6; m.ai = $('manBrain')(0); m.ai.gx = m.x; m.ai.gz = m.z;
  const off = k ? COVER[k]({ x: m.x, z: m.z }, t, k === 'rock' || k === 'bush' ? 20 : 40) : () => {}; let fired = 0, lock = 0;
  C.run(20, () => { if (m.arms[1] && m.arms[1].lock === t) lock++; if (S.missiles.length) { fired = S.t; return false; } });
  off();
  console.log('  ' + (k || 'clear') + ': ' + (fired ? 'fired at ' + f1(fired) + ' s' : 'held its fire') + ', frames it had a lock ' + lock);
  if (!k) ok(fired > 0, 'in the clear it locks and fires');
  else ok(!fired && !lock, k + ': no lock and no missile');
}

console.log('the AI: a helicopter\'s missile let go at a tank it cannot see leaves unguided');
for (const k of KINDS) {
  const p = heli(25), at = ahead(p, 1500), t = C.addVehicle('tank', 't90', 1, at.x, at.z, 0); t.ai = null; p.ai = 1;
  const off = COVER[k](p, t, 45), K = MSL.SK[MSL.def(p.def.ord[1], { gnd: 1 }).sk], line = MSL.line(p, t, K);
  $('heliRelease')(p, 1, t); C.run(.2); const m = S.missiles[0]; off();
  ok(!line && m && !m.tg0, k + ': the AI\'s check (MSL.line) says no, and a release anyway is not guided');
}

console.log('the AI: an AA vehicle and a helicopter 25 m up, 3.5 km away, behind a ridge 70 m high');
{
  for (const hide of [false, true]) {
    fresh(); const u = C.addUnit('aa', 0, B.x, B.z, 'pantsir', true), p = C.addHeli('mi28', 1, B.x + 3500, C.hgt(B.x + 3500, B.z) + 25, B.z, Math.PI, false); p.inv = 0; p.ai = null; p.hp = 1e6;
    const off = hide ? COVER.hill(u, p, 400, 70, 60) : () => {}; let fired = 0;
    C.run(15, () => { p.x = B.x + 3500; p.z = B.z; p.y = C.hgt(p.x, p.z) + 25; p.v = { x: 0, y: 0, z: 0 }; p.seenT = S.t; p.sx = p.x; p.sz = p.z; if (S.missiles.some(m => m.by === u)) { fired = S.t; return false; } });
    off();
    console.log('  ' + (hide ? 'behind a ridge' : 'in the open') + ': ' + (fired ? 'missile at ' + f1(fired) + ' s' : 'no missile'));
    ok(hide ? !fired : fired > 0, hide ? 'it holds its missile while the ridge is between them' : 'in the open it fires');
  }
}

console.log('in flight: an Igla on a helicopter that drops behind a ridge');
{
  const run = duck => {
    S = C.sandbox('modern'); T = S.T; B = S.base[0];
    const g = C.hgt(B.x + 1800, B.z), p = C.addHeli('mi28', 1, B.x + 1800, g + 120, B.z, Math.PI, false), s = C.addMan('blueAD', 0, B.x, B.z, 0); p.inv = 0; p.ai = null; p.hp = 1e6; p.flares = 0; s.ai = null;
    const off = COVER.hill(s, p, 250), y0 = p.y; let hit = false, m = null, at = 0;
    const e = $('manEye')(s); m = $('MSHOT').sam(s, s.arms[1].d, e, C.vnorm({ x: p.x - e.x, y: p.y - e.y, z: p.z - e.z }), p);
    C.run(10, () => {
      const y = duck && S.t > .6 ? Math.max(g + 4, y0 - (S.t - .6) * 160) : y0;   // down from 120 m to 4 m in under a second, 0.6 s after the launch
      p.x = B.x + 1800; p.z = B.z; p.y = y; p.v = { x: 0, y: 0, z: 0 }; if (p.hp < 1e6) hit = true;
      if (!m.target && !at) at = S.t; return !m.gone;
    });
    off(); return { hit, at, guided: !!m.tg0 };
  };
  const up = run(false), dn = run(true);
  console.log('  staying up: ' + (up.hit ? 'hit' : 'missed') + '; ducking: ' + (dn.hit ? 'hit' : 'missed') + ', track lost at ' + f1(dn.at) + ' s');
  ok(up.hit, 'a helicopter that stays over the ridge is hit');
  ok(!dn.hit && dn.at > 0 && dn.at < 2, 'one that drops behind it breaks the heat seeker\'s track and is not hit');
}
done();
