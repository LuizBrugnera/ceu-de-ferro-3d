'use strict';
/* hits on the player, heard (HURT, cf-pol-armas). The simulation: a hit on the player's own tank, aircraft or soldier calls fx.hurt with
   what the armour did (res), once the damage is his (online, not when the shooter's client applies it and relays it), and a shell that
   glances off his hull calls it too (strike's ricochet returned null and was silent); a hit on anyone else does not. The view: a plate
   that stops a round rings (a falling tone and a clank), one that goes in crunches, louder with the damage, a soldier's body thuds, a skin
   ticks, at most one every HURT.gap s. The view's block runs over a recording AudioContext */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- sound ----------'), b = html.indexOf('/* ---------- interface ---------- */');
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0 || html.indexOf('const HURT = {', a) < 0 || html.indexOf('const HURT = {', a) > b) { console.log('no HURT: a page before it'); process.exit(0); }

console.log('-- the simulation: who calls fx.hurt --');
{
  const C = H.load({ seed: 4 }), $ = C.$, S = C.sandbox('modern'), B = S.base[0], HK = $('HK'), calls = [];
  $('fx').hurt = (o, d, h) => calls.push({ o, d, h });
  const mine = C.addVehicle('tank', 'abrams', 0, B.x + 200, B.z, 0), other = C.addVehicle('tank', 'abrams', 0, B.x + 260, B.z, 0), foe = C.addVehicle('tank', 't90', 1, B.x + 600, B.z, Math.PI);
  mine.me = 1; mine.inv = 0; other.inv = 0;
  C.damageUnit(mine, 10, foe, false, { k: HK.shell, pt: 0, dmg: 10, via: [], res: 0 });
  ok(calls.length === 1 && calls[0].o === mine && calls[0].h.res === 0, 'a shell into the player\'s tank: fx.hurt, with what the armour did (went in)');
  C.damageUnit(other, 10, foe, false, { k: HK.shell, pt: 0, dmg: 10, via: [], res: 0 }); ok(calls.length === 1, 'the same into a tank of his side: nothing');
  const man = Object.assign(C.addMan('blueRifle', 0, B.x + 150, B.z, 0), { me: 1, inv: 0 });
  C.damageMan(man, 3, foe, false, { pt: 0, dmg: 3 }); ok(calls.length === 2 && calls[1].o === man, 'a round into the player\'s soldier: fx.hurt');
  S.net = true; const ghost = { net: 1, team: 1, x: 0, y: 0, z: 0 };
  C.damageUnit(mine, 5, ghost, false, { k: HK.shell, pt: 0, dmg: 5, via: [], res: 1 }); ok(calls.length === 2, 'online, a ghost\'s shot computed here and relayed to its owner: not yet');
  C.damageUnit(mine, 5, ghost, true, { k: HK.shell, pt: 0, dmg: 5, via: [], res: 1 }); ok(calls.length === 3 && calls[2].h.res === 1, '  the relayed hit when it comes back (rx): now');
  S.net = null;
  /* shells from every side at the player's hull: those that glance off (strike returns null) are heard too */
  let nul = 0; const before = calls.length;
  let q = 7; const rnd = () => ((q = (q * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2000; i++) {   // from every side and from above, aimed anywhere on the hull: some come in at a grazing angle
    let dx = rnd() * 2 - 1, dy = -rnd(), dz = rnd() * 2 - 1; const l = Math.hypot(dx, dy, dz); dx /= l; dy /= l; dz /= l;
    const ox = (rnd() - .5) * 6, oy = rnd() * 2.4, oz = (rnd() - .5) * 3, x = mine.x + ox - dx * 2, y = mine.y + oy - dy * 2, z = mine.z + oz - dz * 2;
    mine.hp = mine.max;
    if (C.strike(mine, HK.shell, 80, foe, x, y, z, dx, dy, dz, false) === null) nul++;
  }
  const ric = calls.slice(before).filter(c => c.h && c.h.ric).length;
  ok(nul > 0 && ric === nul, '2000 shells at the player\'s tank from every side and above: ' + nul + ' glanced off, and each of them was heard (' + ric + ')');
}

console.log('-- the view: what is heard --');
function ctxRec() {
  const C = { currentTime: 0, sampleRate: 8000, state: 'running', nodes: [], destination: { kind: 'dest' } };
  const param = v => ({ value: v, ev: [], setValueAtTime(x, t) { this.ev.push(['set', x, t]); }, exponentialRampToValueAtTime(x, t) { this.ev.push(['exp', x, t]); }, linearRampToValueAtTime(x, t) { this.ev.push(['lin', x, t]); }, setTargetAtTime(x, t, k) { this.ev.push(['tgt', x, t, k]); } });
  const node = (kind, ps) => { const n = Object.assign({ kind, out: [], connect(o) { this.out.push(o); return o; }, start(t) { this.t0 = t; }, stop(t) { this.t1 = t; } }, ps); C.nodes.push(n); return n; };
  C.createGain = () => node('gain', { gain: param(1) }); C.createBiquadFilter = () => node('filter', { type: 'lowpass', frequency: param(350), Q: param(1) });
  C.createBufferSource = () => node('src', { buffer: null, loop: false }); C.createOscillator = () => node('osc', { type: 'sine', frequency: param(440) });
  C.createDynamicsCompressor = () => node('comp', { threshold: param(-24), knee: param(30), ratio: param(12), attack: param(.003), release: param(.25) });
  C.createBuffer = (ch, n) => ({ getChannelData: () => new Float32Array(n) }); C.resume = () => {};
  return C;
}
const sim = H.load();
function view() {
  const st = { S: { ear: { x: 0, y: 0, z: 0 }, my: null, t: 0, bullets: [] } }, ctx = vm.createContext({
    console, Math, fx: {}, playMode: 'play', paused: false, reduced: false, HOW: { hear: 2500 }, TAU: Math.PI * 2, HK: sim.$('HK'),
    window: { AudioContext: function () { return ctxRec(); } }, clamp: (v, lo, hi) => Math.min(hi, Math.max(lo, v)), dist: (p, q) => Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z),
    calOf: sim.$('calOf'), manEye: sim.$('manEye'), hullTracked: sim.$('hullTracked'), wrap: sim.$('wrap'), hgt: () => 0, ASPD: 1.5, get S() { return st.S; }
  });
  vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'sound.js' });
  ctx.$('audioInit')();
  const A = ctx.$('A'), C = A.ctx, from = () => C.nodes.length, made = m => C.nodes.slice(m);
  return { ctx, $: ctx.$, A, C, from, made };
}
{
  const V = view(), fx = V.ctx.fx, C = V.C, HK = sim.$('HK'), tank = { kind: 'tank', max: 150, def: { hp: 150 } };
  let m = V.from(); fx.hurt(tank, 0, { k: HK.shell, ric: 1 }); let n = V.made(m);
  const osc = n.find(x => x.kind === 'osc'), f = osc && osc.frequency.ev;
  ok(osc && f[0][1] === 2600 && f[1][0] === 'exp' && f[1][1] === 1500 && n.some(x => x.kind === 'filter' && x.type === 'bandpass'), 'a shell glancing off the player\'s tank: the plate rings (a tone falling 2600 → 1500 Hz) with a clank');
  C.currentTime += 1; m = V.from(); fx.hurt(tank, 0, { k: HK.shell, res: 1 }); ok(V.made(m).some(x => x.kind === 'osc'), '  and one stopped by the armour (res 1) too');
  const pen = d => { C.currentTime += 1; const m = V.from(); fx.hurt(tank, d, { k: HK.shell, res: 0 }); const ns = V.made(m), g = ns.filter(x => x.kind === 'gain').map(x => x.gain.ev[0] && x.gain.ev[0][1]).filter(Boolean); return { ns, top: Math.max(...g) }; };
  const p5 = pen(5), p40 = pen(40);
  ok(p5.ns.some(x => x.kind === 'osc') && p5.ns.some(x => x.kind === 'filter' && x.type === 'lowpass'), 'one that goes in: a low thud under a harsh burst');
  ok(p40.top > p5.top, '  louder for 40 of damage than for 5 (' + p40.top.toFixed(3) + ' against ' + p5.top.toFixed(3) + ')');
  C.currentTime += 1; m = V.from(); fx.hurt({ man: 1, max: 22, def: { hp: 22 } }, 4, { pt: 0, dmg: 4 }); n = V.made(m);
  ok(n.some(x => x.kind === 'osc' && x.frequency.ev[0][1] === 85 * 1.6), 'the player\'s soldier hit: a dull thud in the body');
  C.currentTime += 1; m = V.from(); fx.hurt({ max: 100, def: { hp: 100 } }, 2, { k: HK.bullet, pt: 0, dmg: 2, via: [] }); n = V.made(m);
  ok(n.filter(x => x.kind === 'src').length === 1 && n.some(x => x.kind === 'filter' && x.frequency.value === 3200), 'a round on an aircraft\'s skin: a tick');
  C.currentTime += 1; m = V.from(); fx.hurt(tank, 5, { res: 0 }); fx.hurt(tank, 5, { res: 0 }); ok(V.made(m).filter(x => x.kind === 'src').length === 1, 'two in the same instant: heard once');
  V.ctx.playMode = 'demo'; C.currentTime += 1; m = V.from(); fx.hurt(tank, 5, { res: 0 }); ok(V.made(m).length === 0, 'out of a match (the hangar\'s battle): nothing');
}
done();
