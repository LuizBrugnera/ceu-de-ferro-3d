'use strict';
/* The controller layer with synthetic Gamepad objects: no device is needed. The PAD block of the page runs in a bare context where
   navigator.getGamepads is ours and the page's own functions it calls are recorders. What is checked is the mapping to S.input. */
const fs = require('fs'), path = require('path'), vm = require('vm'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- controllers (PAD)'), b = html.indexOf('\nlet lastT = 0;'), keys = /\nconst KEYS = \{[\s\S]*?\};/.exec(html)[0];
if (a < 0 || b < a) throw new Error('PAD block not found in ' + H.PAGE);
const calls = [], rec = n => (...v) => { calls.push([n, ...v]); }, store = {};
const elStub = () => new Proxy(function () {}, { get: (t, k) => (k === 'hidden' ? true : k === 'style' || k === 'dataset' ? {} : k === Symbol.iterator ? undefined : elStub()), set: () => true, apply: () => elStub() });
const ctx = vm.createContext({ console, performance: { now: () => T }, navigator: { getGamepads: () => PADS }, localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } },
  addEventListener: (n, f) => { (LS[n] || (LS[n] = [])).push(f); }, document: { hidden: false, activeElement: null, body: {}, querySelector: () => null, head: { append() {} }, createElement: () => elStub() }, KeyboardEvent: function () {}, Event: function () {} });
