'use strict';
/* the sound (SND, cf-pol-armas): the soldier's footfalls and his grenade thrown; a burst close by deafens for a moment, the AA gun and the flares heard; the others heard (the nearest vehicles and aircraft, by distance, with the Doppler of a fly-by), a ground vehicle's engine through its gears, its tracks and its turret's servo; the shots by their voice, distance and the speed of sound, the player's own gun never held back by the
   AI's (one AI shot 55 ms before took the player's), the launches by distance (one across the map was as loud as one beside the ear), the
   bursts late and dull far away, the compressor on the master, the soldier's hands (reload, bolt, empty click, swap) and the crack of a
   foe's round passing the head. The block lives in the 3D part of the page, which the harness does not load: it runs here on its own over a
   recording AudioContext, with calOf and manEye from the simulation */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- sound ----------'), b = html.indexOf('/* ---------- interface ---------- */');
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0 || html.indexOf('const SND = {', a) < 0 || html.indexOf('const SND = {', a) > b) { console.log('no SND: a page before it'); process.exit(0); }
const sim = H.load(), SARMS = sim.$('SARMS');

/* a recording AudioContext: every node made, with what was set on it and when */
function ctxRec() {
  const C = { currentTime: 0, sampleRate: 8000, state: 'running', nodes: [], destination: { kind: 'dest' } };
  const param = v => ({ value: v, ev: [], setValueAtTime(x, t) { this.ev.push(['set', x, t]); }, exponentialRampToValueAtTime(x, t) { this.ev.push(['exp', x, t]); }, linearRampToValueAtTime(x, t) { this.ev.push(['lin', x, t]); }, setTargetAtTime(x, t, k) { this.ev.push(['tgt', x, t, k]); } });
  const node = (kind, ps) => { const n = Object.assign({ kind, out: [], connect(o) { this.out.push(o); return o; }, start(t, o, d) { this.t0 = t; this.dur = d; }, stop(t) { this.t1 = t; } }, ps); C.nodes.push(n); return n; };
  C.createGain = () => node('gain', { gain: param(1) });
  C.createBiquadFilter = () => node('filter', { type: 'lowpass', frequency: param(350), Q: param(1) });
  C.createBufferSource = () => node('src', { buffer: null, loop: false });
  C.createOscillator = () => node('osc', { type: 'sine', frequency: param(440) });
  C.createDynamicsCompressor = () => node('comp', { threshold: param(-24), knee: param(30), ratio: param(12), attack: param(.003), release: param(.25) });
  C.createBuffer = (ch, n) => ({ getChannelData: () => new Float32Array(n) });
  C.resume = () => {};
  return C;
}
function load() {
  const S = { ear: { x: 0, y: 2, z: 0 }, my: null, t: 10, bullets: [], slugs: [], warn: false }, fx = {}, AC = ctxRec;
  const ctx = vm.createContext({
    console, Math, S, fx, playMode: 'play', paused: false, reduced: false, HOW: { hear: 2500 }, TAU: Math.PI * 2,
    window: { AudioContext: function () { return AC(); } },
    clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)), dist: (p, q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z),
    calOf: sim.$('calOf'), manEye: sim.$('manEye'), hullTracked: sim.$('hullTracked'), wrap: sim.$('wrap'), hgt: () => 0, ASPD: 1.5
  });
  vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'sound.js' });
  ctx.$('audioInit')();
  const A = ctx.$('A'), C = A.ctx;
  /* the shots heard since the mark: the noise sources started, each with its gain's peak and its filter's cutoff */
  const heard = from => C.nodes.slice(from).filter(n => n.kind === 'src' && n.t0 !== undefined && !n.loop).map(n => {
    const f = n.out[0], g = f && f.out[0];
    return { t0: n.t0, dur: n.dur, f: f && f.frequency.value, type: f && f.type, vol: g && g.gain.ev[0] && g.gain.ev[0][1] };
  });
  return { ctx, $: ctx.$, A, C, S, fx, heard, mark: () => C.nodes.length };
}
const near = (x, y, e) => Math.abs(x - y) <= (e || 1e-6);

