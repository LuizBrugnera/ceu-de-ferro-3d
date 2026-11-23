'use strict';
/* cf-b2-nuke: the B-2 and the Tu-160 carry their stick or, if the player picks it, ONE nuclear bomb. Only a player: the AI never gets it.
   One a flight (no rearm, a cooldown after it). The burst: everything in the core dies, friend and foe, buildings down, bridges fall; past it
   the damage falls off to nothing; the crater, the cloud, the kill cam and the late shake. What it costs the frame is printed */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 9, mapv: 9 }), $ = C.$;
const LO = $('LO'), RACKS = $('RACKS'), STORES = $('STORES'), PLANES = $('PLANES'), NUKE = $('NUKE'), STK = $('STK');
const NUC = { b2: [['b83', 1]], tu160: [['rdsn', 1]] };
function bare(seed) {
  C.seed(seed); const S = C.watch('modern', { n: 3 }); S.demo = false; S.watch = false;
  for (const q of S.squads.slice()) for (const m of q.men) m.gone = true;
  S.squads.length = 0; S.men.length = 0; S.units.length = 0; S.planes.length = 0; if (S.civs) S.civs.length = 0;
  C.plan = () => {}; C.director = () => {};
  return S;
}
/* the player's bomber, agl m over x z, flying +x */
function mine(S, id, x, z, agl, lo) {
  LO.mem = {}; if (lo) LO.mem[id] = lo;
  const p = C.addPlane(id, PLANES[id].side, x, C.hgt(x, z) + agl, z, 0, false);
  p.me = 1; p.inv = 0; S.my = p; S.me = p.team; S.cls = 'plane'; S.model = id; return p;
}
const put = (o, x, z) => { o.rail = null; o.x = x; o.z = z; o.y = C.hgt(x, z); o.inv = 0; o.ai = null; return o; };   // addUnit snaps a vehicle to the road

console.log('-- the bays: the stick or one nuclear bomb, never both --');
for (const id of ['b2', 'tu160']) {
  const R = RACKS[id], P = PLANES[id], s0 = Object.values(R.sets)[0][0], o = STORES[s0[0]], d = P.ord[0], n = NUC[id][0][0];
  ok(R.g.length === 1 && Object.keys(R.sets).join() === 'Padrão,Nuclear' && R.bay, id + ': one bay, the sets ' + Object.keys(R.sets).join(' / '));
  ok(o.dmg === d.dmg && o.r === d.r && s0[1] === d.n && o.mega && o.gap === d.gap && o.name === d.name, id + ': the standard set is the stick it always had (' + d.n + ' × ' + d.name + ')');
  ok(STORES[n].nuke && R.g[0][1][n] === 1 && LO.bad(id, NUC[id]) === '' && LO.bad(id, [[n, 2]]) === 'count', id + ': one nuclear bomb (' + STORES[n].name + '), never two');
  ok(Object.values(R.ai).every(k => k === 'Padrão'), id + ': every AI set is the stick');
}
ok(PLANES.b2.side === 0 && PLANES.tu160.side === 1 && $('ERAS').modern.sides[1].bomber === 'tu160', 'the Tu-160 is the Russian side\'s strategic bomber (ERAS bomber), the B-2\'s counterpart');
{ const other = Math.max(...Object.values(STORES).filter(o => !o.nuke).map(o => o.r || 0), STK.K.svbied.r, $('BOMB').truck.r);
  ok(NUKE.r[0] > 4 * other, 'the core alone (' + NUKE.r[0] + ' m) is over four times the widest other blast in the game (' + other + ' m)'); }

console.log('-- only a player flies it --');
{ const S = bare(2), x = S.W / 2;
  for (const id of ['b2', 'tu160']) {
    LO.mem = { [id]: NUC[id] };
    ok(LO.fit(id).ord[0].nuke, id + ': the player who picked it gets it');
    const ai = [['fighter'], ['cas'], ['strat']].map(([r]) => LO.fit(id, undefined, true, r, PLANES[id].side));
    ok(ai.every(d => !d.ord.some(o => o.nuke)), id + ': an AI plane never (every role)');
    ok(!LO.fit(id, NUC[id], true, 'strat', 0).ord.some(o => o.nuke), id + ': not even when it is asked for: the AI gets the stick');
    const p = C.addPlane(id, PLANES[id].side, x, 3000, 0, 0, true, 'strat');
    ok(p.ai && p.def.ord[0].mega && !p.def.ord[0].nuke && p.ord[0] === PLANES[id].ord[0].n, id + ': a strategic strike\'s bomber flies with its stick (' + p.ord[0] + ')');
  }
  LO.mem = {}; }

