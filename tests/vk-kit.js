'use strict';
/* the vehicle models made with the page's kit (VK, cf-pol-modelos: ARTB, AAB), run without three.js: blocks(name) evaluates the kit's
   section of the page up to the wrapper that installs the named table, and kit() is a kit that records each piece (its node, damage part and
   box: half sizes from the piece's own measures, a piece turned about one axis taken turned) instead of making meshes. node(): a model's node
   with the position the builders set */
const fs = require('fs'), vm = require('vm'), H = require('./harness');
const html = fs.readFileSync(H.PAGE, 'utf8');
function blocks(name) {
  const a = html.indexOf('/* ---------- the vehicle kit (VK'), b = html.indexOf('const ' + name + ' = {');
  if (a < 0 || b < 0) return null;
  const end = html.indexOf('buildUnit = (f => (u, wreck) => {', b);
  const ctx = vm.createContext({ LRS: [-1, 1], console, buildUnit: () => null });
  vm.runInContext(html.slice(a, end) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'vk.js' });
  return ctx.$(name);
}
const node = (name, x, y) => ({ name, position: { x: x || 0, y: y || 0, z: 0, set(X, Y, Z) { this.x = X; this.y = Y; this.z = Z || 0; } } });
function kit() {
  const P = [], K = {}, add = (to, pid, x, y, z, hx, hy, hz) => { P.push({ to, pid, x, y, z, hx, hy, hz }); return K; };
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
/* where a piece is in the vehicle's frame, with the turret and the gun at rest (no yaw, no pitch) */
const at = (p, g, tur, gun) => p.to === g ? [p.x, p.y, p.z] : p.to === tur ? [tur.position.x + p.x, tur.position.y + p.y, tur.position.z + p.z] : [tur.position.x + gun.position.x + p.x, tur.position.y + gun.position.y + p.y, tur.position.z + gun.position.z + p.z];
module.exports = { blocks, kit, node, at, html };