console.log('-- the master and the compressor --');
{
  const { A, C } = load();
  ok(A.comp && A.comp.kind === 'comp' && A.master.out[0] === A.ear && A.ear.out[0] === A.comp && A.comp.out[0] === C.destination, 'the master runs through the ear (a low-pass, open) and a compressor to the speakers (a battle\'s bursts summed clipped)');
  ok(A.comp.ratio.value > 1 && A.comp.threshold.value < 0, '  it squeezes only what is loud (threshold ' + A.comp.threshold.value + ' dB, ratio ' + A.comp.ratio.value + ')');
}

console.log('-- the player\'s own shot is never held back by someone else\'s --');
{
  const { fx, S, C, heard, mark } = load(), me = { x: 0, y: 2, z: 0 }, ai = { x: 30, y: 2, z: 0 };
  S.my = me; const m0 = mark();
  fx.shot(false, ai, SARMS.ak); C.currentTime += .01; fx.shot(true, me, SARMS.m4);
  const h = heard(m0);
  ok(h.length === 2, 'an AI\'s shot 10 ms before the player\'s and the player\'s: both heard (' + h.length + '; the old shared throttle took the player\'s)');
  const m1 = mark(); for (let i = 0; i < 10; i++) { C.currentTime += .02; fx.shot(false, { x: 40 + i, y: 2, z: 0 }, SARMS.ak); if (i % 2) fx.shot(true, me, SARMS.m4); }
  const mine = heard(m1).filter(x => x.vol > .1);
  ok(mine.length === 5, 'the player\'s M4 every 40 ms in the middle of AI fire every 20 ms: each of the 5 shots heard (' + mine.length + ')');
  const m2 = mark(); C.currentTime += 1; fx.shot(true, me, SARMS.mg42); fx.shot(true, me, SARMS.mg42); const h2 = heard(m2);
  ok(h2.length === 2 && near(h2[1].t0 - h2[0].t0, .03), 'two of the player\'s own MG 42 rounds in one slow frame: both heard, the second 30 ms later (the browser at a few frames a second heard 9 of 11)');
}

console.log('-- distance: quieter, duller, and late by the speed of sound --');
{
  const { fx, S, C, heard, mark, $ } = load(), SND = $('SND'); S.my = { x: 0, y: 2, z: 0 }; C.currentTime = 5;
  const at = d => { const m = mark(); C.currentTime += 1; fx.shot(false, { x: d, y: 2, z: 0 }, SARMS.m4); const h = heard(m).find(x => x.f > 200); if (h) h.late = h.t0 - C.currentTime; return h; };
  const h20 = at(20), h300 = at(300), h1000 = at(1000), h3000 = at(3000);
  ok(h20 && h300 && h1000 && !h3000, 'a shot at 20, 300 and 1000 m is heard, at 3000 m (past ' + SND.far + ' m) not');
  ok(h20.vol > h300.vol * 2.5 && h300.vol > h1000.vol * 2.5, '  the gain falls with distance: ' + [h20, h300, h1000].map(h => h.vol.toFixed(4)).join(', '));
  ok(h20.f > h300.f && h300.f > h1000.f && h1000.f >= 250, '  and so does the cutoff (the air takes the highs): ' + [h20, h300, h1000].map(h => Math.round(h.f) + ' Hz').join(', '));
  ok(near(h1000.late, 1000 / 343, 1e-3) && near(h20.late, 20 / 343, 1e-3), '  heard d / 343 s after it is fired: ' + h1000.late.toFixed(2) + ' s at 1000 m');
  const m = mark(); fx.shot(true, S.my, SARMS.m4); const mine = heard(m)[0];
  ok(mine && mine.t0 === C.currentTime && mine.vol > h20.vol, 'the player\'s own: at once, and the loudest');
}

