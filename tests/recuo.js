'use strict';
/* cf-pol2 P5: recoil and spread. The kick was the camera's alone (0,007 rad for 0,15 s), the spread did not open in a burst, and the
   HUD's cross left suppression out. Now: each rifle round opens the next one's spread (a.bl, MAN.bloom), which falls back once the
   trigger rests; the player's aim rises a little a round (MAN.climb), less lying and on the sights, and he pulls it down; one rule
   (manSpread) gives the round its spread and the cross its size, suppression included.
   node tests/recuo.js */
const fs = require('fs'), H = require('./harness.js'), { load, ok, done } = H;
const C = load({ seed: 7 }), $ = C.$, MAN = $('MAN'), INF = $('INF'), SUP = $('SUP');
const S = C.sandbox('modern'); S.over = false; S.waveTimer = S.planT = 1e9;
const B = S.base[0], P = C.addMan(INF.modern[0][0], 0, B.x + 200, B.z + 200, 0); P.ai = null; P.me = 1; P.inv = 1e9;
S.my = P; S.me = 0; S.cls = 'inf'; S.input = {}; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } };
const a = P.arms[0], w = a.d, sp = () => C.manSpread(P, a);
ok(w.auto && !w.k, 'the rifleman\'s first weapon is an automatic rifle (' + w.name + ')');
C.run(.5); const base = sp();
/* a burst of 10 */
let n0 = a.mag, p0 = S.aim.p; S.input.fire = true; const sps = [];
C.run(3, () => { sps.push(sp()); if (n0 - a.mag >= 10) return false; }); S.input.fire = false;
const fired = n0 - a.mag, top = Math.max(...sps), climb = S.aim.p - p0;
ok(fired >= 10, 'a burst of ' + fired + ' rounds');
ok(top > base * 1.6 && top <= base * (1 + MAN.bloom.max) * 1.001, 'the spread opens in the burst: ' + (base * 1e3).toFixed(2) + ' to ' + (top * 1e3).toFixed(2) + ' mrad, never past ' + (1 + MAN.bloom.max) + '×');
ok(climb > .03 && climb < .12, 'the aim rose ' + (climb * 57.3).toFixed(1) + '° over the burst (the player pulls it down)');
C.run(1.5); ok(Math.abs(sp() - base) < base * .02, 'the trigger rests 1,5 s: the spread is back (' + (sp() * 1e3).toFixed(2) + ' mrad)');
/* lying and on the sights it climbs less */
P.ctl.st = 2; C.run(2); a.mag = w.mag; n0 = a.mag; p0 = S.aim.p; S.input.fire = true; S.input.ordA = true;
C.run(3, () => { if (n0 - a.mag >= 10) return false; }); S.input.fire = false; S.input.ordA = false;
const climb2 = S.aim.p - p0;
ok(climb2 > 0 && climb2 < climb * .5, 'lying and on the sights it rose ' + (climb2 * 57.3).toFixed(1) + '° (standing ' + (climb * 57.3).toFixed(1) + '°)');
/* suppression opens the round and the cross alike */
C.run(1.5); const s0 = sp(); P.sup = S.t + 3; const s1 = sp(); P.sup = -9;
ok(Math.abs(s1 / s0 - SUP.sp) < 1e-9, 'suppressed: the spread ×' + SUP.sp + ' (' + (s1 / s0).toFixed(2) + ')');
const html = fs.readFileSync(H.PAGE, 'utf8'), hm = html.slice(html.indexOf('function hudMan('), html.indexOf('\n}\n', html.indexOf('function hudMan(')));
ok(/manSpread\(P, a\)/.test(hm), 'the HUD\'s cross is sized by manSpread (bloom and suppression in it)');
/* the AI's rounds go through the same rule */
const mf = html.slice(html.indexOf('function manFire('), html.indexOf('\n}\n', html.indexOf('function manFire(')));
ok(/const s = manSpread\(m, a\)/.test(mf), 'every soldier\'s round takes its spread from manSpread');
done();
