'use strict';
/* the artillery's models (ARTB, cf-pol-modelos) against the artillery's numbers: every gun and rocket launcher has a model of its own, made of
   pieces filed under the damage parts damageLook darkens (hull, trackL, trackR, engine, gun, ammo), each side's wheels and tracks on its
   side, nothing under the ground or far outside the vehicle's length and width, and the mouth of the gun or of the tubes where the sim's
   muzzle is (d.bl along the turret, the turret at d.mh). The builders live in the 3D part of the page, which the harness does not load:
   they run here against a kit that records each piece's box instead of making meshes */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- the vehicle kit (VK'), b = html.indexOf("buildUnit = (f => (u, wreck) => {\n  const d = u.def, id = u.kind === 'art'");
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0) { console.log('no artillery models (ARTB): a page before them'); process.exit(0); }
const sim = H.load(), ARTS = sim.$('ARTS'), GS = sim.$('GS');
const ctx = vm.createContext({ LRS: [-1, 1], console });
vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'artb.js' });
const ARTB = ctx.$('ARTB');

/* a node of the model: where it sits (the turret over the hull, the gun on the turret) */
const node = (name, x, y) => ({ name, position: { x: x || 0, y: y || 0, z: 0, set(X, Y, Z) { this.x = X; this.y = Y; this.z = Z || 0; } } });
/* a kit that keeps, per piece, its node, part and box (half sizes from the piece's own measures, turned pieces taken at their longest) */
function kit() {
  const P = [], K = {}, add = (to, pid, x, y, z, hx, hy, hz) => { P.push({ to, pid, x, y, z, hx, hy, hz }); return K; };
  /* a box turned about one axis: its half sizes across the other two, turned */
  const turn = (a, b, t) => [Math.abs(a * Math.cos(t)) + Math.abs(b * Math.sin(t)), Math.abs(a * Math.sin(t)) + Math.abs(b * Math.cos(t))];
  K.box = (to, pid, col, w, h, d, x, y, z, rx, ry, rz) => {
    let X = w / 2, Y = h / 2, Z = d / 2;
    if (rz) [X, Y] = turn(X, Y, rz); if (rx) [Y, Z] = turn(Y, Z, rx); if (ry) [X, Z] = turn(X, Z, ry);
    return add(to, pid, x, y, z, X, Y, Z);
  };
  K.cx = (to, pid, col, r0, r1, len, seg, x, y, z, rz) => { const r = Math.max(r0, r1), [X, Y] = turn(len / 2, r, rz || 0); return add(to, pid, x, y, z, X, Y, r); };
  K.cz = (to, pid, col, r, w, seg, x, y, z) => add(to, pid, x, y, z, r, r, w / 2);
  K.cy = (to, pid, col, r0, r1, h, seg, x, y, z) => add(to, pid, x, y, z, Math.max(r0, r1), h / 2, Math.max(r0, r1));
  K.dx = (to, pid, col, r, seg, x, y, z) => add(to, pid, x, y, z, 0, r, r);
  K.dz = (to, pid, col, r, seg, x, y, z) => add(to, pid, x, y, z, r, r, 0);
  K.pr = (to, pid, col, pts, d, x, y, z) => { const X = pts.map(p => p[0]), Y = pts.map(p => p[1]), x0 = Math.min(...X), x1 = Math.max(...X), y0 = Math.min(...Y), y1 = Math.max(...Y); return add(to, pid, x + (x0 + x1) / 2, y + (y0 + y1) / 2, z, (x1 - x0) / 2, (y1 - y0) / 2, d / 2); };
  K.P = P; return K;
}
const PARTS = ['hull', 'trackL', 'trackR', 'engine', 'gun', 'ammo'];

console.log('-- every gun and launcher --');
ok(Object.keys(ARTS).every(id => ARTB[id]), 'a model for each: ' + Object.keys(ARTS).join(' '));

for (const id of Object.keys(ARTS)) {
  const d = ARTS[id], [tl, tw, th, tx] = d.t, K = kit(), g = node('g'), tur = node('tur', tx, .5 + d.hh + th / 2), gun = node('gun', -tl / 2, 0);
  ARTB[id](K, g, tur, gun, { P: 1, P2: 2, dk: 3, glass: 4, rk: 5, wh: 6, tl, tw, th, g: d.g, hh: d.hh });
  const P = K.P, at = p => p.to === g ? [p.x, p.y, p.z] : p.to === tur ? [tur.position.x + p.x, tur.position.y + p.y, p.z] : [tur.position.x + gun.position.x + p.x, tur.position.y + gun.position.y + p.y, p.z];
  console.log(id + ' (' + d.name + '): ' + P.length + ' pieces');
  const miss = PARTS.filter(k => !P.some(p => p.pid === k));
  ok(!miss.length && P.every(p => PARTS.includes(p.pid)), 'every piece under a damage part, and all of them there' + (miss.length ? ' (none for ' + miss.join(', ') + ')' : ''));
  ok(P.filter(p => p.pid === 'trackL').every(p => p.z < 0) && P.filter(p => p.pid === 'trackR').every(p => p.z > 0), 'the left wheels and tracks on the left, the right ones on the right');
  ok(P.filter(p => p.to === g).every(p => p.y - p.hy > -.02), 'nothing of the hull under the ground');
  const out = P.filter(p => { const [x, , z] = at(p); return (p.to !== gun && Math.abs(x) + p.hx > d.l / 2 + .3) || (p.to === g && Math.abs(z) + p.hz > d.w / 2 + .3); });
  ok(!out.length, 'inside its length (' + d.l + ', the barrel may reach past it) and the hull inside its width (' + d.w + ')' + (out.length ? ': ' + out.map(p => p.pid + '@' + at(p).map(v => v.toFixed(2))).join(' ') : ''));
  const mouth = Math.max(...P.filter(p => p.to === gun).map(p => gun.position.x + p.x + p.hx)), want = d.bl / GS - tx;
  ok(Math.abs(mouth - want) < .35, 'the mouth ' + mouth.toFixed(2) + ' along the turret, the sim\'s muzzle ' + want.toFixed(2) + ' (d.bl)');
  ok(Math.abs(1.5 + GS * tur.position.y - d.mh) < .01, 'the turret at the sim\'s muzzle height (d.mh ' + d.mh.toFixed(2) + ')');
}
done();
