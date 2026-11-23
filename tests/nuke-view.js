'use strict';
/* cf-nuke-visual: the nuclear burst as the world shows it (the view part of the page, after the 3D scene marker, so cut out of the page and
   run with stubs: no DOM, no three.js). The captain saw it vanish "para as infantarias e as que morrem e respawnam": its mushroom was one of
   XFX's shared mushroom slots, which the next heavy blasts elsewhere took over, and under a low fog the ground eye lost it in the haze.
   Here: the cloud is drawn from the burst's age alone (no eye, no XFX slot), it rises to NKV.mush.H and stays NKV.mush.L s, the fires light
   when the front reaches them, the same burst gives the same particles every time (drawn again in a new scene), and its fog is the haze
   seen from above the low fog */
const fs = require('fs'), vm = require('vm'), { PAGE, ok, done } = require('./harness');
const html = fs.readFileSync(PAGE, 'utf8');
const cutF = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const cutC = name => { const i = html.indexOf('const ' + name + ' = '); return i < 0 ? '' : html.slice(i, html.indexOf('\n', html.indexOf(';\n', i)) + 1); };
const a = html.indexOf('/* ---------- cf-b2-nuke, cf-nuke-visual (the view)'), b = html.indexOf('/* the sheet of a bomber that can carry it', a), view = a < 0 || b < 0 ? '' : html.slice(a, b);
ok(view.length > 0, 'the page has the view of the nuclear burst');
ok(!/XFX\.M\b|xMush\(/.test(view), 'it takes none of XFX\'s mushroom slots (they are shared with every heavy bomb, and the next ones took the nuclear cloud\'s)');
ok(!/camera|S\.my\b/.test(cutF('nkParts')), 'what it draws comes from the burst and its age, not from the eye nor from who the player is');
const src = cutC('NKV').replace(/\nfx\.nuke = [^\n]*/, '') + cutF('nkParts') + cutF('nkFog');
ok(/function nkParts/.test(src) && /function nkFog/.test(src), 'the page has nkParts and nkFog');
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v), sstep = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };
const pool = n => ({ n: 0, max: n, pos: new Float32Array(n * 3), pc: new Float32Array(n * 4), sz: new Float32Array(n), sd: new Float32Array(n) });
const xPut = (T, x, y, z, r, g, b, al, s, sd) => { if (T.n >= T.max) return; const i = T.n++; T.pos.set([x, y, z], i * 3); T.pc.set([r, g, b, al], i * 4); T.sz[i] = s; T.sd[i] = sd; };
const ctx = vm.createContext({ Math, Float32Array, TAU: Math.PI * 2, clamp, sstep, xMix: (p, q, k) => p + (q - p) * k, xPut, hgt: () => 100, rand: (lo, hi) => lo + Math.random() * (hi - lo), NUKE: { v: 700 }, S: { wx: { wx: 0, wz: 0 } }, fx: {} });
vm.runInContext(src + ';globalThis.NKV = NKV;', ctx);
const { NKV, nkParts, nkFog } = ctx;
NKV.lv = 2; NKV.B = pool(4000); NKV.A = pool(1000);
const R = new Float32Array(16384); for (let i = 0; i < R.length; i++) R[i] = (Math.sin(i * 12.9898) * 43758.5453) % 1 + (Math.sin(i * 12.9898) < 0 ? 1 : 0);
const F = []; for (let i = 0; i < 30; i++) { const d = 300 + i * 45; F.push({ x: 5000 + d, z: 0, y: 100, t0: d / 700 + 1, L: 400, s: 1 }); }
const burst = () => ({ x: 5000, y: 100, z: 0, gy: 100, r: R, F });
const at = t => { NKV.B.n = NKV.A.n = 0; nkParts(burst(), t); const ys = []; for (let i = 0; i < NKV.B.n; i++) if (NKV.B.pc[i * 4 + 3] > .05) ys.push(NKV.B.pos[i * 3 + 1] - 100); ys.sort((p, q) => p - q);
  return { n: NKV.B.n, glow: NKV.A.n, top: ys.length ? ys[Math.floor(ys.length * .97)] : 0, seen: ys.length, pos: Array.from(NKV.B.pos.slice(0, NKV.B.n * 3)) }; };
const M = NKV.mush, T = [2, 30, 120, 240, M.L * .8, M.L + 1], P = T.map(at);
console.log('   the cloud\'s top (m over the ground) and the particles seen at ' + T.map(t => Math.round(t) + ' s').join(', ') + ': ' + P.map(p => Math.round(p.top) + ' m/' + p.seen).join(', '));
ok(P[0].top < 1500 && P[1].top > 3000 && P[2].top > M.H * .85 && P[3].top > M.H * .9, 'the cap rises: about ' + Math.round(P[1].top / 100) / 10 + ' km at 30 s, to ' + Math.round(P[3].top / 100) / 10 + ' km by 4 min');
ok(P[4].seen > 100 && P[5].seen === 0, 'it is still there at ' + Math.round(M.L * .8) + ' s and gone after ' + M.L + ' s (its own clock, nothing else)');
ok(P[1].glow > 20 && at(300).glow < P[1].glow, 'lit from inside while hot (' + P[1].glow + ' glow sprites at 30 s), less later');
{ const p1 = at(90).pos, p2 = at(90).pos; ok(p1.length > 300 && p1.every((v, i) => v === p2[i]), 'the same burst at the same age draws the same particles: a scene built again draws it as it was'); }
{ const f = F[F.length - 1], ft = f.t0; NKV.B.n = NKV.A.n = 0; nkParts(burst(), ft - .5); const before = NKV.A.n; NKV.B.n = NKV.A.n = 0; nkParts(burst(), ft + 5); ok(NKV.A.n > before, 'a fire in the ruins lights when the shock front has passed it (' + Math.round(f.x - 5000) + ' m: ' + ft.toFixed(1) + ' s)'); }
{ const c = 2 * (NKV.n.cap + NKV.n.top + NKV.n.stem + NKV.n.collar + NKV.n.surge + NKV.n.wall + NKV.n.debris + NKV.n.fire * NKV.n.smoke); ok(c < 3000, 'its budget: at most ' + c + ' smoke sprites for two bursts at the best quality, ' + Math.round(c * NKV.q[0]) + ' at the lowest'); }
/* the fog: under a low fog the ground eye's haze is a few hundred metres; the cloud is seen through the haze from above it */
{ const fog = { near: 30, far: 600, color: { copy() {} } };
  Object.assign(ctx, { scene: { fog }, LOOK: { moon: .14, fog: { far: [.22, 1], rain: .45, low: 150, f: [.97, .6] } } });
  Object.assign(ctx.S, { E: { fog: 19000 }, wx: { f: .85, r: 0 }, sky: { L: 1 } });
  NKV.u = { fN: { value: 0 }, fF: { value: 0 }, fC: { value: { copy() {} } } }; nkFog();
  ok(NKV.u.fF.value > 10000, 'in a low fog (the eye\'s haze ' + fog.far + ' m) the cloud\'s haze reaches ' + Math.round(NKV.u.fF.value) + ' m');
  fog.far = 30000; nkFog(); ok(NKV.u.fF.value >= 30000, 'never nearer than the eye\'s own'); }
done();