console.log('-- each weapon its voice --');
{
  const { $, S } = load(), V = $('shotVoice'), SND = $('SND'), man = { man: 1 }, tank = { kind: 'tank' }, plane = {};
  const cases = [[SARMS.m1911, man, 'pistol'], [SARMS.m4, man, 'rifle'], [SARMS.ak, man, 'rifle'], [SARMS.k98, man, 'battle'], [SARMS.garand, man, 'battle'], [SARMS.mg42, man, 'mg'], [SARMS.m249, man, 'mg'],
    [SARMS.k98s, man, 'sniper'], [SARMS.m82, man, 'sniper'], [{ name: 'M2HB .50' }, tank, 'hmg'], [{ name: 'KPVT 14,5 mm' }, tank, 'hmg'], [{ name: 'M240 coaxial', rate: .08 }, tank, 'mg'],
    [{ name: '2A42 30 mm' }, tank, 'cannon'], [{ name: 'M61 Vulcan' }, plane, 'cannon'], [{ name: 'MG 151/20' }, plane, 'cannon'], [undefined, plane, 'mg'], [undefined, man, 'rifle']];
  const bad = cases.filter(([w, p, v]) => V(w, p) !== v);
  ok(!bad.length, cases.length + ' weapons, each its voice' + (bad.length ? ': ' + bad.map(([w, p, v]) => (w ? w.name : '—') + ' ' + V(w, p) + ' (want ' + v + ')').join(', ') : ''));
  const v = SND.v;
  ok(v.pistol[2] > v.rifle[2] && v.rifle[2] > v.sniper[2] && v.sniper[2] > v.cannon[2], '  the heavier, the lower: pistol ' + v.pistol[2] + ' Hz, rifle ' + v.rifle[2] + ', sniper ' + v.sniper[2] + ', cannon ' + v.cannon[2]);
  ok(v.pistol[0] < v.rifle[0] && v.rifle[0] < v.sniper[0] && v.sniper[0] < v.cannon[0] && !v.pistol[3] && v.cannon[3] > 0, '  and the longer, with a thump under the heavy ones');
}

console.log('-- launches and bursts by distance --');
{
  const { fx, S, C, heard, mark } = load(); S.my = { x: 0, y: 2, z: 0 };
  const L = d => { const m = mark(); C.currentTime += 1; fx.launch(false, { x: d, y: 2, z: 0 }); const h = heard(m)[0]; if (h) h.late = h.t0 - C.currentTime; return h; };
  const l50 = L(50), l1500 = L(1500), l5000 = L(5000);
  ok(l50 && l1500 && !l5000 && l50.vol > l1500.vol * 4, 'an AI\'s launch at 50 m is loud, at 1500 m faint (' + l50.vol.toFixed(3) + ', ' + l1500.vol.toFixed(4) + '), at 5000 m not heard (all three were 0.06)');
  ok(near(l1500.late, 1500 / 343, 1e-3), '  and late by the speed of sound (' + l1500.late.toFixed(1) + ' s at 1500 m)');
  const m = mark(); fx.launch(true); ok(heard(m)[0].vol === .25 && heard(m)[0].t0 === C.currentTime, 'the player\'s own launch: as before, at once');
  const B = d => { const m = mark(); C.currentTime += 1; fx.boom(20, d); return heard(m)[0]; };
  const b100 = B(100), b2500 = B(2500);
  ok(b100.f > b2500.f && near(b2500.t0 - C.currentTime, 2500 / 343, 1e-3), 'a burst at 2500 m: duller than at 100 m (' + Math.round(b2500.f) + ' against ' + Math.round(b100.f) + ' Hz) and heard ' + (2500 / 343).toFixed(1) + ' s after');
  const m3 = mark(); C.currentTime += 1; fx.boom(20, 200); ok(C.nodes.slice(m3).some(n => n.kind === 'osc'), 'a big burst has a low thump under the noise');
}

console.log('-- the soldier\'s hands --');
{
  const { $, S, C, mark } = load(), hands = $('sndHands'), A = $('A');
  const w = SARMS.m4, a = { d: w, mag: 30, res: 3, rl: 0, t: -9 }, P = { man: 1, x: 0, y: 0, z: 0, st: 0, team: 0, arms: [a], w: 0, swT: 0, ctl: { fire: false } };
  const n = () => C.nodes.filter(x => x.kind === 'src' && !x.loop).length;
  hands(P); let k = n();
  a.rl = w.rl; hands(P); ok(n() === k + 2, 'a reload begun: the magazine out (2 noises)'); k = n();
  hands(P); ok(n() === k, '  and nothing more while it goes on');
  a.rl = 0; a.mag = 30; hands(P); ok(n() === k + 2, '  done: the magazine in and the charging handle'); k = n();
  const b = { d: SARMS.k98, mag: 5, res: 3, rl: 0, t: -9 }; P.arms = [b]; hands(P); k = n();
  b.t = 11; b.mag = 4; hands(P); ok(n() === k + 2, 'a Kar 98k fired: the bolt worked after the shot'); k = n();
  a.t = 12; P.arms = [a]; hands(P); k = n(); a.t = 13; hands(P); ok(n() === k, 'an M4 fired: no bolt');
  a.mag = 0; a.res = 0; P.ctl.fire = true; hands(P); ok(n() === k + 1, 'the trigger on an empty M4 with nothing to reload: a click'); k = n();
  hands(P); ok(n() === k, '  once a pull, not every frame it is held');
  P.ctl.fire = false; P.swT = S.t + .7; hands(P); ok(n() === k + 2, 'a swap begun: the sling and the grip');
  const Q = Object.assign({}, P, { arms: [{ d: w, mag: 30, res: 3, rl: 0, t: -9 }], swT: S.t + 5 }); k = n(); hands(Q);
  ok(n() === k, 'a new soldier (a respawn) starts from what he holds: nothing heard');
}

