'use strict';
/* the hands on the weapon in first person (cf-armas-fp): every pack model a weapon is drawn with has its holds in VMH, and each hold is on
   the real models/pack/*.glb (the right hand on the pistol grip, the left one under the handguard or round the foregrip, the magazine and
   the bolt where a reload and a bolt rifle send them); before, the hands were put by the model's box and hung in the air under the weapons.
   The arms reach each hand from the shoulder (vmElbow: two bones, straight and stretched when out of reach), and vmHandPose moves the left
   hand to the magazine and back in a reload and the right one to the bolt after a bolt rifle's shot. Runs the page's block alone, without
   three.js, over the GLBs read with the pack's own reader (tools/pack/glb.js) */
const fs = require('fs'), path = require('path'), vm = require('vm'), H = require('./harness'), { ok, done } = H, G = require('../tools/pack/glb.js');
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('const VMH = {'), b = html.indexOf("/* where the grip sits in the eye's frame");
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0 || b < a) { console.log('no hand holds (VMH): a page before them'); process.exit(0); }
const ctx = vm.createContext({ console, Math });
vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'vm-hands.js' });
const VMH = ctx.$('VMH'), elbow = ctx.$('vmElbow'), pose = ctx.$('vmHandPose'), VMS = ctx.$('VMS'), VMR = ctx.$('VMR');
const VMW = (() => { const i = html.indexOf('const VMW = {'), j = html.indexOf('};', i); return vm.runInNewContext('(' + html.slice(i + 12, j + 1) + ')'); })();
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]), f = n => (n * 100).toFixed(1) + ' cm';

/* the model's surface as points (each triangle sampled), in the model's own metres (a node's translation added), the Kar98's clip cut as
   the page cuts it (PACK.cut, relative to the node) */
const cut = (() => { const i = html.indexOf('PACK.cut = '), j = html.indexOf('};', i); return vm.runInNewContext('(' + html.slice(i + 11, j + 1) + ')'); })();
function surface(id) {
  const { J, acc } = G.read(path.join(H.ROOT, 'models', 'pack', id + '.glb')), pts = [], C = cut[id] || [];
  for (const n of J.nodes) {
    if (n.mesh === undefined) continue;
    const t = n.translation || [0, 0, 0], boxes = C.filter(c => c[0] === (n.name || '')).map(c => [c[1], c[2]]);
    const inCut = v => boxes.some(([lo, hi]) => v.every((x, k) => x >= lo[k] && x <= hi[k]));
    for (const pr of J.meshes[n.mesh].primitives) {
      const P = acc(pr.attributes.POSITION), I = acc(pr.indices), V = k => [P[k * 3], P[k * 3 + 1], P[k * 3 + 2]];
      for (let i = 0; i < I.length; i += 3) {
        const tri = [V(I[i]), V(I[i + 1]), V(I[i + 2])]; if (tri.some(inCut)) continue;
        for (let s = 0; s <= 6; s++) for (let r = 0; r <= 6 - s; r++) { const u = s / 6, w = r / 6, q = 1 - u - w; pts.push([0, 1, 2].map(d => tri[0][d] * q + tri[1][d] * u + tri[2][d] * w + t[d])); }
      }
    }
  }
  return pts;
}
const near = (pts, p) => pts.reduce((m, q) => Math.min(m, dist(p, q)), 1e9);
const above = (pts, p, r) => pts.some(q => q[1] > p[1] && q[1] < p[1] + r && Math.abs(q[0] - p[0]) < .02 && Math.abs(q[2] - p[2]) < .03);

