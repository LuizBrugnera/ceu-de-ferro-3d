'use strict';
/* a hit on the soldier, read on the screen (P1, cf-pol2-fase1). On the default camera (the third person) a round that hit the player's
   soldier changed nothing at the aim: only the health bar in the corner shrank, and the ESTADO panel said "sem ferimentos" over
   "sangrando". Now: damageMan keeps the hit's zone (m.hz); the ESTADO lines (woundLines) name it and never say "sem ferimentos" over a
   wound; drawHud calls hitCue for a soldier in either camera (fpFx ran only with a first-person seat); hitCue flares a red edge and puts an
   arc on a ring round the aim that points to the shooter (hitArc), fading in HITC.arc s. The view's functions run on a stub canvas */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
const line = re => (html.match(re) || [''])[0];
if (!body('hitCue')) { console.log('no hitCue: a page before it'); process.exit(0); }

console.log('-- the simulation keeps the zone of the last hit --');
{
  const C = H.load({ seed: 3 }), S = C.sandbox('ww2'), B = S.base[0];
  const me = Object.assign(C.addMan('blueRifle', 0, B.x + 150, B.z, 0), { me: 1, inv: 0 }), foe = C.addMan('redRifle', 1, B.x + 150, B.z + 300, 0);
  S.my = me;
  C.damageMan(me, 3, foe, false, { pt: 0, dmg: 3 });
  ok(me.hz === 0 && me.lastBy === foe && me.bl > 0 && me.hp > me.max * .67, 'a torso round that leaves the soldier above "ferido": m.hz = 0 (tronco), the shooter kept, bleeding (hp ' + me.hp + ' / ' + me.max + ')');
  C.damageMan(me, 1, foe, false, { pt: 2, dmg: 1 }); ok(me.hz === 2, 'a round in the legs: m.hz = 2');
}

console.log('-- the ESTADO panel --');
{
  const ctx = vm.createContext({});
  vm.runInContext(line(/const WZONE = [^\n]*\n/).replace('const WZONE', 'globalThis.WZONE') + body('woundLines'), ctx);
  const W = (P, hs, ls, as) => ctx.woundLines(Object.assign({ hp: 22, max: 22, bl: 0 }, P), hs || 0, ls || 0, as || 0).map(l => l[0]);
  ok(W({}).join() === 'sem ferimentos', 'unhurt: "sem ferimentos"');
  const t = W({ hp: 19, bl: .06, hz: 0 });
  ok(t[0] === 'ferido no tronco' && !t.includes('sem ferimentos') && t.includes('sangrando: pare e estanque'), 'a torso hit, still above "ferido", bleeding: ' + t.join(' · ') + ' (it said "sem ferimentos" over "sangrando")');
  ok(W({ hp: 20, hz: 1 })[0] === 'ferido na cabeça', 'a graze on the head, not bleeding: "ferido na cabeça"');
  ok(W({ hp: 8, bl: .1, hz: 1 }, 2)[0] === 'ferido grave na cabeça', 'badly hurt in the head: "ferido grave na cabeça"');
  ok(W({ hp: 18, hz: 2 }, 0, 1).join() === 'pernas: mais lento', 'a leg wound says only its effect');
}

console.log('-- the view: the arc toward the shooter and the red edge --');
{
  const calls = [], hx = { globalAlpha: 1, lineCap: 'round', strokeStyle: '', lineWidth: 1, save() {}, restore() {}, beginPath() {}, stroke() {}, arc(x, y, r, a0, a1) { calls.push(['arc', x, y, r, (a0 + a1) / 2]); }, drawImage() { calls.push(['veil', this.globalAlpha]); } };
  const ctx = vm.createContext({ hx, cw: 1280, ch: 800, FOE: '#e2604f', reduced: false, S: { t: 0, aim: { d: { x: 0, y: 0, z: -1 } } }, clamp: (v, a, b) => Math.max(a, Math.min(b, v)), vig: () => ({}), Math, isFinite });
  vm.runInContext(line(/const HITC = [^\n]*\n/).replace('const HITC', 'globalThis.HITC') + body('hitArc') + body('veil') + body('hitCue'), ctx);
  const P = { x: 0, z: 0, hp: 22, max: 22, hitT: -9, lastBy: null }, d = { x: 0, y: 0, z: -1 }, deg = a => Math.round(a * 180 / Math.PI);
  P.lastBy = { x: 0, z: -100 }; ok(deg(ctx.hitArc(P, d)) === -90, 'a shooter straight ahead: the arc at the top of the ring (' + deg(ctx.hitArc(P, d)) + '°)');
  P.lastBy = { x: 100, z: 0 }; ok(deg(ctx.hitArc(P, d)) === 0, 'to the right: the right of the ring');
  P.lastBy = { x: 0, z: 100 }; ok(deg(ctx.hitArc(P, d)) === 90, 'behind: the bottom');
  P.lastBy = { x: -100, z: 0 }; ok(Math.abs(deg(ctx.hitArc(P, d))) === 180, 'to the left: the left');
  P.lastBy = { x: 70, z: 70 }; ok(deg(ctx.hitArc(P, { x: 1, y: 0, z: 0 })) === -45, 'aiming along +x (+z is then on the right), a shooter at +x +z: up and right, ' + deg(ctx.hitArc(P, { x: 1, y: 0, z: 0 })) + '°');
  P.lastBy = null; ok(ctx.hitArc(P, d) === null, 'no shooter: no arc');
  P.lastBy = { x: 100, z: 0 }; P.hitT = 0; ctx.S.t = .2; calls.length = 0; ctx.hitCue(P, 1);
  const arcs = calls.filter(c => c[0] === 'arc'), veils = calls.filter(c => c[0] === 'veil');
  ok(arcs.length === 2 && arcs.every(c => c[1] === 640 && c[2] === 400 && Math.round(c[4] * 100) === 0), '0,2 s after a hit from the right: an arc (and its dark outline) on the ring round the aim, on its right');
  ok(veils.length === 1 && veils[0][1] > .3, '  and a red flare on the edges (alpha ' + veils[0][1].toFixed(2) + ')');
  ctx.S.t = 3; calls.length = 0; ctx.hitCue(P, 1); ok(!calls.length, '3 s later, at full health: nothing');
  P.hp = 5; calls.length = 0; ctx.hitCue(P, 1); ok(calls.filter(c => c[0] === 'veil').length === 1 && !calls.some(c => c[0] === 'arc'), 'low on health: the red edge stays (alpha ' + (calls[0] || [0, 0])[1].toFixed(2) + '), no arc');
}
const dh = body('drawHud');
ok(/if \(P\.man && !P\.dead\) hitCue\(P, u\);/.test(dh) && !/if \(seat\)[^\n]*hitCue/.test(dh), 'drawHud calls hitCue for the soldier in either camera, not only with a first-person seat');
done();