console.log('-- the burst: friend and foe --');
const D = [50, 300, 600, 900, 1050, 1250, 1450, 1580, 1700, 2500];
let zone;
{ const S = bare(3), x = S.W / 2 + 900, z = 300, y = C.hgt(x, z), P = mine(S, 'b2', x - 2000, z, 4200, NUC.b2), u = [];
  for (const d of D) for (const t of [0, 1]) {
    u.push([d, t, 'tank', put(C.addUnit('tank', t, x + d, z, t ? 't90' : 'abrams', false), x + d, z + (t ? 30 : -30))]);
    u.push([d, t, 'truck', put(C.addUnit('truck', t, x, z + d, undefined, false), x + (t ? 20 : -20), z + d)]);
    const m = C.addMan($('INF').modern[S.fac[t]][0], t, x - d, z + t * 8, 0); m.inv = 0; m.ai = null; u.push([d, t, 'man', m]);
  }
  const lo = P.y;
  const t0 = process.threadCpuUsage(); $('nukeBurst')(x, y + .5, z, P, P.team); const c = process.threadCpuUsage(t0);
  console.log('   the burst took ' + ((c.user + c.system) / 1000).toFixed(1) + ' ms of CPU in one step (headless)');
  const dead = (k, a, b) => u.filter(e => e[2] === k && e[0] >= a && e[0] < b);
  for (const k of ['tank', 'truck', 'man']) ok(dead(k, 0, NUKE.r[0]).every(e => e[3].dead) && dead(k, 0, NUKE.r[0]).some(e => e[1] === P.team), k + 's within ' + NUKE.r[0] + ' m all dead, the bomber\'s own side too');
  ok(dead('tank', NUKE.r[0], 1000).every(e => e[3].dead) && dead('man', NUKE.r[0], NUKE.r[1]).every(e => e[3].dead), 'past the core tanks die to 1000 m and soldiers to ' + NUKE.r[1] + ' m');
  const edge = u.filter(e => e[0] > NUKE.r[1] && e[0] < NUKE.r[2]), hurt = edge.filter(e => !e[3].dead && e[3].hp < (e[3].max || e[3].def.hp));
  ok(hurt.length >= edge.length / 2 && edge.some(e => !e[3].dead), 'in the outer zone (' + NUKE.r[1] + '-' + NUKE.r[2] + ' m) most are hurt, not all dead (' + hurt.length + ' hurt, ' + edge.filter(e => e[3].dead).length + ' dead of ' + edge.length + ')');
  const far = u.filter(e => e[0] > NUKE.r[2]);
  ok(far.every(e => !e[3].dead && e[3].hp === (e[3].max || e[3].def.hp)), 'past ' + NUKE.r[2] + ' m nobody is touched');
  { const t = u.filter(e => e[2] === 'tank' && e[1] === 1 && !e[3].dead).map(e => [e[0], e[3].hp]); ok(t.every((q, i) => !i || q[1] >= t[i - 1][1]), 'the damage falls off with distance (tanks: ' + t.map(q => q[0] + ' m ' + Math.round(q[1])).join(', ') + ')'); }
  ok(!P.dead && P.y === lo, 'the B-2 4200 m up is untouched');
  ok(S.smokes.some(s => s.r === NUKE.cloud.r && s.h === NUKE.cloud.h) && S.craters.some(c => c.r === NUKE.crater) && S.nukes.length === 1, 'a cloud that cuts sight, a crater, and the burst for the view');
  ok(S.kcB && S.kcB.k === 'nuke' && S.kcB.r === NUKE.r[2], 'the kill cam notes it (' + S.kcB.r + ' m)');
  zone = { x, z };
}
{ const S = bare(4), x = S.W / 2, z = 0, P = mine(S, 'tu160', x, z, 300, NUC.tu160);
  $('nukeBurst')(x, C.hgt(x, z) + .5, z, P, P.team);
  ok(P.dead && S.kc && S.kc.k === 'nuke', 'a Tu-160 300 m over its own bomb dies in it, and the player sees the burst');
  const B = (S.banner && S.banner.sub) || ''; ok(/^Bomba nuclear/.test(B), 'the banner names it: ' + B); }
{ const S = bare(5), x = S.W / 2, z = 0; S.ear = { x: x + 7000, y: 100, z };
  $('nukeBurst')(x, C.hgt(x, z) + .5, z, null, 0);
  const s0 = S.shake; C.run(7000 / NUKE.v - 1, null, .1); const s1 = S.shake; C.run(1.5, null, .1);
  ok(s0 < .5 && s1 < .5 && S.shake > 1, 'the shake comes with the shock front, 7 km off ' + (7000 / NUKE.v).toFixed(0) + ' s later (' + s1.toFixed(2) + ' → ' + S.shake.toFixed(2) + ')'); }

