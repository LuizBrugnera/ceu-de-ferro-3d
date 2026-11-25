'use strict';
/* The AI's camouflage nets (CNAI, cf-pol2-camuflagem, P31 part 2, the owner's D8 = A): the general's fortification plan (AFP) puts a large
   net over its forward supply bases once the side has seen enemy aviation or a drone, and a small one over its artillery that stands still;
   how many by its personality's dose; none on Easy; online only with a server that knows the nets. End to end: the plan orders the net,
   a squad lays it right over the base (not beside it, as a trench may go) and the base is covered. About three minutes */
const H = require('./harness'), { ok, done } = H, { performance } = require('perf_hooks');

const C = H.load({ seed: 4, eco: 1, mapv: 6 }), $ = C.$; $('globalThis').performance = performance;
const S = C.watch('modern', { len: 0, per: ['gue', 'blz'], dif: ['facil', 'normal'] }); C.run(2, null, 1 / 20);
const CNAI = $('CNAI'), W21 = $('W21'), FORT = $('FORT'), cmdOf = $('cmdOf'), want = C => $('cnaiWant')(C), OBR = $('OBR');
const keys = C => want(C).map(i => i.key);

console.log('-- the dose of each personality, none on Easy --');
{
  ok(W21.dig.cns === 14 && W21.dig.cnl === 15 && /pequena/.test(W21.fort.cns) && /grande/.test(W21.fort.cnl), 'the general\'s orders know both nets (fort cns, cnl: kinds 14 and 15)');
  ok($('cnaiDose')(0).join() === CNAI.dose.gue.join() && $('cnaiDose')(1).join() === CNAI.dose.blz.join(), 'each side has its personality\'s dose (Guerrilheiro ' + CNAI.dose.gue + ', Blitz ' + CNAI.dose.blz + ')');
  const d = CNAI.dose, sum = k => d[k][0] + d[k][1];
  ok(sum('gue') > sum('blz') && d.art[1] > d.blz[1] && d.art[1] >= d[''][1], 'the Guerrilheiro hides more than the Blitz, the Artilheiro covers more guns');
}

/* a level, empty spot near side t's own ground */
function spot(t, n) {
  const T = S.T, b = S.base[t]; let k = 0;
  for (let r = 400; r < 4000; r += 90) for (let i = 0; i < 16; i++) {
    const x = b.x + Math.cos(i * Math.PI / 8) * r, z = b.z + Math.sin(i * Math.PI / 8) * r, h = C.hgt(x, z);
    if (!(x > 300 && x < S.W - 300 && Math.abs(z) < S.HW - 300) || h < T.WL + 4 || C.routeDist(T, x, z) < 60 || C.near(x, z, 60).length) continue;
    if ($('fortWhy')(15, t, x, z, 0) || S.sup.some(o => Math.hypot(o.x - x, o.z - z) < 200)) continue;
    if (k++ === n) return { x, z };
  }
  throw new Error('no room');
}
const C0 = cmdOf(0), C1 = cmdOf(1);
console.log('-- forward bases: only once enemy aviation or a drone was seen --');
const bases = [];
{
  S.planes.length = 0; if (S.drones) S.drones.length = 0; delete C0.cna; delete C1.cna; delete C1.airT;
  for (const o of S.sup.filter(o => o.team === 1)) o.dead = true;
  for (let i = 0; i < 3; i++) { const p = spot(1, i * 7), b = C.addSup(S.T.nid + 6000 + i, 1, p.x, p.z, 0, 1); b.prog = 1; bases.push(b); }
  ok(!keys(C1).some(k => k.startsWith('cb')) && C1.cna === undefined, 'nothing seen yet: no net over a base');
  ok(!keys(C0).length, 'on Easy the AI wants no net at all');
  const b = bases[0], P = S.E.sides[S.fac[0]], pl = C.addPlane(P.fighter, 0, b.x + 1500, 700, b.z, 0, false); pl.ai = false;
  const L = want(C1).filter(i => i.k === 'cnl');
  ok(C1.cna !== undefined && L.length === CNAI.dose.blz[0], 'an enemy aircraft 1.5 km from a base: the Blitz wants ' + L.length + ' large net (dose ' + CNAI.dose.blz[0] + ') of ' + bases.length + ' bases');
  const e = $('mnBase')(1), near = bases.slice().sort((a, b) => Math.hypot(a.x - e.x, a.z - e.z) - Math.hypot(b.x - e.x, b.z - e.z))[0];
  ok(L[0] && L[0].key === 'cb' + near.id, '  the base nearest the enemy first');
  const sp = L[0].spot();
  ok(sp && Math.abs(sp.x + Math.cos(L[0].a) * OBR.dig - near.x) < .01 && Math.abs(sp.z - Math.sin(L[0].a) * OBR.dig - near.z) < .01, '  the builder holds ' + OBR.dig + ' m short of the base, so the net goes right over it');
  ok(((S.glog && S.glog.l[1]) || []).some(e => /Aviação ou drone inimigo/.test(e.s)), '  the general\'s log says why');
  C0.cna = 1; ok(!keys(C0).length, 'on Easy, even with aviation seen, none');
  S.planes.length = 0;
  const W = $('afpWant')(C1, $('afpOf')(C1)), i0 = W.out.findIndex(i => i.k === 'cnl');
  ok(i0 >= 0 && W.out.slice(0, i0).every(i => i.k === 'aapos'), 'the nets come right after the AA umbrella in the plan (at ' + i0 + ')');
  ok(!$('afpHas')(1, L[0]), '  not there yet');
  const f = C.fortStart(15, 1, near.x, near.z, L[0].a); $('fortAt')(f, 1);
  ok($('afpHas')(1, L[0]), '  there once a net of the side covers the base');
  f.gone = true; S.forts = S.forts.filter(o => !o.gone);
}