console.log('-- a foe\'s round passing the head --');
{
  const { $, S, C, mark } = load(), crack = $('sndCrack'), A = $('A');
  const P = { man: 1, x: 0, y: 0, z: 0, st: 0, team: 0 }, eye = $('manEye')(P), dt = 1 / 60;
  const shot = (off, team, by, spd) => ({ x: eye.x - 6, y: eye.y + off, z: eye.z, vx: -(spd || 900), vy: 0, vz: 0, team, by });   // flying along -x, 6 m past the eye at the end of this frame
  const go = b => { S.bullets = [b]; C.currentTime += 1; const m = mark(); crack(P, dt); return C.nodes.slice(m).filter(n => n.kind === 'src'); };
  const b1 = shot(1.5, 1); let h = go(b1);
  ok(h.length >= 1 && b1.cr === 1, 'a foe\'s round 1.5 m from the head: a crack');
  ok(go(b1).length === 0, '  once a round');
  ok(go(shot(15, 1)).length === 0, 'one 15 m away: nothing');
  ok(go(shot(1, 0)).length === 0, 'a friend\'s round: nothing');
  ok(go(shot(1, 1, P)).length === 0, 'the soldier\'s own: nothing');
  const slow = go(shot(1, 1, null, 300)); ok(slow.length === 1, 'a slow round (a pistol\'s, 300 m/s): a whizz, not the supersonic snap');
  const far = shot(1, 1); far.x = eye.x - 40; ok(go(far).length === 0, 'a round already past, 40 m behind: nothing');
}
console.log('-- a ground vehicle: the engine through its gears, the tracks, the turret --');
{
  const { $, S, C, A } = load(), tick = $('audioTick'), SND = $('SND'), W = sim.watch('modern', { len: 0 });
  const tank = sim.addVehicle('tank', 'abrams', 0, W.base[0].x + 200, W.base[0].z, 0), last = p => { const e = p.ev.filter(x => x[0] === 'tgt'); return e.length ? e[e.length - 1][1] : p.value; };
  S.my = tank; tank.dead = false; tank.ctl.drive = 1; tank.sp = 0; tick(1 / 60);
  ok(A.eng && A.tur, 'a tank: its engine and its turret\'s servo are made on the first frame aboard');
  const spd = tank.def.spd, fs = [], gs = [];
  for (let i = 0; i <= 40; i++) { tank.sp = spd * i / 40; tick(1 / 60); fs.push(last(A.eng.o.frequency)); gs.push(last(A.eng.g.gain)); }
  let drops = 0; for (let i = 1; i < fs.length; i++) if (fs[i] < fs[i - 1] - 1) drops++;
  ok(drops === SND.veh.gears - 1, 'from a stop to its top speed (' + spd + ' m/s) the revs climb in each gear and fall at each of the ' + drops + ' shifts (' + fs.filter((f, i) => !(i % 5)).map(f => Math.round(f)).join(', ') + ' Hz)');
  ok(fs[40] > fs[0] * 2 && Math.abs(last(A.eng.o2.frequency) * 2 - fs[40]) < 1e-6, '  idle to the top is ' + Math.round(fs[0]) + ' to ' + Math.round(fs[40]) + ' Hz, with a square an octave under it');
  tank.sp = spd * .3; tank.ctl.drive = 1; tick(1 / 60); const on = last(A.eng.g.gain); tank.ctl.drive = 0; tick(1 / 60); const off = last(A.eng.g.gain);
  ok(on > off, '  under the throttle louder than coasting at the same speed (' + on.toFixed(3) + ' against ' + off.toFixed(3) + ')');
  const n = () => C.nodes.filter(x => x.kind === 'src' && !x.loop && x.t0 !== undefined).length;
  let k = n(); tank.sp = 6; for (let i = 0; i < 60; i++) tick(1 / 60); const clk = n() - k;
  ok(clk >= 10 && clk <= 16, 'its tracks at 6 m/s: ' + clk + ' knocks a second (about 6 × ' + SND.veh.trk.hz + ')');
  k = n(); tank.sp = 0; for (let i = 0; i < 60; i++) tick(1 / 60); ok(n() === k, '  stopped: none');
  const truck = { kind: 'truck', def: { spd: 20, parts: [] }, sp: 12, ctl: { drive: 1 }, ty: 0 }; S.my = truck; k = n(); for (let i = 0; i < 60; i++) tick(1 / 60);
  ok(n() === k && last(A.eng.g.gain) > 0, 'a truck at 12 m/s: its engine, no track knocks');
  S.my = tank; tank.sp = 0; tick(1 / 60); tank.ty += tank.def.sl * (1 / 60); tick(1 / 60); const sv = last(A.tur.g.gain);
  ok(Math.abs(sv - SND.veh.tur.vol) < 1e-6, 'the turret slewing at its top rate: the servo whines at full (' + sv + ')');
  tick(1 / 60); ok(last(A.tur.g.gain) === 0, '  the turret still: quiet');
  S.my = { man: 1, kind: 'inf', def: {}, x: 0, y: 0, z: 0, st: 0, team: 0, arms: [{ d: SARMS.m4, mag: 30, res: 3, rl: 0, t: -9 }], w: 0, swT: 0, ctl: { fire: false } }; tick(1 / 60);
  ok(last(A.eng.g.gain) === 0 && last(A.tur.g.gain) === 0, 'out of the tank, on foot: the engine and the servo fall quiet');
}
console.log('-- the others heard: the nearest vehicles and aircraft --');
{
  const { $, S, C, A } = load(), tick = $('audioTick'), N = $('SND').near, last = p => { const e = p.ev.filter(x => x[0] === 'tgt'); return e.length ? e[e.length - 1][1] : p.value; };
  sim.watch('modern', { len: 0 });
  const tank = (x, sp) => { const u = sim.addVehicle('tank', 'abrams', 1, x, 0, 0); u.x = x; u.y = 2; u.z = 0; u.sp = sp; return u; };
  const me = tank(5, 0), t20 = tank(20, 6), t50 = tank(50, 6), t100 = tank(100, 6), t300 = tank(300, 6), t600 = tank(600, 6), parked = tank(10, 0);
  S.my = me; me.dead = false; me.ctl.drive = 0; S.units = [me, t20, t50, t100, t300, t600, parked]; S.planes = [];
  tick(1 / 60);
  const on = () => A.nv.filter(v => v.u).map(v => v.u), g = u => last(A.nv.find(v => v.u === u).g.gain);
  ok(A.nv.length === N.veh.n && on().length === 3 && [t20, t50, t100].every(u => on().includes(u)), 'six tanks round the ear: the three nearest on the move are heard (20, 50, 100 m), not the parked one at 10 m, not the player\'s own, not the one at 600 m');
  ok(g(t20) > g(t50) && g(t50) > g(t100) && g(t100) > 0, '  quieter with distance: ' + [t20, t50, t100].map(u => g(u).toFixed(4)).join(', '));
  const v20 = A.nv.find(v => v.u === t20), v50 = A.nv.find(v => v.u === t50), v100 = A.nv.find(v => v.u === t100);
  t300.x = 15; tick(1 / 60);
  ok(v20.u === t20 && v50.u === t50 && v100.u === t300, 'the one at 300 m drives up to 15 m: it takes the voice of the farthest (100 m); the others keep theirs');
  const n = () => C.nodes.filter(x => x.kind === 'src' && !x.loop && x.t0 !== undefined).length;
  let k = n(); for (let i = 0; i < 60; i++) tick(1 / 60); const near = n() - k;
  t20.x = 200; t50.x = 250; t300.x = 300; t100.x = 350; k = n(); for (let i = 0; i < 60; i++) tick(1 / 60); const far = n() - k;
  ok(near >= 15 && far === 0, 'the tracks of the near ones knock (' + near + ' in a second at 15 to 50 m), none past ' + N.veh.trk + ' m');
  console.log('   aircraft');
  const jet = (x, vx, o) => Object.assign({ x, y: 300, z: 0, v: { x: vx, y: 0, z: 0 }, V: Math.abs(vx), def: { vmax: 300 }, ctl: { thr: 1 } }, o);
  const app = jet(800, -200), rec = jet(-800, -200), heli = jet(100, 0, { heli: 1 }), far2 = jet(4000, -200), park = jet(60, 0, { y: 0, V: 0 });
  S.units = [me]; S.planes = [heli, park, app, rec, far2]; tick(1 / 60);
  const ap = A.na.find(v => v.u === app), rc = A.na.find(v => v.u === rec);
  ok(ap && rc && !A.na.some(v => v.u === heli || v.u === park || v.u === far2), 'two jets at 800 m are heard; not the helicopter (its own rotor), not a plane parked on the field, not one at 4 km');
  ok(last(ap.bp.frequency) > last(rc.bp.frequency) * 1.8, '  the one closing in pitched up, the one going away down (' + Math.round(last(ap.bp.frequency)) + ' against ' + Math.round(last(rc.bp.frequency)) + ' Hz): the drop of a fly-by');
  ok(last(ap.g.gain) > 0 && Math.abs(last(ap.g.gain) - last(rc.g.gain)) < 1e-9, '  the same distance, the same loudness');
  S.my = null; tick(1 / 60);
  ok(A.nv.concat(A.na).every(v => !v.u && last(v.g.gain) === 0), 'no one to hear (the hangar, dead, the end): every voice quiet');
}
console.log('-- a burst close by deafens; the AA gun and the flares are heard --');
{
  const { $, S, C, A, fx } = load(), D = $('SND').deaf, man = { man: 1, kind: 'inf', def: {}, x: 0, y: 0, z: 0, st: 0, team: 0 };
  S.my = man; C.currentTime = 50;
  const cut = () => { const e = A.ear.frequency.ev; const k = e.length - 1; return k >= 1 && e[k - 1][0] === 'set' ? e[k - 1][1] : null; };
  const rings = m => C.nodes.slice(m).filter(n => n.kind === 'osc' && n.frequency.value === D.tone);
  let m = C.nodes.length; fx.boom(25, 8, 1); const f1 = cut(), r1 = rings(m);
  ok(f1 !== null && f1 < 3000 && A.ear.frequency.ev[A.ear.frequency.ev.length - 1][1] === D.f[1], 'a shell bursting 8 m from the soldier: the world falls to a low-pass at ' + Math.round(f1) + ' Hz and opens again');
  ok(r1.length === 1 && r1[0].out[0].out[0] === A.comp, '  under a ring at ' + D.tone + ' Hz, in the head (past the ear\'s filter)');
  C.currentTime += 10; const ev = A.ear.frequency.ev.length; m = C.nodes.length; fx.boom(25, 8);
  ok(A.ear.frequency.ev.length === ev && !rings(m).length, 'the same boom from a muzzle (no burst): no deafness (the player\'s own gun never deafens him)');
  fx.boom(25, 300, 1); ok(A.ear.frequency.ev.length === ev, 'a burst 300 m off: none');
  fx.boom(3, 2, 1); ok(A.ear.frequency.ev.length === ev, 'a tiny one (under ' + D.r0 + ' m of radius): none');
  S.my = { kind: 'tank', def: {}, ctl: {}, team: 0, x: 0, y: 0, z: 0 }; C.currentTime += 10; fx.boom(25, 8, 1); const f2 = cut();
  ok(f2 > f1, 'the same burst with the player inside a tank: less (' + Math.round(f2) + ' Hz)');
  console.log('   the AA gun and the flares');
  ok($('shotVoice')({ k: 'flak', spd: 820 }, { kind: 'aa' }) === 'cannon', 'a heavy AA gun\'s shot: the cannon\'s voice');
  const W = sim.watch('modern', { len: 0 }), FX = sim.$('fx'), calls = [], keep = { shot: FX.shot, launch: FX.launch, boom: FX.boom };
  FX.shot = (...a) => calls.push(['shot', ...a]); FX.launch = (...a) => calls.push(['launch', ...a]); FX.boom = (...a) => calls.push(['boom', ...a]);
  const u = { ctl: { fuse: 800 }, team: 0, x: W.base[0].x, y: 2, z: W.base[0].z }, w = { k: 'flak', spd: 820, range: 3200, r: 50, dmg: 26 };
  sim.$('ARMK').flak.fire(u, w, { x: u.x, y: 4, z: u.z }, { x: .6, y: .8, z: 0 });
  ok(calls.some(c => c[0] === 'shot' && c[2] === u && c[3] === w), 'the AA gun fired: its shot is heard (only its burst was)');
  const pl = sim.addPlane('f22', 0, W.base[0].x, 800, W.base[0].z, 0, true);
  pl.flares = 4; pl.fcool = 0; calls.length = 0; sim.$('dropFlare')(pl); ok(calls.some(c => c[0] === 'launch' && c[2] === pl), 'a plane\'s flares: their hiss is heard (they were silent)');
  W.ear.x = W.base[0].x; W.ear.y = 2; W.ear.z = W.base[0].z; calls.length = 0; sim.$('blastFx')(W.ear.x + 10, 2, W.ear.z, 20);
  ok(calls.some(c => c[0] === 'boom' && c[1] === 20 && c[3] === 1), 'a burst tells fx.boom it is one (blastFx), a muzzle does not');
  Object.assign(FX, keep);
}
console.log('-- the soldier\'s footfalls, and his grenade thrown --');
{
  const { $, S, C } = load(), steps = $('sndSteps'), hands = $('sndHands'), F = $('SND').foot;
  const n = () => C.nodes.filter(x => x.kind === 'src' && !x.loop && x.t0 !== undefined).length;
  const vol = m => { const g = C.nodes.slice(m).filter(x => x.kind === 'gain' && x.gain.ev[0]).map(x => x.gain.ev[0][1]); return Math.max(...g); };
  const walk = (P, metres, sp) => { P.v = { x: sp, y: 0, z: 0 }; const k = n(), m = C.nodes.length; for (let d = 0; d < metres; d += .1) { P.step += .1; C.currentTime += .1 / Math.max(sp, .01); steps(P); } return { falls: (n() - k) / 2, top: n() > k ? vol(m) : 0 }; };
  const P = { man: 1, kind: 'inf', st: 0, run: false, step: 0, v: { x: 0, y: 0, z: 0 } }; steps(P);
  const w = walk(P, 10, 2.7), want = Math.floor(10 * F.k / Math.PI);
  ok(Math.abs(w.falls - want) <= 1, '10 m walking: ' + w.falls + ' footfalls (one every ' + (Math.PI / F.k).toFixed(2) + ' m of the bob)');
  P.run = true; const r = walk(P, 10, 5.6); P.run = false;
  ok(r.falls >= want - 1 && r.top > w.top, '  running: as many, louder (' + r.top.toFixed(3) + ' against ' + w.top.toFixed(3) + ')');
  P.st = 2; const pr = walk(P, 6, .6); P.st = 0; ok(pr.falls > 0 && pr.top < w.top, '  prone, crawling: softer');
  const still = walk(P, 3, 0); ok(still.falls === 0, 'standing still (the step pushed by the world, no speed): none');
  P.in = {}; const ab = walk(P, 5, 3); P.in = null; ok(ab.falls === 0, 'aboard: none');
  const Q = { man: 1, kind: 'inf', st: 0, step: 123.4, v: { x: 3, y: 0, z: 0 } }; let k = n(); steps(Q); ok(n() === k, 'a new soldier (another body) starts on his own step: no footfall at once');
  const H = { man: 1, kind: 'inf', def: {}, x: 0, y: 0, z: 0, st: 0, team: 0, arms: [{ d: SARMS.m4, mag: 30, res: 3, rl: 0, t: -9 }], w: 0, swT: 0, ctl: { fire: false }, nades: 2, smk: 1 };
  hands(H); k = n(); H.nades = 1; hands(H); ok(n() === k + 1, 'a grenade thrown: the swing of the arm heard'); k = n(); H.smk = 0; hands(H); ok(n() === k + 1, '  a smoke grenade too'); k = n(); hands(H); ok(n() === k, '  and nothing more');
}
done();
