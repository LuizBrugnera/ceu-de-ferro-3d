'use strict';
/* cf-pol2 P22 and P23: the pause menu and the options. A match is always a room on the server (launch: net), and setPause gave up online:
   P and Esc showed nothing. There was no mouse sensitivity, no volume, the sound's on/off was not kept, and the graphics' quality was
   hidden in Partida. This reads the page (the menu and the options live in the 3D part, which the harness does not load) and runs the
   options' own block on a stand-in page: the menu opens on P and Esc (the mouse let go) without stopping the room, has the keys while it
   is open, continue, options, controls and leave; the options keep the sensitivity, the volume and the sound in this browser and apply them.
   node tests/pausa.js */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
const fn = name => { const a = html.indexOf('function ' + name + '('); return a < 0 ? '' : html.slice(a, html.indexOf('\n}\n', a) + 2); };
const sp = fn('setPause');
ok(sp && !/S\.net\) return/.test(sp) && /pauseMenu\(v\)/.test(sp), 'setPause no longer gives up online, and opens the menu');
ok(/if \(!\(\(paused && !\(playMode === 'play' && S\.net\)\) \|\| sw\.freeze/.test(html), 'the menu does not stop the room\'s world (an online match goes on)');
ok(/<section class="pick pm" id="pauseMenu"/.test(html) && ['pmGo', 'pmOptB', 'pmKeysB', 'pmLeave'].every(id => html.includes('id="' + id + '"')), 'the menu: continue, options, controls, leave');
ok(/if \(paused\) \{ if \(\(e\.code === 'KeyP'[^\n]*setPause\(false\)[^\n]*return; \}/.test(html) && html.indexOf("if (paused) { if ((e.code === 'KeyP'") < html.indexOf("if (e.code === 'KeyH') { if (!e.repeat) openSwap(); return; }"), 'while it is open the keys are the menu\'s (P and Esc close it, H and the rest wait)');
ok(/document\.pointerLockElement !== cv && playMode === 'play' && S\.aim && !sw\.on && !GV\.on && !BM\.on\) \{ S\.input = \{\}; setPause\(true\); \}/.test(html), 'Esc lets the mouse go and that opens it');
ok(/e\.movementX \* camSt\.sens \* OPT\.sens/.test(html) && /e\.movementY \* camSt\.sens \* OPT\.sens/.test(html), 'the mouse\'s sensitivity is applied to the aim');
ok(/A\.master\.gain\.value = sndGain\(\);/.test(fn('audioInit')), 'the sound starts at the volume chosen');
{ const sa = html.indexOf('/* ---------- sound ----------'), sb = html.indexOf('/* ---------- interface ---------- */'), g0 = html.indexOf('function sndGain(');
  ok(g0 > sa && g0 < sb, 'sndGain is in the sound block, which tests/som.js runs alone (audioInit must not need the options block)'); }
ok(/id="btnOpt"/.test(html) && /<aside class="kp" id="optPanel"/.test(html), 'the hangar has an Opções chip and panel');
ok(/const o = document\.getElementById\('optGfxN'\); if \(o && o\.parentNode\) o\.parentNode\.insertBefore\(seg, o\)/.test(html), 'the graphics\' quality is in Opções, no longer hidden in Partida');
/* the options' block, run on a stand-in page: what it reads and keeps */
const a = html.indexOf('const OPT = {'), b = html.indexOf('/* the hangar\'s Opções panel', a);
ok(a > 0 && b > a, 'the options block is there');
const store = { 'ceu-de-ferro-3d-opcoes': JSON.stringify({ sens: 9, vol: .4, snd: false }) };
const el = () => { const o = { value: '', textContent: '', disabled: false, checked: false, children: [], ev: {}, append(c) { this.children.push(c); }, addEventListener(k, f) { this.ev[k] = f; }, querySelector(q) { return (o.q[q] || (o.q[q] = el())); }, q: {} }; return o; };
const nodes = {}, $ = q => nodes[q] || (nodes[q] = el());
const ctx = vm.createContext({ clamp: (v, x, y) => (v < x ? x : v > y ? y : v), localStorage: { getItem: k => store[k] || null, setItem: (k, v) => { store[k] = v; } }, document: { createElement: () => el() }, $, A: { on: true, ctx: null, vol: 1 }, playMode: 'demo', audioInit() {} });
vm.runInContext(fn('sndGain') + html.slice(a, b) + '\n;globalThis.T = { OPT, sndGain, optBox, sndSet };', ctx);   // sndGain lives in the sound block (its own suite, som, runs that block alone)
const T = ctx.T;
ok(T.OPT.sens === 3 && T.OPT.vol === .4 && ctx.A.vol === .4 && ctx.A.on === false, 'kept settings come back to the options and the sound (A.vol ' + ctx.A.vol + '), the sensitivity held to its range (' + T.OPT.sens + '×, volume ' + T.OPT.vol + ', sound ' + (ctx.A.on ? 'on' : 'off') + ')');
ok(T.sndGain() === 0, 'sound off: silent');
T.sndSet(true); ok(Math.abs(T.sndGain() - .6 * .4) < 1e-9 && JSON.parse(store['ceu-de-ferro-3d-opcoes']).snd === true, 'sound on: the master at .6 × the volume, and it is kept');
const sens = T.optBox.querySelector('#optSens'); sens.ev.input({ target: { value: '1.5' } });
ok(T.OPT.sens === 1.5 && JSON.parse(store['ceu-de-ferro-3d-opcoes']).sens === 1.5, 'the sensitivity slider sets and keeps it');
const vol = T.optBox.querySelector('#optVol'); vol.ev.input({ target: { value: '80' } });
ok(T.OPT.vol === .8 && ctx.A.vol === .8 && JSON.parse(store['ceu-de-ferro-3d-opcoes']).vol === .8, 'the volume slider sets the sound\'s volume and keeps it');
/* the other keys' listeners (radio 8 9, night vision 6, recruit I, the scoreboard's Tab...) did not look at paused: one listener in the
   capture phase stops them all while the menu is open, and lets P and Esc through */
const g = /addEventListener\('keydown', e => \{ if \(paused && playMode === 'play' && e\.code !== 'KeyP' && e\.code !== 'Escape'\) e\.stopPropagation\(\); \}, true\);/.exec(html);
ok(!!g, 'while the menu is open a capture listener holds every other key (P and Esc pass)');
if (g) {
  const seen = [], win = { L: { cap: [], bub: [] }, addEventListener(t, f, c) { this.L[c ? 'cap' : 'bub'].push(f); } };
  const C2 = vm.createContext({ addEventListener: win.addEventListener.bind(win), paused: true, playMode: 'play' }); vm.runInContext(g[0], C2);
  win.addEventListener('keydown', e => seen.push(e.code));
  const press = code => { let stop = false; const e = { code, stopPropagation() { stop = true; } }; win.L.cap.forEach(f => f(e)); if (!stop) win.L.bub.forEach(f => f(e)); };
  ['Digit8', 'Digit6', 'KeyI', 'Tab', 'KeyP', 'Escape'].forEach(press);
  ok(seen.join() === 'KeyP,Escape', 'paused: 8, 6, I and Tab are held, P and Esc reach the game (' + seen.join() + ')');
  C2.paused = false; seen.length = 0; press('Digit8'); ok(seen.join() === 'Digit8', 'not paused: the keys go on as before');
}
done();
