'use strict';
/* cf-pol2 P3: the stance keys. Z cycled stand, crouch, prone, so a crouched soldier stood up through prone (~1,35 s, the eye going down
   before it came up). Now X crouches (again: up) and held MAN.xHold s lies down (a pad's one stance button), Z lies down (again: up), and
   Shift stands up, except in a sniper's scope, where it holds the breath. A crouch to standing is one step of MAN.stT and never passes
   through prone; the camera eases the eye over the step (the 3D part: checked in its source here).
   node tests/postura.js */
const fs = require('fs'), H = require('./harness.js'), { load, ok, done } = H;
const C = load({ seed: 3 }), $ = C.$, MAN = $('MAN'), INF = $('INF'), SNIPERS = $('SNIPERS');
const S = C.sandbox('modern'); S.over = false; S.waveTimer = S.planT = 1e9;
const B = S.base[0], P = C.addMan(INF.modern[0][0], 0, B.x + 200, B.z + 200, 0); P.ai = null; P.me = 1; P.inv = 1e9;
S.my = P; S.me = 0; S.cls = 'inf'; S.input = {}; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } };
const I = S.input, sts = [];
const tap = (k, hold = 1 / 60) => { I[k] = true; C.run(hold, () => { sts.push(P.st); }); I[k] = false; C.run(1 / 60); };
const settle = () => C.run(MAN.stT * 3, () => { sts.push(P.st); });
const go = (k, hold) => { sts.length = 0; tap(k, hold); settle(); return sts.slice(); };

let l = go('brake');
ok(P.ctl.st === 1 && P.st === 1, 'X crouches (ctl ' + P.ctl.st + ', stance ' + P.st + ')');
l = go('brake');
ok(P.ctl.st === 0 && P.st === 0 && !l.includes(2), 'X again stands up, straight from the crouch, never through prone (' + [...new Set(l)].join(' > ') + ')');
go('brake'); const cr = P.st; sts.length = 0; const s0 = S.t; let back = null; tap('thrUp'); C.run(MAN.stT * 3, () => { if (back === null && P.st === 0) back = S.t; });
ok(cr === 1 && P.st === 0 && back !== null && back - s0 <= MAN.stT + .05, 'Shift stands up from a crouch in one step (' + (back - s0).toFixed(2) + ' s, the cycle on Z took ~1,35 s)');
l = go('thrDown');
ok(P.ctl.st === 2 && P.st === 2, 'Z lies down (stance ' + P.st + ')');
l = go('thrDown');
ok(P.ctl.st === 0 && P.st === 0, 'Z again stands up (stance ' + P.st + ')');
go('thrDown'); go('thrUp');
ok(P.st === 0, 'Shift stands up from prone (stance ' + P.st + ')');
l = go('brake', MAN.xHold + .1);
ok(P.ctl.st === 2 && P.st === 2, 'X held ' + MAN.xHold + ' s lies down (a pad\'s stance button)');
l = go('brake', MAN.xHold + .1);
ok(P.ctl.st === 1 && P.st === 1, 'from prone X crouches, and held does not drop back to prone (stance ' + P.st + ')');
go('brake');
/* Shift while running does not touch the stance; in a sniper's scope it holds the breath and the soldier stays down */
const sn = C.addMan(Object.keys(SNIPERS.modern[0])[0], 0, B.x + 240, B.z + 200, 0); sn.ai = null; sn.me = 1; sn.inv = 1e9;
S.my = sn; const P0 = P; go('thrDown');
ok(sn.st === 2, 'the sniper lies down with Z');
I.ordA = true; C.run(.3); tap('thrUp', .5); I.ordA = false; settle();
ok(sn.st === 2 && sn.ctl.st === 2, 'Shift in the scope holds the breath: the sniper stays prone (stance ' + sn.st + ')');
S.my = P0;
const html = fs.readFileSync(H.PAGE, 'utf8'), pinf = (html.match(/\n  inf: \{ yawR: 0,[^}]*\}/) || [''])[0];
ok(/brake: 1\b/.test(pinf) && !/thrDown/.test(pinf), 'the pad\'s stance button is X\'s (PBTN.inf brake 1): crouch, held prone');
/* the camera eases the eye over a change of stance */
const a = html.indexOf('function updateCamera('), cam = html.slice(a, html.indexOf('\n}\n', a));
ok(/camSt\.sy = camSt\.sp === p \?[^;]*\* Math\.min\(1, dt \* 8\)/.test(cam) && /e\.y \+= camSt\.sy - ey/.test(cam), 'the first- and third-person eye moves to a new stance\'s height over the step (camSt.sy)');
done();
