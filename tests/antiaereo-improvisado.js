'use strict';
/* cf-antiaereo-improvisado: an insurgent squad's RPGs fire at a helicopter that fights it close, lead it badly (a hovering one is hit
   sometimes, one on a gun run seldom), and leave alone one that is far or not in their fight; a technical's DShK fires at one too.
   node tests/antiaereo-improvisado.js (TRIALS=n, 6 by default) */
const { load, ok, done } = require('./harness.js');
const C = load({ seed: 31 }), $ = C.$, HELIS = $('HELIS'), HELAT = $('HELAT'), ASPD = $('ASPD'), N = +process.env.TRIALS || 6;
let S;
/* the squad (2 RPG-7V, 2 rifles) on a road; the AH-64, no AI, held at d m off and h m up, still or crossing at v m/s, firing its gun at the
   squad (shotT, its nose on them) or with its nose away */
function trial(name, o) {
  const R = { rk: 0, hit: 0, down: 0, far: 0, tec: 0 };
  for (let i = 0; i < N; i++) {
    C.seed(900 + i * 31 + name.length); S = C.sandbox('modern'); S.fac = [0, 2];
    const r = S.T.routes[0], c = C.routeAt(r, r.len * .5), sq = C.addSquad(1, c.x, c.z, 0, r.len * .5, o.tec ? [0] : [2, 2, 0, 0]);
    const a0 = i * .7, ux = Math.cos(a0), uz = Math.sin(a0);
    let x = c.x + ux * o.d, z = c.z + uz * o.d; if (o.v) { x -= uz * 500; z += ux * 500; }
    const p = C.addHeli('ah64', 0, x, C.hgt(x, z) + HELIS.ah64.gh + o.h, z, Math.atan2(uz, -ux), false); p.inv = 0; p.ctl.vs = 0; p.ctl.free = true; p.flares = 0;
    const u = o.tec ? C.addUnit('car', 1, c.x + 5, c.z + 5, 'tecDshk', true) : null, tgt = sq.men[sq.men.length - 1]; let last = p.hp;
    if (u) u.inv = 0;
    C.run(o.t || 40, dt => {
      if (o.v) { const vx = uz * o.v, vz = -ux * o.v, k = p.q ? ASPD : 1; p.x += vx * dt; p.z += vz * dt; p.v = { x: vx / k, y: 0, z: vz / k }; } else { p.x = x; p.z = z; p.v = { x: 0, y: 0, z: 0 }; }
      p.y = C.hgt(p.x, p.z) + HELIS.ah64.gh + o.h;
      if (o.fire) { p.shotT = S.t; const dx = tgt.x - p.x, dz = tgt.z - p.z, l = Math.hypot(dx, dz) || 1; p.f = { x: dx / l, y: 0, z: dz / l }; } else p.f = { x: ux, y: 0, z: uz };
      for (const b of S.bombs) if (b.k === 'heat' && b.team === 1 && b.by && b.by.man && !b._c) { b._c = 1; R.rk++; if (!o.fire && Math.hypot(b.by.x - p.x, b.by.z - p.z) > HELAT.near + 5) R.far++; }
      if (p.hp < last - 30) R.hit++; last = p.hp;
      if (p.dead) return false;
    });
    if (p.dead) R.down++;
    if (u && p.lastBy === u) R.tec++;
  }
  console.log('  ' + name + ': ' + R.rk + ' rockets, ' + R.hit + ' hits' + (o.tec ? ', hit by the DShK ' + R.tec + '/' + N : '') + ', down ' + R.down + '/' + N);
  return R;
}
const hov = trial('hovering 200 m off, 30 m up, firing its gun at the squad', { d: 200, h: 30, fire: 1 });
const run = trial('a gun run at 45 m/s, 40 m up, passing 120 m off', { d: 120, h: 40, v: 45, fire: 1, t: 22 });
const idle = trial('hovering 300 m off, nose away, not firing', { d: 300, h: 30 });
const far = trial('hovering 600 m off, firing (beyond the RPG)', { d: 600, h: 40, fire: 1 });
const tec = trial('a DShK technical, the helicopter hovering 400 m off', { d: 400, h: 30, fire: 1, tec: 1, t: 30 });
ok(hov.rk >= N && hov.hit >= 1 && hov.down >= 1, 'RPGs fire at a helicopter that hovers close and fights them, and bring some down');
ok(hov.hit < hov.rk * .6, 'and miss more than they hit (' + hov.hit + ' of ' + hov.rk + ')');
ok(run.rk >= 1 && run.hit / Math.max(1, run.rk) < hov.hit / hov.rk, 'they fire at one on a gun run too, and hit it less often (' + run.hit + ' of ' + run.rk + ')');
ok(idle.far === 0, 'a helicopter not in their fight draws no rocket unless it is right over them (within ' + HELAT.near + ' m)');
ok(far.rk === 0, 'nor one beyond the RPG\'s reach');
ok(tec.tec >= 1 && tec.down >= 1, 'a technical\'s DShK fires at a helicopter near it and brings it down');
done();