console.log('-- every weapon\'s model has its holds --');
{
  const ids = [...new Set(Object.values(VMW).map(e => e[0]))], miss = ids.filter(id => !VMH[id]);
  ok(!miss.length, ids.length + ' models draw the ' + Object.keys(VMW).length + ' weapons of VMW, each with its holds in VMH' + (miss.length ? ': none for ' + miss.join(', ') : ''));
  /* the RPG-7's model (w_bazooka) turned by its rot as three.js turns an Euler (the order's last axis first): the muzzle toward +x and up +y,
     as every other pack model; the oracle is the GLB's own shape, the warhead a cone that narrows to a point at the front and swells behind
     it, the two grips the parts hanging far off the tube */
  const r = VMH.w_bazooka.rot, ax = { X: [1, 2], Y: [2, 0], Z: [0, 1] };
  const turn = p => [...r[3]].reverse().reduce((q, a) => { const [i, j] = ax[a], t = r['XYZ'.indexOf(a)], c = Math.cos(t), s = Math.sin(t), o = q.slice(); o[i] = q[i] * c - q[j] * s; o[j] = q[i] * s + q[j] * c; return o; }, p);
  const P = surface('w_bazooka').map(turn), xs = P.map(p => p[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const ends = P.filter(p => p[0] < x0 + .05 || p[0] > x1 - .05), mid = d => (Math.min(...ends.map(p => p[d])) + Math.max(...ends.map(p => p[d]))) / 2, A = [mid(1), mid(2)];
  const rad = (lo, hi) => P.filter(p => p[0] >= lo && p[0] <= hi).reduce((m, p) => Math.max(m, Math.hypot(p[1] - A[0], p[2] - A[1])), 0);
  const tipF = rad(x1 - .02, x1), bulgeF = rad(x1 - .2, x1), tipB = rad(x0, x0 + .02);
  ok(tipF < .02 && bulgeF > .04 && tipB > .04, 'the RPG-7 turned by its rot: its warhead ahead, a point (' + f(tipF) + ' off the axis) swelling to ' + f(bulgeF) + ', the flared end (' + f(tipB) + ') behind');
  const grip = P.filter(p => Math.hypot(p[1] - A[0], p[2] - A[1]) > .08 && p[0] > x0 + .2 && p[0] < x1 - .2);
  const down = grip.filter(p => p[1] < A[0]).length, hold = [VMH.w_bazooka.g, VMH.w_bazooka.f].map(turn);
  ok(grip.length && down > grip.length / 2 && Math.min(...grip.map(p => p[1])) < A[0] - .09 && Math.max(...grip.map(p => Math.abs(p[2] - A[1]))) < .03 && hold.every(h => h[1] < A[0] - .04), '  its grips hang down under the tube (' + down + ' of ' + grip.length + ' points far off it below), and both hands on them');
}

console.log('-- each hold on the model --');
for (const id of Object.keys(VMH)) {
  const h = VMH[id], pts = surface(id), g = near(pts, h.g), fl = near(pts, h.f);
  ok(g < .025, id + ': the right hand on the grip (' + f(g) + ' from the model)');
  ok(fl < .035 && (h.fh === 'u' ? above(pts, h.f, .05) : true), '  the left hand ' + ({ u: 'under the handguard', v: 'round the foregrip', c: 'cupping the right one' })[h.fh] + ' (' + f(fl) + ' from the model)');
  const ahead = (h.f[0] - h.g[0]) * (h.rot ? -1 : 1);   // a model turned round has its muzzle toward -x
  if (h.fh !== 'c') ok(ahead > .1, '  ahead of the right one (' + f(ahead) + ')');
  if (h.m) ok(near(pts, h.m) < .04, '  the magazine where a reload sends the left hand (' + f(near(pts, h.m)) + ' from the model)');
  if (h.b) ok(near(pts, h.b) < .04, '  the bolt\'s handle (' + f(near(pts, h.b)) + ' from the model)');
}

console.log('-- the arms --');
{
  const S = VMS.R, cases = [[.15, -.15, -.2], [0, -.2, -.1], [-.02, -.18, -.35], [.25, -.3, .05]];
  const bad = cases.filter(Hd => { const E = elbow(S, Hd, VMS.pole.R, VMS.up, VMS.fore); return Math.abs(dist(S, E) - VMS.up) > 1e-6 || Math.abs(dist(Hd, E) - VMS.fore) > 1e-6; });
  ok(!bad.length, 'within reach the elbow is up m from the shoulder and fore m from the hand (' + cases.length + ' hands)');
  const E = elbow(S, [.15, -.15, -.2], [.8, -1, .2], VMS.up, VMS.fore), mid = [(S[0] + .15) / 2, (S[1] - .15) / 2, (S[2] - .2) / 2];
  ok(E[0] > mid[0] && E[1] < mid[1], '  bent down and out, toward its pole');
  const far = [-.3, -.1, -.9], E2 = elbow(S, far, VMS.pole.R, VMS.up, VMS.fore), k = dist(S, E2) / dist(S, far);
  ok(Math.abs(dist(S, E2) + dist(E2, far) - dist(S, far)) < 1e-9 && Math.abs(k - VMS.up / (VMS.up + VMS.fore)) < 1e-9, 'out of reach the arm is straight, both bones stretched alike: the hand never leaves the weapon');
}

console.log('-- the hands in a reload and at the bolt --');
{
  const A = { g: [0, 0, 0], f: [.3, .05, 0], m: [.15, -.05, 0], b: [.05, .08, .03] }, L = rl => pose(A, rl, -1).L, P = VMR.path;
  ok(dist(L(-1), A.f) < 1e-9 && dist(pose(A, -1, -1).R, A.g) < 1e-9, 'no reload, no bolt: each hand on its hold');
  ok(dist(L((P[1][0] + P[2][0]) / 2), A.m) < 1e-9, 'in a reload the left hand goes to the magazine');
  const D = [A.m[0] + VMR.drop[0], A.m[1] + VMR.drop[1], A.m[2] + VMR.drop[2]];
  ok(dist(L(P[3][0]), D) < 1e-9 && D[1] < A.m[1] - .1, '  drops the old one below it');
  ok(dist(L(.7), A.m) < 1e-9 && dist(L(1), A.f) < 1e-9, '  puts the new one in and goes back to its hold');
  let jump = 0; for (let t = 0; t < 1; t += .01) jump = Math.max(jump, dist(L(t), L(t + .01)));
  ok(jump < .03, '  without a jump (at most ' + f(jump) + ' a hundredth of the reload)');
  const R = tb => pose(A, -1, tb).R, mid = VMR.bolt[0] + VMR.bolt[1] / 2;
  ok(dist(R(mid), [A.b[0] - VMR.pull, A.b[1], A.b[2]]) < 1e-9, 'after a bolt rifle\'s shot the right hand works the bolt: at its handle, pulled back ' + f(VMR.pull));
  ok(dist(R(VMR.bolt[0] + VMR.bolt[1] + .01), A.g) < 1e-9 && dist(pose({ g: A.g, f: A.f }, -1, mid).R, A.g) < 1e-9, '  and back on the grip; a weapon without a bolt keeps it there');
  const B = { g: A.g, f: A.f }; ok(dist(pose(B, (P[1][0] + P[2][0]) / 2, -1).L, A.f) < 1e-9 && pose(B, P[3][0], -1).L[1] < A.f[1] - .1, 'a launcher (no magazine): the left hand drops for the next round and comes back');
}

done();
