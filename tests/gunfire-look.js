'use strict';
/* the gunfire's look (cf-pol-graficos 3): every round in flight was a line of one pale colour, at full strength, so a firefight read as
   scratches of the same colour (and at night as a bright net), and no soldier showed where his shots came from. Now a round is a streak
   bright at the round and fading to its tail (the tracers' tc), one rifle round in TRC.every is a red-orange tracer with a glowing head
   (trcOf, picked once a round), and a soldier who has just fired shows a muzzle flash (mzAt) at his muzzle, where manFire lets the round
   go. The block lives in the 3D part of the page, which the harness does not load, so its pieces run here in a vm of their own */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const a = html.indexOf('const TRC = {'), b = html.indexOf('function pjTrail(', a);
if (a < 0 || b < 0) { console.log('no tracer streaks: a page before them'); process.exit(0); }
const ctx = vm.createContext({ Math, WeakMap, STANCE: [{ eye: 1.6 }, { eye: 1.1 }, { eye: .35 }], MAN: { sc: 1 } });
vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'gunfire.js' });
const TRC = ctx.$('TRC'), MZ = ctx.$('MZ'), trcOf = ctx.$('trcOf'), mzAt = ctx.$('mzAt');

console.log('-- a round: a streak, a tracer one in TRC.every --');
{
  const rs = Array.from({ length: 4000 }, () => ({ tr: 0 })), k = rs.map(trcOf), share = k.filter(t => t === 1).length / rs.length;
  ok(Math.abs(share - TRC.every) < .03 && k.every(t => t === 0 || t === 1), 'rifle rounds: ' + (share * 100).toFixed(1) + '% tracers (TRC.every ' + TRC.every + ')');
  ok(rs.every((r, i) => trcOf(r) === k[i]), 'each round keeps what it was picked as, frame after frame');
  ok(trcOf({ tr: 2 }) === 2 && trcOf({ tr: 1 }) === 2, 'a cannon\'s or an AA gun\'s glowing round stays one');
  ok([0, 1, 2].every(t => TRC.a[t] > TRC.tail[t] && TRC.len[t] > 0), 'every streak bright at the round and fainter at its tail');
  ok(TRC.a[0] < TRC.a[1] && TRC.len[0] < TRC.len[1], 'a plain round fainter and shorter than a tracer');
  ok(TRC.c[1][1] < .6 && TRC.c[1][2] < .3, 'a tracer red-orange');
}

console.log('-- a muzzle flash: at the muzzle, for MZ.t s after the shot --');
{
  const cam = { x: 0, y: 10, z: 0 }, m = { x: 100, y: 20, z: 0, st: 0, h: 0, f: { x: 0, y: 0, z: -1 }, shotT: 10 };
  const p = mzAt(m, 10.02, cam);
  ok(!!p && Math.abs(p[0] - 100) < 1e-9 && Math.abs(p[1] - (20 + 1.6 - .12)) < 1e-9 && Math.abs(p[2] + MZ.l) < 1e-9, 'where manFire lets the round go: the eye, then MZ.l m along the aim (' + (p && p.slice(0, 3).map(v => +v.toFixed(2))) + ')');
  ok(p[3] <= 1 && p[3] > .5 && mzAt(m, 10, cam)[3] === 1, 'biggest the frame of the shot, smaller after');
  ok(mzAt(m, 10 + MZ.t + .001, cam) === null && mzAt(m, 9.99, cam) === null, 'none before the shot or ' + MZ.t + ' s after it');
  ok(mzAt(Object.assign({}, m, { dead: true }), 10.02, cam) === null && mzAt(Object.assign({}, m, { in: {} }), 10.02, cam) === null, 'none for the dead or one aboard');
  ok(mzAt(Object.assign({}, m, { x: MZ.far + 50 }), 10.02, cam) === null, 'none past MZ.far');
  ok(mzAt(Object.assign({}, m, { shotT: undefined }), 10.02, cam) === null, 'none for one who never fired');
  const lie = mzAt(Object.assign({}, m, { st: 2 }), 10.02, cam);
  ok(lie && lie[1] < p[1] - 1, 'lower for one who lies');
}

console.log('-- the frame: the streaks are coloured per end, the flashes drawn --');
{
  const bw = html.slice(html.indexOf('function buildWorld() {'), html.indexOf('\n}\n', html.indexOf('function buildWorld() {')));
  ok(/bg\.setAttribute\('tc', new THREE\.BufferAttribute\(new Float32Array\(MAXB \* 8\), 4\)\)/.test(bw) && /attribute vec4 tc;/.test(bw), 'the tracers\' lines carry a colour and opacity per end (tc), which their shader reads');
  const sy = html.slice(html.indexOf('function syncScene(dt) {'), html.indexOf('\n}\n', html.indexOf('function syncScene(dt) {')));
  ok(/const t = trcOf\(b\)/.test(sy) && /tc\.set\(\[C\[0\], C\[1\], C\[2\], TRC\.a\[t\], C\[0\], C\[1\], C\[2\], TRC\.tail\[t\]\], n \* 8\)/.test(sy), 'each round\'s streak coloured by its kind');
  ok(/q\.k === 'tr'\) \{ if \(n < MAXB\) \{ bp\.set\([^;]*\); tc\.set\(/.test(sy), 'the other lines (tr parts) are given a colour too');
  ok(/attributes\.tc\.needsUpdate = true/.test(sy), 'and sent each frame');
  ok(/const p = mzAt\(m, S\.t, cam\)/.test(sy) && /if \(m === S\.my && fp\) continue;/.test(sy), 'the flashes drawn for every soldier but the player in first person (the weapon in hand has its own)');
}
done();