let T = 0, PADS = [], LS = {};
vm.runInContext(`'use strict'; const clamp = (v, a, b) => (v < a ? a : v > b ? b : v); let S = { input: {}, my: null, dr: null, aim: null, shake: 0 }, playMode = 'play', paused = false, ready = true, overShown = false, reduced = false, CAM = 0, SLOW = null;
const sw = { on: false }, GV = { on: false }, swEl = {}, overEl = {}, hangar = {}, camSt = { sens: 1 }, LEGEND = { plane: () => [['W', 'x']], inf: () => [['W', 'x']] }, KP = { hidden: true }, $ = () => KP, seatsOf = P => (P.fcm ? ['inf', 'fcm'] : ['inf']);
var frame = now => {}, setPause = v => { paused = v; }, txt = (s, ...r) => { LAST = s; }, buildHangar = () => { BH++; }, LAST = '', BH = 0;
function nextCam() { CMD.push('cam'); } function zoomBy() { CMD.push('zoom'); } function mapKey() { CMD.push('map'); } function openSwap() { CMD.push('swap'); } function keysPanel() {} const CMD = [];
const manEye = P => P, eye = P => P, lockOn = () => SLOW;` + keys + html.slice(a, b) + '\n;globalThis.$$ = s => eval(s);', ctx, { filename: 'pad.js' });
const $$ = ctx.$$, S = $$('S'), PAD = $$('PAD');
const btn = (p, v) => ({ pressed: !!p, value: v === undefined ? (p ? 1 : 0) : v });
const pad = (o) => { const g = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', axes: [0, 0, 0, 0], buttons: Array.from({ length: 17 }, () => btn(0)), vibrationActuator: { playEffect: (k, e) => { g.rumbles.push(e); return Promise.resolve(); } }, rumbles: [] }; return Object.assign(g, o); };
const radio = () => ({ id: 'OpenTX Radiomaster TX16S Joystick (Vendor: 1209 Product: 4f54)', index: 1, connected: true, mapping: '', axes: [-1, 0, 0, 0, -1, -1, 0, 0], buttons: Array.from({ length: 8 }, () => btn(0)) });
const poll = n => { for (let i = 0; i < (n || 1); i++) { T += 16; $$('frame')(T); } };
const man = { man: 1, kind: 'inf', ctl: {}, arms: [{ t: -9, d: {} }], hitT: -9, shotT: -9, def: {} }, plane = { ctl: { thr: .5 }, hitT: -9, shotT: -9, def: {} }, heli = { heli: 1, ctl: {}, hitT: -9, shotT: -9, def: {} }, tank = { kind: 'tank', ctl: {}, arms: [{ t: -9, d: { k: 'shell' } }], hitT: -9, def: {} };
const I = () => S.input;

console.log('-- a standard pad on foot: sticks, triggers, edges --');
let g = pad(); PADS = [g]; S.my = man; S.aim = { h: 0, d: { x: 1, y: 0, z: 0 } };
poll(); ok(PAD.last === 'kbm' && I().ax === undefined, 'an idle pad changes nothing: keyboard and mouse stay the device');
g.axes = [.6, -.9, .5, 0]; poll(3);
console.log('   left stick (.6, -.9) -> ax ' + I().ax.toFixed(2) + ', ay ' + I().ay.toFixed(2) + '; right stick .5 for 3 frames -> mx ' + I().mx.toFixed(1));
ok(PAD.last === 'pad' && I().ax > .4 && I().ax < .6 && I().ay < -.8 && I().mx > 0 && !I().my, 'the left stick moves, the right stick is the aim');
g.buttons[7] = btn(1, .8); poll(); const f1 = I().fire; g.buttons[7] = btn(0, .1); poll(); ok(f1 === true && I().fire === false, 'RT past its threshold fires, released it stops');
I().up = true; g.buttons[2] = btn(1); poll(); g.buttons[2] = btn(0); poll(3); ok(I().up === true && I().reload === false, 'a key held on the keyboard survives the pad: buttons are written on edges only');
g.axes = [.08, .1, 0, 0]; poll(); ok(I().ax === 0 && I().ay === 0, 'inside the dead zone the stick is zero');
const cv = $$('padCurve'); ok(cv(.5, .12, 0) > cv(.5, .12, .6) && Math.abs(cv(1, .12, .6) - 1) < 1e-9 && cv(-.5, .12, .3) === -cv(.5, .12, .3), 'expo softens the middle and keeps the ends; the curve is odd');

console.log('-- plane: classic and mouse-aim schemes, throttle, commands --');
S.my = plane; S.aim = null; g.axes = [.5, .7, -.6, 0]; g.buttons[7] = btn(1, 1); g.buttons[0] = btn(1); g.buttons[12] = btn(1); poll();
ok(I().ax > .3 && I().ay > .5 && I().az < -.4 && I().thrUp === true && I().fire === true && $$('CMD').pop() === 'cam', 'left stick roll and pull, right stick rudder, RT throttle up, A the gun, d-pad up the camera');
g.buttons[7] = btn(0); g.buttons[0] = btn(0); g.buttons[12] = btn(0); g.axes = [0, 0, 0, -.9]; poll(); ok(I().thrUp === false && I().lookU === true, 'right stick up looks up in the cockpit');
PAD.dev[g.id].invPitch = true; g.axes = [0, .7, 0, 0]; poll(); ok(I().ay < -.5, 'pitch inverted per device'); PAD.dev[g.id].invPitch = false;
PAD.dev[g.id].thrStick = true; g.axes = [0, 0, 0, -1]; poll(10); ok(I().thr > .5 && I().thr < .7, 'option: the right stick moves the throttle (' + I().thr.toFixed(2) + ' after 10 frames from .5)'); PAD.dev[g.id].thrStick = false;
S.aim = { h: 0, d: { x: 1, y: 0, z: 0 } }; I().mx = 0; g.axes = [.5, 0, .8, 0]; poll(); ok(I().mx > 0 && I().az === 0 && I().ax > .3, 'mouse-aim scheme: the right stick moves the aim, the left still rolls');

console.log('-- helicopter: default and mode 2 --');
S.my = heli; S.aim = null; g.axes = [.4, -.8, .5, -.7]; poll(); const h1 = Object.assign({}, I());
PAD.dev[g.id].mode2 = true; poll(); const h2 = Object.assign({}, I()); PAD.dev[g.id].mode2 = false;
ok(h1.ax > .2 && h1.ay < -.6 && h1.az > .3 && h1.col > .5, 'left stick cyclic, right stick pedals and collective'); ok(h2.col > .6 && h2.az > .2 && h2.ax > .3 && h2.ay < -.5, 'mode 2: collective and pedals on the left, cyclic on the right');
g.buttons[4] = btn(1); g.buttons[2] = btn(1); poll(); ok(I().brake === true && I().mlock === true, 'LB hover hold, X the missile mode'); g.buttons[4] = btn(0); g.buttons[2] = btn(0); poll();

console.log('-- ground: drive, aim slowdown on a target, fire-control map on a touch of Back --');
S.my = tank; S.aim = { h: 0, d: { x: 1, y: 0, z: 0 } }; g.axes = [0, -1, 1, 0]; I().mx = 0; poll(); const fast = I().mx; ctx.$$('SLOW = {}'); I().mx = 0; g.axes = [0, -1, 1, .01]; poll(); const slow = I().mx; ctx.$$('SLOW = null');
ok(I().ay < -.9 && fast > 0 && Math.abs(slow / fast - PAD.slow) < .02, 'left stick drives; over a target the aim turns at ' + PAD.slow + ' of its rate, and nothing pulls it');
tank.fcm = 1; g.buttons[8] = btn(1); poll(2); g.buttons[8] = btn(0); poll(); const c1 = $$('CMD').pop(); g.buttons[8] = btn(1); poll(40); const c2 = $$('CMD').pop(); g.buttons[8] = btn(0); poll(); tank.fcm = 0;
ok(c1 === 'map' && c2 === 'swap', 'with a fire-control map Back opens it on a touch and the picker when held');

console.log('-- rumble --');
g.rumbles.length = 0; tank.hitT = 5; poll(); const r1 = g.rumbles.length; poll(5); tank.arms[0].t = 6; T += 100; poll(); ok(r1 === 1 && g.rumbles.length === 2 && g.rumbles[1].strongMagnitude > .8, 'a hit taken and the main gun each shake it once');
ctx.$$('reduced = true'); tank.hitT = 7; T += 100; poll(); ok(g.rumbles.length === 2, 'nothing under reduced motion'); ctx.$$('reduced = false');
PAD.dev[g.id].rumble = false; tank.hitT = 8; T += 100; poll(); ok(g.rumbles.length === 2, 'nothing with the toggle off'); PAD.dev[g.id].rumble = true;

console.log('-- drone on a pad: assisted, then acro on mode-2 sticks --');
S.my = man; S.dr = { def: { tw: 4 }, mode: 0 }; g.axes = [0, -1, 0, 0]; poll(); ok(I().ay < -.9 && I().thr === undefined, 'assisted: the left stick is forward and sideways');
S.dr.mode = 2; g.axes = [.5, 0, .3, -.6]; poll(); const t0 = I().thr; g.axes = [0, -1, 0, 0]; poll(); const t1 = I().thr; g.axes = [0, 1, 0, 0]; poll();
ok(Math.abs(t0 - .25) < 1e-6 && t1 === 1 && I().thr === 0, 'acro: a centred left stick is the hover throttle (' + t0 + '), full up 1, full down 0');
g.buttons[1] = btn(1); poll(); ok(I().mlock === true, 'B takes the goggles off'); g.buttons[1] = btn(0); poll(); S.dr = null;

console.log('-- pause guard --');
ctx.$$('paused = false'); $$('setPause')(true); const p1 = $$('paused'); PAD.last = 'kbm'; $$('setPause')(true); const p2 = $$('paused'); ctx.$$('paused = false'); PAD.last = 'pad';
ok(p1 === false && p2 === true, 'with a pad in use the wait for a mouse click never pauses the game; with the keyboard it still does');

console.log('-- an FPV radio: generic HID, eight axes, wizard, calibration, presets --');
const r = radio(); PADS = [g, r]; g.axes = [0, 0, 0, 0]; poll();
const pr = $$('padProfile')(r); ok(pr.type === 'radio' && pr.ch.roll[0] === 0 && pr.ch.thr[0] === 2, 'a non-standard device with four axes or more starts as a radio, AETR');
r.axes[0] = -1;
PAD.wiz = { id: r.id, i: 0, rest: r.axes.slice(), b0: r.buttons.map(q => q.pressed), got: {}, sw: [], wait: false }; $$('padWizNext')();
const mv = (i, v) => { const o = r.axes[i]; r.axes[i] = v; poll(2); return () => { r.axes[i] = o; poll(2); }; };
mv(0, 1);   // throttle on axis 0 (TAER), stays up
mv(3, 1)(); mv(2, -1)(); mv(1, 1)();   // yaw right on 3, pitch forward reads negative on 2, roll right on 1
r.axes[5] = 1; poll(2); r.buttons[3] = btn(1); poll(2);
console.log('   wizard: ' + JSON.stringify(pr.ch) + ' switches ' + JSON.stringify(pr.sw) + ', done: ' + (PAD.wiz === null));
ok(PAD.wiz === null && pr.ch.thr[0] === 0 && pr.ch.yaw[0] === 3 && pr.ch.pitch[0] === 2 && pr.ch.pitch[1] === 1 && pr.ch.roll[0] === 1 && pr.sw.arm === 'a5+' && pr.sw.mode === 'b3', 'the wizard finds each channel, its direction and the two switches');
pr.cal = []; pr.cal[1] = [-.8, .02, .82]; pr.cal[0] = [-.9, 0, .9];
r.axes = [.9, .82, .6, -.5, -1, 1, 0, 0]; r.buttons[3] = btn(0); const R = $$('padRead')(r, pr);
console.log('   read: roll ' + R.roll.toFixed(2) + ', pitch ' + R.pitch.toFixed(2) + ', yaw ' + R.yaw.toFixed(2) + ', thr ' + R.thr.toFixed(2) + ', arm ' + R.arm + ', mode ' + R.mode);
ok(Math.abs(R.roll - 1) < 1e-6 && R.pitch < -.4 && R.yaw < -.3 && Math.abs(R.thr - 1) < 1e-6 && R.arm === true && R.mode === false, 'calibrated ends reach full travel, a reversed channel is reversed, the throttle is 0 to 1');
S.my = man; S.dr = { def: { tw: 4 }, mode: 2 }; r.axes[0] = -.9; poll(2);
ok(PAD.last === 'radio' && I().thr === 0 && I().dmode === 2 && I().arm === true && Math.abs(I().ax - 1) < 1e-6 && I().ay > .4, 'drone: the four channels as rates and thrust, acro, armed by the switch');
r.buttons[3] = btn(1); r.axes[5] = -1; poll(); ok(I().dmode === 1 && I().arm === false, 'mode switch: angle; arm switch off: safe');
S.dr = null; S.my = plane; S.aim = null; r.axes[0] = .45; poll(); ok(I().raw === true && Math.abs(I().thr - .75) < .01 && I().az < -.3, 'plane: throttle as the place of the stick, sticks direct');
S.my = heli; r.axes[0] = 0; poll(); const c0 = I().col; r.axes[0] = .9; poll(); ok(c0 === 0 && I().col > .9 && I().thr === undefined, 'helicopter: collective, holding in the middle of the stick');
pr.aux[0] = ['a6+', 'fire']; r.axes[6] = 1; poll(); const a1 = I().fire; r.axes[6] = -1; poll(); ok(a1 === true && I().fire === false, 'a spare switch mapped to fire');
const O = $$('PORD'); ok(O.AETR.join() === '0,1,2,3' && O.TAER.join() === '1,2,0,3', 'the channel-order shortcuts: AETR and TAER');

console.log('-- hot-plug, several devices, persistence, glyphs --');
g.buttons[0] = btn(1); S.my = man; S.aim = { h: 0, d: { x: 1, y: 0, z: 0 } }; poll(); ok(PAD.last === 'pad' && PAD.cur === g.id && I().thr === undefined && I().raw === undefined, 'the device last touched takes over and the other one\'s names are cleared'); g.buttons[0] = btn(0); poll();
g.axes = [.7, 0, 0, 0]; poll(); PADS = [null, r]; LS.gamepaddisconnected.forEach(f => f({ gamepad: g })); poll(); ok(PAD.last === 'kbm' && I().ax === 0, 'unplugged in mid-stick: its axes go back to zero and the keyboard is the device again');
$$('padSave')(); const saved = JSON.parse(store[PAD.key]); ok(saved[r.id].ch.thr[0] === 0 && saved[g.id].type === 'pad', 'profiles are kept per device id in localStorage');
PADS = [g, r]; g.axes = [0, 0, 0, 0]; g.buttons[0] = btn(1); poll(); g.buttons[0] = btn(0); poll();
$$('txt')('R: RECARREGAR', 0, 0, 1, '#fff'); const t1s = $$('LAST'); $$('txt')('E ENTRAR (MOTORISTA): Jeep', 0, 0, 1, '#fff'); const t2s = $$('LAST'); $$('padLegends')(); const rows = $$('LEGEND').inf({}, {});
console.log('   "' + t1s + '", "' + t2s + '", legend: ' + rows.slice(0, 4).map(q => q[0]).join(', ') + ' …');
ok(t1s === 'Ⓧ: RECARREGAR' && t2s.startsWith('Ⓐ ENTRAR') && rows[0][0] === 'Stick esquerdo' && rows.some(q => q[0] === 'RT'), 'prompts and the legend use the glyphs of the pad');
PAD.last = 'kbm'; $$('txt')('R: RECARREGAR', 0, 0, 1, '#fff'); ok($$('LAST') === 'R: RECARREGAR' && $$('LEGEND').inf({}, {})[0][0] === 'W', 'and the keys again with the keyboard');
H.done();