console.log('-- buildings and bridges --');
{ const S = bare(6), T = S.T, all = new Set(); for (const k in T.grid.c) for (const o of T.grid.c[k] || []) if (o.B) all.add(o);
  const B = [...all]; let c = null, cn = 0; for (const b of B) { const n = B.filter(o => Math.hypot(o.x - b.x, o.z - b.z) < 600).length; if (n > cn) { cn = n; c = b; } }
  const t0 = process.threadCpuUsage(); $('nukeBurst')(c.x, C.hgt(c.x, c.z) + .5, c.z, null, 0); const u = process.threadCpuUsage(t0);
  const core = B.filter(o => $('footD')(o, c.x, c.z) < NUKE.r[0]), down = core.filter(o => S.os[o.id] === 2);
  ok(core.length > 50 && down.length === core.length, 'in a town every building within ' + NUKE.r[0] + ' m goes down (' + down.length + '/' + core.length + ') in ' + ((u.user + u.system) / 1000).toFixed(1) + ' ms of CPU');
  const ring = B.filter(o => { const d = $('footD')(o, c.x, c.z); return d >= NUKE.r[0] + 30 && d < NUKE.city[0] * .8; });
  ok(!ring.length || ring.some(o => S.os[o.id] >= 1), 'past the core they are damaged (' + ring.filter(o => S.os[o.id] >= 1).length + '/' + ring.length + ')'); }
{ const G = H.load({ seed: 7, mapv: 5 }), S = G.sandbox('modern'), b = G.$('brs()').find(q => q.c === 0);
  G.$('nukeBurst')(b.x + 400, G.hgt(b.x + 400, b.z) + .5, b.z, null, 0);
  ok(S.os[b.id] === 2, 'a main-road bridge 400 m from it falls'); }

console.log('-- one a flight --');
{ const S = bare(7), b = S.base[0], P = mine(S, 'b2', b.x + 4000, b.z, 3000, NUC.b2);
  ok(P.def.ord[0].nuke && P.ord[0] === 1, 'the player\'s B-2 takes off with one nuclear bomb');
  ok($('useOrd')(P, 0) && P.ord[0] === 0 && P.nuked && S.nukeT === S.t + NUKE.cool, 'let go: none left, the cooldown runs (' + NUKE.cool + ' s)');
  const bomb = S.bombs[S.bombs.length - 1]; ok(bomb && bomb.o.nuke, 'it falls as a bomb');
  ok(LO.key(LO.mine('b2')) === LO.key(Object.values(RACKS.b2.sets)[0]), 'meanwhile the player\'s choice answers the stick');
  P.x = b.x; P.z = b.z; P.y = C.hgt(b.x, b.z) + 300; P.rearmT = 0; P.ord[0] = 0;
  const D0 = P.def; for (let i = 0; i < 200; i++) $('stepPlane')(P, 1 / 30);
  ok(P.def !== D0 || P.ord[0] === 0, 'over the airfield the nuclear bomb is not hung again (' + P.ord[0] + ')');
  S.my = null; S.nukeT = S.t + 10; ok(!LO.nuke(LO.mine('b2')), 'within the cooldown a new plane takes the stick');
  S.nukeT = S.t - 1; ok(LO.nuke(LO.mine('b2')), 'after it, the nuclear set again'); }
done();
