'use strict';
/* Footsteps (P7 of the polish board, cf-pol2-fase1): nothing read the legs' swing (m.step) for sound. stepFall says a foot came down (each
   half swing of the rig's phase), stepVol how loud at a distance (run over walk, crouched and prone quieter, nothing at STEPS.r m), and
   sndSteps plays the player's own steps and those of the nearest few soldiers around. The audio's functions run on a stub burst */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const line = re => (html.match(re) || [''])[0];
if (!body('stepFall')) { console.log('no stepFall: a page before it'); process.exit(0); }
const out = [], ctx = vm.createContext({ Math, A: { ctx: { currentTime: 0 } }, S: { men: [] }, burst: (dur, vol, f, type) => out.push({ vol, f, type }) });
vm.runInContext(line(/const STEPS = [^\n]*\n/).replace('const STEPS', 'globalThis.STEPS') + body('stepFall') + body('stepVol') + body('sndSteps'), ctx);
const STEPS = ctx.STEPS, man = o => Object.assign({ x: 0, z: 0, v: { x: 4, z: 0 }, step: 0, st: 0, run: false, dead: false }, o);
const walk = (m, metres, dt) => { let n = 0; for (let t = 0; t < metres / 4; t += dt) { m.step += 4 * dt * .85; if (ctx.stepFall(m)) n++; } return n; };

console.log('-- stepFall --');
{
  const m = man(), n = walk(m, 40, 1 / 60), per = Math.PI / STEPS.ph / .85;
  ok(Math.abs(n - 40 / per) <= 1.5, '40 m walked: ' + n + ' footfalls (one each ' + per.toFixed(2) + ' m of the legs\' swing)');
  const s = man({ v: { x: 0, z: 0 } }); ok(walk(s, 40, 1 / 60) === 0, 'standing still: none');
  const a = man({ in: {} }); ok(walk(a, 40, 1 / 60) === 0, 'aboard a vehicle: none');
  const q = man({ v: undefined }); ok(walk(q, 40, 1 / 60) === 0, 'one with no velocity yet (a soldier just made): none, no error');
}
console.log('-- stepVol --');
{
  const v = (o, d) => ctx.stepVol(man(o), d);
  ok(v({ run: true }, 0) > v({}, 0) && v({}, 0) > v({ st: 1 }, 0) && v({ st: 1 }, 0) > v({ st: 2 }, 0), 'running louder than walking, walking than crouched, crouched than prone');
  ok(v({}, 10) < v({}, 0) && v({}, STEPS.r) === 0, 'fainter away, nothing at ' + STEPS.r + ' m');
}
console.log('-- sndSteps --');
{
  const P = man(); P.step = 0; ctx.stepFall(P);
  const near = man({ x: 8 }), far = man({ x: 80 }), crowd = [1, 2, 3, 4, 5, 6].map(i => man({ x: i, z: 1 }));
  ctx.S.men = [P, near, far].concat(crowd); for (const m of ctx.S.men) ctx.stepFall(m);
  for (const m of ctx.S.men) m.step += Math.PI / STEPS.ph + .01;
  out.length = 0; ctx.sndSteps(P);
  const thuds = out.filter(b => b.type === 'lowpass');
  ok(thuds.length === 1 + STEPS.n, 'a footfall of the player and of ' + STEPS.n + ' of the soldiers around (at most), not of the one 80 m off: ' + thuds.length + ' thuds');
  ok(out.every(b => b.vol > 0 && b.f > 0), 'each a thud with a scuff over it');
}
ok(/sndHands\(P\); sndCrack\(P, dt\); sndSteps\(P\);/.test(html), 'audioTick plays them for a soldier');
H.done();
