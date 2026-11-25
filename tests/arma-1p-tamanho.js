'use strict';
/* The first-person weapon's size on the screen (P8 of the polish board, cf-pol2-fase1). From the hip, a rifle's grip sat at
   VMPOS.rifle [.17, -.23, -.34] in the eye's frame and covered about a quarter of a 1280 × 800 screen, the left upper arm rising from the
   bottom middle (its shoulder VMS.L just under the eye). Now the grip sits lower, further right and further out, and the left shoulder
   lower: the weapon's box, seen by the view model's camera (VM.fov), takes the lower right corner, and the middle of the screen is clear.
   The box: a rifle of 0.84 m, 0.22 m high and 0.08 m wide, its grip 0.25 m from its butt */
const fs = require('fs'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8');
const val = name => { const m = html.match(new RegExp('const ' + name + ' = (\\{[^\\n]*\\});')); return m ? Function('return ' + m[1])() : null; };
const VMPOS = val('VMPOS'), VMS = (html.match(/const VMS = (\{[^\n]*\});/) || [])[1], fov = +((html.match(/const VM = \{ fov: (\d+)/) || [])[1]);
if (!VMPOS || !fov) { console.log('no VMPOS or VM.fov: a page before the first-person weapon'); process.exit(0); }
const L = Function('return ' + VMS)().L;
const asp = 1280 / 800, t = Math.tan(fov * Math.PI / 360);
const proj = ([x, y, z]) => (z < -.01 ? [x / (-z * t * asp), y / (-z * t)] : null);   // NDC, -1 to 1
function cover(g) {   // the share of the screen the weapon's box covers (its screen box, clipped to the screen)
  const xs = [g[0] - .04, g[0] + .04], ys = [g[1] - .12, g[1] + .1], zs = [g[2] + .25, g[2] - .59], P = [];
  for (const x of xs) for (const y of ys) for (const z of zs) { const p = proj([x, y, Math.min(z, -.02)]); if (p) P.push(p); }
  const c = v => Math.max(-1, Math.min(1, v)), x0 = c(Math.min(...P.map(p => p[0]))), x1 = c(Math.max(...P.map(p => p[0]))), y0 = c(Math.min(...P.map(p => p[1]))), y1 = c(Math.max(...P.map(p => p[1])));
  return { k: (x1 - x0) * (y1 - y0) / 4, x0, y1 };
}
const old = cover([.17, -.23, -.34]), now = cover(VMPOS.rifle);
console.log('  the rifle\'s box: ' + (old.k * 100).toFixed(0) + '% of the screen before, ' + (now.k * 100).toFixed(0) + '% now');
ok(now.k < old.k * .8 && now.k < .12, 'the rifle from the hip covers ' + (now.k * 100).toFixed(0) + '% of the screen (it was ' + (old.k * 100).toFixed(0) + '%)');
ok(now.x0 > 0 && now.y1 < -.1, 'all of it right of the middle and under the aim\'s line (left edge at ' + now.x0.toFixed(2) + ', top at ' + now.y1.toFixed(2) + ' of the half screen)');
const sh = proj([L[0], L[1], Math.min(L[2], -.02)]);
ok(L[1] <= -.35 && (!sh || sh[1] < -1), 'the left shoulder is low (' + L[1] + ' m, it was -.25) and under the bottom edge: the upper arm comes in from below, not up the middle');
ok(VMPOS.pistol[1] <= -.17, 'the pistol stays where it was');
H.done();
