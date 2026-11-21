'use strict';
/* the hit marks (HM, cf-pol-armas). The simulation: a hit of the player's own on a foe calls fx.hit (a soldier, a vehicle, an aircraft; a
   real round of the player's rifle too), and nothing else does (a friend, the AI's hits, no damage). The view: the mark is drawn round the foe
   on the screen, white, fading out in HM.t s; red, larger and longer once the foe is dead; one tick a hit and a lower one for the kill; off
   with cf-hm 0. The view block runs here on its own over a recording canvas */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf('/* ---------- hit marks (HM'), b = html.indexOf('/* ---------- damage panel: the vehicle from above');
console.log('page: ' + H.PAGE);
if (a < 0 || b < 0 || b < a) { console.log('no hit marks (HM): a page before them'); process.exit(0); }

console.log('-- the simulation calls fx.hit for the player\'s own hits on foes, and only those --');
{
  const C = H.load({ seed: 5 }), $ = C.$, S = C.sandbox('modern'), B = S.base[0], calls = [];
  $('fx').hit = o => calls.push(o);
  const me = C.addMan('blueRifle', 0, B.x + 100, B.z + 50, 0), foe = C.addMan('redRifle', 1, B.x + 130, B.z + 50, 0), pal = C.addMan('blueRifle', 0, B.x + 100, B.z + 60, 0), ai = C.addMan('redRifle', 1, B.x + 140, B.z + 50, 0);
  me.me = 1; S.my = me;
  const n = () => calls.length;
  C.damageMan(foe, 3, me, false, { pt: 0, dmg: 3 }); ok(n() === 1 && calls[0] === foe, 'the player\'s round on an enemy soldier: a mark on him');
  C.damageMan(pal, 3, me, false, { pt: 0, dmg: 3 }); ok(n() === 1, 'on a soldier of his own side: none');
  C.damageMan(foe, 3, ai, false, { pt: 0, dmg: 3 }); ok(n() === 1, 'an AI\'s round on the enemy: none');
  C.damageMan(foe, 0, me, false, { pt: 0, dmg: 0 }); ok(n() === 1, 'no damage: none');
  /* a vehicle and an aircraft of the enemy from the regular match, damaged by the player */
  const W = C.watch('modern', { len: 0 }); C.run(2, null, 1 / 20);
  $('fx').hit = o => calls.push(o);
  const u = W.units.find(v => v.team === 1 && !v.dead), p = W.planes.find(v => v.team === 1 && !v.dead), m2 = Object.assign(C.addMan('blueRifle', 0, 0, 0, 0), { me: 1 });
  if (u) { u.inv = 0; const k = n(); C.damageUnit(u, 5, m2); ok(n() === k + 1 && calls[k] === u, 'the player\'s shell on an enemy ' + u.kind + ': a mark'); }
  if (p) { p.inv = 0; const k = n(); C.damagePlane(p, 5, m2); ok(n() === k + 1 && calls[k] === p, 'the player\'s round on an enemy aircraft: a mark'); }
}
{
  const C = H.load({ seed: 9 }), $ = C.$, S = C.sandbox('modern'), B = S.base[0], calls = [];
  $('fx').hit = o => calls.push(o);
  const me = C.addMan('blueRifle', 0, B.x + 100, B.z + 50, 0), foe = C.addMan('redRifle', 1, B.x + 125, B.z + 50, 0);
  me.me = 1; me.ai = null; foe.ai = null; foe.hp = 1e9;   // me.me: the player's (S.my would hand him to the keys)
  const aimAt = () => { const e = $('manEye')(me), d = $('vnorm')({ x: foe.x - e.x, y: $('bodyY')(foe) - e.y, z: foe.z - e.z }); me.ctl.aim = d; me.h = Math.atan2(-d.z, d.x); me.ap = Math.asin(d.y); };
  me.ctl.fire = true; me.ctl.ads = true;
  C.run(2, () => { aimAt(); me.held = false; });
  ok(calls.length > 0 && calls.every(o => o === foe), 'the player\'s M4 fired at a foe 25 m away for 2 s: the rounds that hit him put marks on him (' + calls.length + ' of ' + (30 - me.arms[0].mag) + ' rounds)');
}

