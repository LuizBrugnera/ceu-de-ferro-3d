'use strict';
/* The battle's clock against the frames (CLK) and the soldier's mind at its own cadence (MANB): a slow host no longer plays the battle in slow
   motion, and the soldiers' minds, the most of a step, run 30 times a second of battle whatever the steps. Nothing here times the machine:
   the cost of a step is handed to CLK by hand */
const H = require('./harness'), fs = require('fs'), ok = H.ok;

console.log('-- the frame loop of the page steps by CLK, not by a step of .05 s at most --');
{
  const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('function frame(now)'), f = html.slice(a, html.indexOf('\n}\n', a));
  ok(a > 0 && /CLK\.plan\(/.test(f) && /CLK\.cost\(/.test(f), 'frame() asks CLK for its steps and tells it what they cost');
  ok(!/Math\.ceil\(dt \* k \/ \.017\)/.test(f), 'and no longer cuts the battle to .05 s a frame');
}

console.log('-- CLK: the battle keeps to the clock as the frames slow down --');
{
  const C = H.load({ seed: 1 }), K = C.$('CLK'), run = (fps, secs, c, k) => {   // secs of real time at fps frames a second, each step costing c ms
    K.c = 0; let g = 0, n = 0, dmax = 0;
    for (let i = 0; i < Math.round(secs * fps); i++) { const p = K.plan(1 / fps, k); g += p.n * p.d; n += p.n; dmax = Math.max(dmax, p.d); K.cost(p.n * c, p.n); }
    return { g, n, ratio: g / secs, dmax };
  };
  let r = run(60, 10, 1);
  ok(Math.abs(r.ratio - 1) < 1e-6 && r.n === 600 && Math.abs(r.dmax - 1 / 60) < 1e-9, 'at 60 frames a second: real time, one step of 1/60 s a frame, as before');
  r = run(30, 10, 1);
  ok(Math.abs(r.ratio - 1) < 1e-6 && r.n === 600, 'at 30: two steps a frame, as before (' + r.n + ' steps in 10 s)');
  r = run(4, 10, 2);
  ok(Math.abs(r.ratio - 1) < 1e-6 && r.dmax <= 1 / 60 + 1e-6, 'at 4 frames a second with cheap steps: real time (' + r.ratio.toFixed(2) + 'x, before .2x), in steps of 1/60 s');
  r = run(10, 10, 30);
  ok(Math.abs(r.ratio - 1) < 1e-6 && Math.abs(r.dmax - K.hmax) < 1e-9 && r.n <= 100 * Math.floor(K.budget / 30) + 6, 'at 10 frames a second with steps of 30 ms: real time (before .5x), in ' + (r.n / 100).toFixed(1) + ' steps a frame of 1/30 s, ' + Math.floor(K.budget / 30) * 30 + ' ms of the budget of ' + K.budget);
  r = run(4, 10, 30);
  ok(Math.abs(r.ratio - 4 * Math.floor(K.budget / 30) * K.hmax) < .03 && r.ratio > .2 * 1.9, 'at 4 frames a second with steps of 30 ms: ' + r.ratio.toFixed(2) + 'x (before .2x, and three steps a frame then too): the budget spent on longer steps');
  r = run(4, 10, 2 * K.budget);
  ok(r.n <= 40 * 2 + Math.ceil(K.catch / K.h) && r.dmax <= K.hmax + 1e-9 && r.ratio >= 4 * K.least - 1e-6, 'a step dearer than the whole budget: two a frame of 1/30 s, never less battle a frame than the .05 s of before (' + r.ratio.toFixed(2) + 'x, before .2x)');
  r = run(2, 10, 2);
  ok(Math.abs(r.ratio - K.catch * 2) < 1e-6, 'below ' + 1 / K.catch + ' frames a second it slows down, no more than catch a frame (' + r.ratio.toFixed(2) + 'x at 2 frames a second)');
  const p = K.plan(30, 1);
  ok(Math.abs(p.g - K.catch) < 1e-9, 'a stall of 30 s (a tab put away) comes back as ' + K.catch + ' s of battle, not a burst');
  r = run(60, 10, 1, 4);
  ok(Math.abs(r.ratio - 4) < 1e-6 && r.dmax <= .017 + 1e-9, 'the watch at x4: 4 s of battle a second, steps as short as before');
}

console.log('-- MANB: a soldier\'s mind 30 times a second of battle, his body every step --');
{
  const C = H.load({ seed: 4 }), $ = C.$, S = C.sandbox('ww2'), r = S.T.routes[0], s = r.len / 2, p = $('routeAt')(r, s);
  S.over = false; S.demo = false; S.waveTimer = S.planT = 1e9; S.base[0].hp = S.base[1].hp = 1e9; S.my = null; C.director = () => {};
  C.run(.05);
  const q = C.addSquad(0, p.x + 20, p.z, 0, s); C.setOrd(q, { k: 'hold', ri: 0, s, x: p.x - 60, z: p.z, R: 8 });   // they walk to a post 80 m off
  const calls = new Map(); C.__n = (m, dt) => { const l = calls.get(m) || []; l.push(dt); calls.set(m, l); };
  $('aiMan = (f => function (m, dt) { __n(m, dt); return f(m, dt); })(aiMan)');
  const m = q.men[0], off = () => Math.hypot(m.x - (p.x - 60), m.z - p.z), d0 = off();
  C.run(2);
  const per = [...calls.values()].map(l => l.length), sum = [...calls.values()].map(l => l.reduce((a, b) => a + b, 0));
  ok(per.length === q.men.length && per.every(n => n >= 59 && n <= 61), 'at 60 steps a second each of ' + per.length + ' soldiers thinks ' + Math.min(...per) + ' to ' + Math.max(...per) + ' times in 2 s (every step: 120)');
  ok(sum.every(t => t > 2 - 1 / 30 - 1e-6 && t <= 2 + 1e-6), 'with the time since the last: ' + Math.min(...sum).toFixed(3) + ' s of the 2 s handed on');
  calls.clear(); const each = []; let k0 = 0;
  C.run(1, () => { let n = 0; for (const l of calls.values()) n += l.length; each.push(n - k0); k0 = n; });
  ok(Math.max(...each) - Math.min(...each) <= 1, 'the halves take turns: ' + Math.min(...each) + ' to ' + Math.max(...each) + ' minds a step, not all of them every other step');
  calls.clear(); C.run(1, null, 1 / 30);
  ok([...calls.values()].every(l => l.length === 30), 'at 30 steps a second (CLK under load): once a step, the same 30 times');
  ok(d0 - off() > 4 && !H.nan(S), 'and they walk to their post (' + Math.round(d0) + ' m off it, ' + Math.round(off()) + ' m after 4 s)');
}

console.log('-- what flies keeps its hops of 1/60 s in a longer step --');
{
  const C = H.load({ seed: 6 }), S = C.newState('modern', null, { watch: 1 }), hops = [];
  C.__h = dt => hops.push(dt); C.$('stepShots = (f => function (dt) { __h(dt); return f(dt); })(stepShots)');
  C.run(1 / 60, null, 1 / 60); const a = hops.splice(0);
  C.run(1 / 30, null, 1 / 30); const b = hops.splice(0);
  ok(a.length === 1 && Math.abs(a[0] - 1 / 60) < 1e-9, 'a step of 1/60 s: one hop, as before');
  ok(b.length === 2 && b.every(d => Math.abs(d - 1 / 60) < 1e-9), 'a step of 1/30 s (CLK under load): two hops of 1/60 s, so a round at 900 m/s still moves 15 m a hop past a vehicle or a plane');
  C.run(3, null, 1 / 30);
  ok(!H.nan(S) && !C.$('S').over, 'a modern battle in steps of 1/30 s goes on (' + C.$('S').men.length + ' soldiers)');
}
H.done();
