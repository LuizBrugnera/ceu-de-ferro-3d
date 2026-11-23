'use strict';
/* every tank of the pack faces +x, the game's front, with its gun a part of its own that turns with the turret (cf-torre-t90). The T-72's
   source faced -x: the T-90 and the T-72 drove with the turret backwards, the barrel over the engine deck, and the gun never split out of
   the turret (the split rule looks for a long piece at the front), nor the sleeve by the muzzle, which stayed on the hull. On the real
   models/pack/tk_*.glb, read with the pack's own reader (tools/pack/glb.js) */
const fs = require('fs'), path = require('path'), H = require('./harness'), { ok, done } = H, G = require('../tools/pack/glb.js');
const dir = path.join(H.ROOT, 'models', 'pack'), f = n => n.toFixed(2);
for (const file of fs.readdirSync(dir).filter(n => /^tk_.*\.glb$/.test(n)).sort()) {
  const id = file.slice(0, -4), { J, acc } = G.read(path.join(dir, file));
  /* each part's box in the model's frame (the node's translation is its pivot) */
  const B = {};
  for (const n of J.nodes) {
    if (n.mesh === undefined) continue;
    const t = n.translation || [0, 0, 0], b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
    for (const p of J.meshes[n.mesh].primitives) { const X = acc(p.attributes.POSITION); for (let v = 0; v < X.length; v += 3) for (let c = 0; c < 3; c++) { b[c] = Math.min(b[c], X[v + c] + t[c]); b[c + 3] = Math.max(b[c + 3], X[v + c] + t[c]); } }
    B[n.name] = { b, t };
  }
  const g = B.gun, tu = B.turret, h = B.hull, L = Math.max(...Object.values(B).map(q => q.b[3])) - Math.min(...Object.values(B).map(q => q.b[0]));   // the sources are not all in metres
  ok(g && tu && h, id + ': hull, turret and gun are parts of their own (' + Object.keys(B).join(' ') + ')');
  if (!(g && tu && h)) continue;
  ok(g.b[0] >= g.t[0] - .01 * L && g.b[3] > tu.b[3] + .04 * L, id + ': the gun runs forward (+x) from its pivot (x ' + f(g.t[0]) + ') past the turret\'s front (' + f(tu.b[3]) + ') to ' + f(g.b[3]));
  ok(tu.t[0] < h.b[3] - .08 * L, id + ': the turret sits behind the hull\'s front (turret x ' + f(tu.t[0]) + ', hull front ' + f(h.b[3]) + ')');
  /* nothing of the hull or the tracks in the barrel's path ahead of the turret: a piece of the gun left there would not turn with it */
  const lane = ['hull', 'trackL', 'trackR'].filter(p => B[p]).some(p => { const b = B[p].b; return b[3] > tu.b[3] + .03 * L && b[4] > g.b[1] && b[1] < g.b[4] && b[5] > g.b[2] && b[2] < g.b[5] && b[3] > g.t[0] + (g.b[3] - g.t[0]) * .8; });
  ok(!lane, id + ': no piece of the hull or the tracks out by the muzzle, where only the gun is');
}
done();