console.log('-- the view: the mark on the screen --');
function view(store) {
  const strokes = [], ticks = [], st = { S: { t: 10, my: {} }, cw: 1280, ch: 800 };
  const hx = { lineCap: '', lineWidth: 1, strokeStyle: '', globalAlpha: 1, save() {}, restore() { this.globalAlpha = 1; }, beginPath() { this.p = []; }, moveTo(x, y) { this.p.push(['m', x, y]); }, lineTo(x, y) { this.p.push(['l', x, y]); }, stroke() { strokes.push({ col: this.strokeStyle, w: this.lineWidth, a: this.globalAlpha, p: this.p.slice() }); } };
  const ctx = vm.createContext({
    console, Math, fx: {}, hx, playMode: 'play', A: { ctx: {}, on: true }, CORN: [[-1, -1], [1, -1], [1, 1], [-1, 1]],
    localStorage: { getItem: k => (store && k in store ? store[k] : null) },
    burst: (dur, vol, f) => ticks.push({ dur, vol, f }), drawHud: () => {}, hudU: () => 1,
    proj: (x, y, z) => ({ x: 640 + x, y: 400 - y, front: z < 50 }), onScr: s => s.front, bodyY: o => o.y + 1,
    get S() { return st.S; }
  });
  vm.runInContext(html.slice(a, b) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'hm.js' });
  return { $: ctx.$, ctx, strokes, ticks, st };
}
{
  const V = view(), HM = V.$('HM'), fx = V.ctx.fx, draw = V.$('drawHud'), S = V.st.S, foe = { x: 20, y: 5, z: 0, dead: false };
  fx.hit(foe); draw();
  const w = V.strokes.filter(s => s.col !== 'rgba(0,0,0,.5)');
  ok(w.length === 1 && w[0].col === '#f4f1e8' && w[0].p.length === 8, 'a hit: four white strokes (with a dark edge under them)');
  const xs = w[0].p.map(q => q[1]), ys = w[0].p.map(q => q[2]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  ok(Math.abs(cx - 660) < 1e-6 && Math.abs(cy - 394) < 1e-6, '  round the foe on the screen (' + cx + ', ' + cy + ')');
  ok(V.ticks.length === 1 && V.ticks[0].f > 2000, '  and a tick');
  V.strokes.length = 0; S.t += HM.t * .5; draw(); const half = V.strokes.find(s => s.col === '#f4f1e8');
  ok(half && Math.abs(half.a - .5) < 1e-6, '  fading: half way at ' + (HM.t * .5).toFixed(2) + ' s');
  V.strokes.length = 0; S.t += HM.t; draw(); ok(!V.strokes.length && HM.o === null, '  gone after ' + HM.t + ' s');
  S.t = 20; fx.hit(foe); fx.hit(foe); ok(V.ticks.length === 2, 'two hits in the same instant: one tick');
  foe.dead = true; V.strokes.length = 0; draw();
  const r = V.strokes.find(s => s.col === '#ff4a36');
  ok(r && V.ticks.length === 3 && V.ticks[2].f < V.ticks[0].f, 'the foe dead by the next frame: the mark turns red, with a lower tick');
  const rx = r.p.map(q => q[1]); ok(Math.max(...rx) - Math.min(...rx) > (Math.max(...xs) - Math.min(...xs)) * 1.3, '  and larger');
  V.strokes.length = 0; S.t += HM.t + .05; draw(); ok(V.strokes.length > 0, '  and it holds longer than a hit (' + HM.k + ' s)');
  V.strokes.length = 0; S.t += HM.k; draw(); ok(!V.strokes.length, '  then it goes');
  const back = { x: 0, y: 0, z: 100, dead: false }; fx.hit(back); V.strokes.length = 0; draw(); ok(!V.strokes.length, 'a hit on a foe behind the eye: no mark');
}
{
  const V = view({ 'cf-hm': '0' }); V.ctx.fx.hit({ x: 1, y: 1, z: 0 }); V.$('drawHud')();
  ok(!V.strokes.length && !V.ticks.length, 'off with localStorage cf-hm 0: no mark, no tick');
}
done();
