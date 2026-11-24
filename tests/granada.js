'use strict';
/* cf-pol2 P6: the player's grenade. It went on the press of F, with no arc to aim by and no cooking (only the AI cooked, m.nCook). Now F
   held cooks it (its fuse less the time held), shows its arc (S.nk, nadeArc in the 3D part, run here on the match's ground) and goes on the
   release; at GRN.fuse less MAN.nade.safe it goes by itself and the key must be let go before the next; a tap throws at once, on the full
   fuse; G holds and throws a smoke grenade the same way; the throw is marked for the body to show (m.ntT).
   node tests/granada.js */
const fs = require('fs'), vm = require('vm'), H = require('./harness.js'), { load, ok, done } = H;
const C = load({ seed: 9 }), $ = C.$, MAN = $('MAN'), INF = $('INF'), GRN = $('GRN');
const S = C.sandbox('modern'); S.over = false; S.waveTimer = S.planT = 1e9;
let at = null;   // level open ground, 60 m of it toward +x
for (let x = 3000; x < 9000 && !at; x += 150) for (let z = -1500; z < 1500 && !at; z += 150) {
  let flat = true; for (let k = 0; k <= 60; k += 5) if (Math.abs(C.hgt(x + k, z) - C.hgt(x, z)) > 1.5 || C.hgt(x + k, z) <= S.T.WL + 1) flat = false;
  if (flat && !C.near(x + 30, z, 40).length) at = { x, z };
}
const P = C.addMan(INF.modern[0][0], 0, at.x, at.z, 0); P.ai = null; P.me = 1; P.inv = 1e9; P.nades = 9; P.smk = 3;
S.my = P; S.me = 0; S.cls = 'inf'; S.input = {}; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } };
const I = S.input; let mark = new Set(); const nades = () => S.bombs.filter(b => b.k === 'nade' && !mark.has(b)), smokes = () => S.bombs.filter(b => b.k === 'smk' && !mark.has(b)), fresh = () => { mark = new Set(S.bombs); return 0; };
const hold = (k, s) => { I[k] = true; let seen = null; C.run(s, () => { if (S.nk) seen = Object.assign({}, S.nk); }); return seen; };
const let_go = k => { I[k] = false; C.run(1 / 60); };
C.run(.5);
/* a tap: at once, the whole fuse */
let n0 = fresh(); hold('flare', 2 / 60); let_go('flare');
let b = nades()[n0]; ok(!!b, 'a tap of F throws a grenade');
ok(b && Math.abs(b.fz - b.t0 - GRN.fuse) < .1 || b && Math.abs((b.fz - S.t) - (GRN.fuse - 3 / 60)) < .1, 'the tap\'s grenade has the whole fuse (' + (b ? (b.fz - S.t).toFixed(2) : '-') + ' s left)');
ok(P.ntT > S.t - .1, 'the throw is marked for the body (m.ntT)');
C.run(MAN.nade.cool + .2);
/* held 2 s: the arc shows, it cooks, it goes on the release with 2 s less */
n0 = fresh(); const seen = hold('flare', 2);
ok(seen && seen.k === 1 && seen.t > 1.9, 'held, S.nk shows the grenade in hand (' + (seen ? seen.t.toFixed(2) : '-') + ' s)');
ok(seen && Math.abs(seen.fuse - (GRN.fuse - seen.t)) < .05, 'and its fuse left as it cooks (' + (seen ? seen.fuse.toFixed(2) : '-') + ' s)');
ok(nades().length === n0, 'nothing is thrown while F is held');
const a0 = S.aim.d; let_go('flare'); b = nades()[n0];
ok(!!b && Math.abs((b.fz - S.t) - (GRN.fuse - 2)) < .1, 'let go after 2 s: thrown with ' + (b ? (b.fz - S.t).toFixed(2) : '-') + ' s left (' + GRN.fuse + ' less 2)');
ok(!S.nk, 'and the hand is empty (S.nk null)');
/* the arc drawn lands where the grenade first touches the ground */
const html = fs.readFileSync(H.PAGE, 'utf8'), x0 = html.indexOf('const NARC = '), x1 = html.indexOf('function hudNade(', x0);
vm.runInContext(html.slice(x0, x1) + '\n;globalThis.nadeArc = nadeArc;', C);
C.run(MAN.nade.cool + .2); S.aim.p = .25; C.run(.2);
hold('flare', .1); const A = C.nadeArc(P); n0 = fresh(); let_go('flare'); b = nades()[n0];
let land = null; C.run(4, () => { if (!land && b.vy === 0 || (!land && b.rest)) land = { x: b.x, z: b.z }; if (!land && b.y <= C.hgt(b.x, b.z) + GRN.r + .05) land = { x: b.x, z: b.z }; });
const off = A.land && land ? Math.hypot(A.land.x - land.x, A.land.z - land.z) : 1e9;
ok(A.land && off < 1.5, 'the drawn arc lands within ' + off.toFixed(2) + ' m of where the grenade first touches down (' + (A.land ? Math.hypot(A.land.x - P.x, A.land.z - P.z).toFixed(1) : '-') + ' m out)');
S.aim.p = 0; C.run(.2);
/* held past the fuse less safe: it goes by itself, and no second one while F stays down */
C.run(MAN.nade.cool + .2); n0 = fresh(); let left = null; const went = new Set(); I.flare = true; C.run(GRN.fuse + 2, () => { const l = nades(); l.forEach(x => went.add(x)); if (l.length && left === null) left = l[0].fz - S.t; });
ok(went.size === 1, 'held ' + (GRN.fuse + 2) + ' s: it went by itself, once (' + went.size + ')');
ok(left !== null && Math.abs(left - MAN.nade.safe) < .1, 'with ' + (left === null ? '-' : left.toFixed(2)) + ' s left when it left the hand (MAN.nade.safe ' + MAN.nade.safe + ')');
let_go('flare');
/* G: a smoke grenade, held and let go */
C.run(MAN.nade.cool + .2); const s0 = fresh(), sg = hold('smoke', 1); ok(sg && sg.k === 2 && smokes().length === s0, 'G held: the smoke grenade in hand, not thrown yet');
let_go('smoke'); ok(smokes().length === s0 + 1, 'G let go: thrown');
/* the HUD draws it, the body and the first-person weapon show the throw */
ok(/hudNade\(P, u, ink, acc\)/.test(html) && /const nadeSwing = /.test(html) && /nadeSwing\(P\) === null \? 0 : \.8/.test(html), 'the HUD draws the arc, the body swings the arm, the weapon in the first person drops');
/* the pack model: the hands' reach to the grip (packHands) runs after the pose and put the right hand back on the weapon, so a turn of the
   arm in the pose never showed; while the grenade is in it, the same reach takes the right hand up behind the shoulder and through (NTH.hand) */
const ph = html.slice(html.indexOf('function packHands('), html.indexOf('\n}\n', html.indexOf('function packHands(')));
ok(/if \(ns === null\) packReach\(s\.root, 'R', w\.localToWorld/.test(ph) && /packReach\(s\.root, 'R', s\.tilt\.localToWorld\(PIKT\.set\(H\.fwd\[0\]/.test(ph) && /packReach\(s\.root, 'L'/.test(ph), 'while it throws the right hand is reached to NTH.hand, not the grip; the left keeps the weapon');
const NTH = vm.runInNewContext('(' + /const NTH = (\{.*\});/.exec(html)[1] + ')');   // in the 3D part, which the harness does not load
ok(NTH.hand.back[1] > NTH.hand.fwd[1] && NTH.hand.back[0] < 0 && NTH.hand.fwd[0] > 0, 'held, the hand is up behind the shoulder; let go, it ends out in front');
done();