console.log('-- artillery that stands still --');
{
  const p = spot(1, 30), u = C.addUnit('art', 1, p.x, p.z, S.E.sides[S.fac[1]].mlrs, true);   // where it is put (fixed: not to a road)
  const m = () => want(C1).filter(i => i.k === 'cns');
  ok(!!u.ai && !m().length, 'a piece that has just stopped: no net');
  u.cnaS.T -= CNAI.still + 1;
  const L = m();
  ok(L.length === 1 && Math.abs(L[0].cx - u.x) < .01, 'one that stood ' + CNAI.still + ' s: a small net over it');
  u.x += CNAI.move + 2;
  ok(!m().length, 'it moves ' + (CNAI.move + 2) + ' m: no net until it stands again');
  u.dead = true;
}

console.log('-- online: only with a server that knows the nets --');
{
  const N = $('Net'), b = bases[1], o = { c: 'fort', k: 'cnl', x: b.x, z: b.z }, net = S.net, host = S.host;
  S.net = true; S.host = true; N.cam = false;
  const r = $('genCmd')(1, o, 'ai');
  ok(!r.ok && r.why === 'off', 'an older server: the order is refused (' + r.why + ')');
  ok(!want(C1).length, '  and the plan wants none');
  S.net = net; S.host = host;
}

console.log('-- end to end, a fresh match: the plan orders it, a squad lays it over the side\'s own forward base, the base is covered --');
{
  const C = H.load({ seed: 4, eco: 1, mapv: 6 }), $ = C.$; $('globalThis').performance = performance;
  const S = C.watch('modern', { len: 0, per: ['gue', 'blz'], dif: ['facil', 'normal'] }); C.run(2, null, 1 / 20);
  const C1 = $('cmdOf')(1), A = () => $('afpOf')(C1), t0 = S.t; let ord = null, up = null;
  C.run(420, () => {
    if (!ord) ord = A().fl.find(e => e.k === 'cnl' && e.ok) || null;
    up = S.forts.find(f => f.team === 1 && f.k === 15 && !f.gone && f.prog >= 1) || null;
    return !(up && S.sup.some(b => b.cnv === up));
  }, 1 / 20);
  ok(C1.cna !== undefined, 'the side saw enemy aviation or a drone (at ' + Math.round((C1.cna || 0) - t0) + ' s)');
  ok(!!ord, 'the plan orders a large net (' + (ord ? ord.why + ' at ' + Math.round(ord.t - t0) + ' s' : A().fl.slice(-4).map(e => e.k + ': ' + e.why).join(' | ')) + ')');
  const b = up && S.sup.find(b => b.team === 1 && Math.hypot(b.x - up.x, b.z - up.z) < 1);
  ok(!!up && !!b, '  it stands right over a forward base (' + (up ? Math.round(S.t - t0) + ' s, ' + (b ? Math.hypot(b.x - up.x, b.z - up.z).toFixed(2) + ' m off' : 'not over one') : 'not built') + ')');
  ok(!!b && b.cnv === up, '  and the base under it is covered');
  ok(!S.forts.some(f => f.team === 0 && f.F.cam && !f.gone), 'the Easy side laid none');
}
done();
