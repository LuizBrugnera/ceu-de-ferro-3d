'use strict';
/* rounds against the walls of houses (CITY.pen, bPow, bThru, cf-casas-paredes): a round fired square at a blind wall of the ground storey,
   a soldier just inside it. A soldier's rifle stops on plaster and goes through a barn's wood; every .50 goes through plaster and brick and
   not the stone of a church: the aircraft's, and also a tank's M2 or Kord with no ap and the M16's four, whose damage is cut for their rate
   (their round has the calibre's power, CITY.pen.cal); a 20 mm goes through stone; a tank's solid shot goes through a house and kills the
   man behind the wall. Each round at a wall of its own. ww2 and modern, map v6. node tests/walls-pen.js (PAGE=<page>) */
const H = require('./harness'), { ok, done } = H;
for (const era of ['ww2', 'modern']) {
  const C = H.load({ seed: 4, mapv: 6 }), $ = C.$, S = C.sandbox(era), calOf = $('calOf'), INF = $('INF')[era];
  const sites = {};   // per material, the blind walls of the ground storey, seen from inside
  for (const k in S.T.byId) { const o = S.T.byId[k]; if (!o || !o.B) continue; const m = o.B.K.mat; for (const c of $('bldCover')(o)) if (c.in && c.k === 'blind' && !c.l) (sites[m] || (sites[m] = [])).push(c); }
  const tk = C.addVehicle('tank', era === 'ww2' ? 'sherman' : 't90', 0, 0, 0, 0), aa = era === 'ww2' ? C.addVehicle('aa', 'm16', 0, 0, 0, 0) : null;
  const G = { rifle: { sa: 1, dmg: 5, spd: 760, name: 'rifle' }, tank: tk.arms[1].d, m16: aa && aa.arms[0].d, air: $('PLANES').p47.gun, g20: $('PLANES').bf109.gun };
  S.units.length = 0;
  const shoot = (gk, mat) => {
    const w = G[gk], c = sites[mat] && sites[mat].shift(); if (!w || !c) return null;
    S.men.length = 0; S.bullets.length = 0;
    const m = C.addMan(INF[1][0], 1, c.x, c.z, 0); m.ai = null; m.inv = 0; m.y = c.y;
    const sh = C.addMan(INF[0][0], 0, c.x + c.nx * 9, c.z + c.nz * 9, 0); sh.ai = null;
    const b = { x: c.x + c.nx * 6, y: c.y + 1.2, z: c.z + c.nz * 6, vx: -c.nx * w.spd, vy: 0, vz: -c.nz * w.spd, life: 1.3, team: 0, dmg: w.dmg, ap: w.ap || 0, sa: w.sa, by: sh, tr: 0, cal: w.sa ? 0 : calOf(w) };
    const pw = $('bPow')(Object.assign({}, b)); S.bullets.push(b); const hp = m.hp; C.run(.1);
    return { thru: (b.np | 0) > 0, hit: m.hp < hp, pw: +pw.toFixed(2) };
  };
  const exp = (gk, mat, thru, hit) => {
    const r = shoot(gk, mat); if (!r) return;
    ok(r.thru === thru && (hit === undefined || r.hit === hit), era + ': ' + (G[gk].name || gk) + ' (power ' + r.pw + ') on ' + mat + (thru ? ': goes through' : ': stops') + (hit ? ' and hits the man inside' : '') + ' (' + (r.thru ? 'through' : 'stopped') + (r.hit ? ', hit' : '') + ')');
  };
  exp('rifle', 'plaster', false, false); exp('rifle', 'wood', true, true);
  exp('tank', 'plaster', true, true); exp('tank', 'brick', true); exp('tank', 'stone', false);
  exp('m16', 'plaster', true, true); exp('m16', 'brick', true); exp('m16', 'stone', false);
  exp('air', 'brick', true); exp('air', 'stone', false);
  exp('g20', 'stone', true);
  /* a tank's solid shot square at a house's blind wall, a man 1 m inside it */
  let c = null;   // a wall nothing else stands in front of, 40 m out
  for (const q of sites.plaster) { const y = q.y + 1.2; if ($('ray')(q.x + q.nx * 40, y, q.z + q.nz * 40, q.x, y, q.z, 0) === q.b) { c = q; break; } }
  S.men.length = 0; S.bullets.length = 0; S.bombs.length = 0;
  const m = C.addMan(INF[1][0], 1, c.x - c.nx, c.z - c.nz, 0); m.ai = null; m.inv = 0;
  const u = C.addVehicle('tank', era === 'ww2' ? 'sherman' : 'abrams', 0, c.x + c.nx * 50, c.z + c.nz * 50, 0); u.ai = null;
  const W = u.arms[0].d, y0 = m.y + 1.1, T = 40 / W.spd, b = C.shell(u, W, c.x + c.nx * 40, y0, c.z + c.nz * 40, -c.nx * W.spd, .5 * $('GR') * T, -c.nz * W.spd);
  C.run(.4);
  ok((b.np | 0) >= 1 && m.dead, era + ': ' + W.name + ' solid shot into a house: through the wall (' + (b.np | 0) + ') and the man behind it killed (' + m.dead + ')');
}
done();
