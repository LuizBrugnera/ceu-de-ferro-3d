'use strict';
/* A work that stops and one taken down (OBR, cf-pol2-obras: P17): obrStall says what holds the soldier's work (far, moving, under fire
   with the wait), how long is left at the builders' pace, and when nobody builds it since when and that it comes apart after BLD.decay[0] s;
   holding V by a work of its side for OBR.undo s takes it down, OBR.back of its cost back to the side and a site's kit back to the soldier;
   letting V go before that keeps it; V stays the mortar's and the sapper's lift's */
const H = require('./harness'), ok = H.ok;

function soldier(kit) {
  const C = H.load({ seed: 78, eco: 1 }), $ = C.$, S = C.newState('ww2', kit || 'schutze', { cls: 'inf', mouse: true });
  C.plan = () => {}; S.waveTimer = 1e9; S.men = S.men.filter(m => m === S.my); S.squads = []; S.units = [];
  for (const f of S.forts.slice()) C.fortDrop(f); S.forts = [];
  const P = S.my, I = S.input; P.inv = 1e9; S.aim.h = 0; S.aim.p = -.25; C.run(.1);
  /* level open ground for a trench 7 m ahead */
  const T = S.T; let p = null;
  for (let z = -S.HW + 600; !p && z < S.HW - 600; z += 97) for (let x = 900; !p && x < S.W - 900; x += 131) if (!C.fortWhy(1, 0, x + 7, z, 0) && !C.siteWhy(0, x + 7, z + 40, 0) && C.routeDist(T, x, z) > 150) p = { x, z };
  P.x = p.x; P.z = p.z; P.y = C.hgt(p.x, p.z); C.run(.1);
  return { C, $, S, P, I, p };
}

console.log('-- a work that stops says why --');
{
  const { C, $, S, P, p } = soldier(), BLD = $('BLD'), FORT = $('FORT'), stall = $('obrStall'), d = S.eco.d[0];
  const f = C.fortStart(1, 0, p.x + 7, p.z, 0); P.x = f.x; P.z = f.z + 1; C.run(1);
  const a = stall(P);
  ok(!!a && a.w === f && a.on && a.why === '' && a.n === 1 && Math.abs(a.left - (1 - f.prog) * FORT.trench.time) < 1.5, 'standing on its trench the soldier builds it: ' + (a && a.left) + ' s left alone');
  P.x = f.x + 20; C.run(.5); const b = stall(P);
  ok(!!b && !b.on && b.why === 'far' && b.n === 0, 'walked 20 m off it: far');
  P.x = f.x; P.v.x = 3; const m = stall(P); P.v.x = 0;
  ok(m.why === 'move', 'on it but running: move');
  P.hitT = S.t - 1; const h = stall(P);
  ok(h.why === 'fire' && h.wait === Math.ceil(BLD.hurt - 1), 'hit a second ago: under fire, ' + h.wait + ' s to wait');
  P.hitT = -99; P.x = f.x + 20; C.run(BLD.decay[0] - 5); const i = stall(P); C.run(6); const j = stall(P);
  ok(i.idle > BLD.decay[0] - 6 && !i.decay && j.decay, 'nobody builds it: ' + Math.round(i.idle) + ' s idle and not yet coming apart, then past ' + BLD.decay[0] + ' s it is');
  P.x = f.x + 60; ok(stall(P) === null, 'out of ' + $('OBR').near + ' m it says nothing');
}

console.log('-- holding V takes it down --');
{
  const { C, $, S, P, I, p } = soldier(), OBR = $('OBR'), FORT = $('FORT'), BLD = $('BLD'), d = S.eco.d[0];
  const f = C.fortStart(1, 0, p.x + 7, p.z, 0); P.x = f.x; P.z = f.z + 1; C.run(.5);
  const en = d.en, mt = d.mt;
  I.ordB = true; C.run(OBR.undo * .5); I.ordB = false; C.run(.2);
  ok(!f.gone && S.forts.includes(f), 'V let go after half of ' + OBR.undo + ' s: still there');
  /* the jump of the side's stock in the step the work comes down (the economy goes on around it) */
  const jump = (w, secs) => { let pe = d.en, pm = d.mt, got = null; C.run(secs, () => { if (!got && (w.gone || w.dead)) got = [d.en - pe, d.mt - pm]; pe = d.en; pm = d.mt; }); return got; };
  d.en = d.mt = 300; I.ordB = true; const g1 = jump(f, OBR.undo + .3);
  const back = FORT.trench.cost.map(c => Math.round(c * OBR.back));
  ok(f.gone && !S.forts.includes(f) && !!g1 && Math.abs(g1[0] - back[0]) < .5 && Math.abs(g1[1] - back[1]) < .5, 'held ' + OBR.undo + ' s: the trench is gone, +' + back.join('/') + ' back to the side (' + (g1 && g1.map(v => v.toFixed(2)).join('/')) + ')');
  const f2 = C.fortStart(2, 0, p.x + 4, p.z + 12, 0); P.x = f2.x; P.z = f2.z + 1; C.run(1);
  ok(!f2.gone, 'with V still held from before, another work is not taken down: V must be let go first');
  I.ordB = false; C.run(.1);
  const kit = P.kit, s = C.startSite(0, p.x + 7, p.z + 40, 0); P.x = s.x; P.z = s.z; C.run(.3);
  d.en = d.mt = 300; I.ordB = true; const g2 = jump(s, OBR.undo + .3); I.ordB = false; C.run(.1);
  ok(!!s.dead && !!s.gone, 'a supply base\'s site comes down too');
  ok(P.kit === kit + 1 && !!g2 && Math.abs(g2[0] - Math.round(BLD.cost[0] * OBR.back)) < .5, 'and its kit comes back to the soldier, with ' + Math.round(BLD.cost[0] * OBR.back) + ' energy (' + (g2 && g2[0].toFixed(2)) + ')');
}
{
  const { C, $, S, P, I, p } = soldier('grwTrupp'), OBR = $('OBR');
  const f = C.fortStart(1, 0, p.x + 7, p.z, 0); P.x = f.x; P.z = f.z + 1; C.run(.5);
  I.ordB = true; C.run(OBR.undo + .5); I.ordB = false;
  ok(!f.gone, 'the mortar\'s V changes its shell: it never takes a work down');
}
H.done();
