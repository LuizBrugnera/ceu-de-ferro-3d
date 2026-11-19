'use strict';
/* The mission contract and Dispatch (phase F1): every unit is born with a mission (o.mis), whatever the AI fields comes by a Dispatch order that carries
   one, a squad's mission follows its order, the units report up (rep) and the commander reads it. Nothing of it may change the battle: no draw from the
   sim's random stream. PARITY=<an older page>: also the same seeded battles there and here must end in the same state (SECS, default 150) */
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 150;
const KINDS = 'attack defend ambush recon escort garrison patrol interdict support cap cas lift build reserve'.split(' ');
const solo = (C, era) => C.newState(era, C.$('ERAS')[era].sides[0].fighter, { cls: 'plane' });
const park = S => { const P = S.my; if (P) { P.inv = 9; P.dead = false; P.y = 3000; P.v.y = 0; P.hp = P.def.hp; } S.lives = 9; };
const what = o => (o.men ? 'squad ' + o.job : o.man ? 'man' : o.heli ? 'heli' : o.drone ? 'drone' : o.kind || o.role);
const good = M => !!M && KINDS.includes(M.kind) && M.id > 0 && M.area && Number.isFinite(M.area.x) && Number.isFinite(M.area.z) && M.area.r > 0 && M.when && M.when.H >= 0 && [0, 1, 2].includes(M.lat) && typeof M.roe === 'string' && M.brk > 0 && M.pri > 0;

console.log('-- every unit is born with a mission; what the AI fields comes by a Dispatch order --');
for (const [era, mapv, eco] of [['ww2', 1, 0], ['modern', 4, 1]]) {
  const C = H.load({ seed: 31, mapv, eco }), $ = C.$, S = solo(C, era), seen = new Set(), bad = [], free = [];
  const look = () => { for (const l of [S.units, S.planes, S.men, S.squads]) for (const o of l) { if (seen.has(o)) continue; seen.add(o); if (!good(o.mis)) bad.push(what(o)); else if (o !== S.my && (o.ai || o.men) && !o.mis.d) free.push(what(o) + ':' + o.mis.kind); } };
  look(); C.run(SECS, () => { park(S); look(); });
  const n = [...seen].length, kinds = [...new Set([...seen].map(o => o.mis && o.mis.kind))].sort().join(' ');
  ok(n > 40 && !bad.length, era + ' map v' + mapv + ': ' + n + ' units, squads and soldiers born in ' + SECS + ' s, every one with a whole mission' + (bad.length ? ' (not: ' + bad.slice(0, 8).join(', ') + ')' : '') + '; kinds: ' + kinds);
  ok(!free.length, era + ': every AI one entered by a Dispatch order' + (free.length ? ' (not: ' + free.slice(0, 8).join(', ') + ')' : ''));
  ok(S.my && good(S.my.mis) && S.my.mis.d === 0, era + ': the player has a mission too, of his class (' + (S.my && S.my.mis.kind) + '), and no order');
  const L = S.dsp.log, col = L[0].concat(L[1]).find(o => /^coluna/.test(o.why) && o.n >= 2);
  ok(L[0].length && L[1].length && L[0].concat(L[1]).every(o => o.id > 0 && o.n > 0 && o.why), era + ': each side keeps its orders (' + L[0].length + ' and ' + L[1].length + '), each with an id, its words and what it fielded');
  const us = col ? S.units.filter(u => u.mis.d === col.id) : [];
  ok(!col || us.every(u => u.mis.kind === $('MIS').col[u.cargo ? 'cargo' : u.kind]), era + ': a column\'s vehicles share its order: ' + us.map(u => u.kind + ' ' + u.mis.kind).join(', '));
  $('misScan')();   // what the commander did to the squads since the last scan
  const sq = S.squads.filter(q => q.live > 0);
  ok(sq.length && sq.every(q => q.men.every(m => m.dead || m.mis === q.mis)), era + ': a squad\'s soldiers carry their squad\'s mission (' + sq.length + ' squads)');
  ok(sq.every(q => !q.ord || q.mis.kind === ((q.ord.aid && q.ord.aid.kind) || $('MIS').job[q.job] || (q.ord.b || q.ord.es ? 'garrison' : $('MIS').ord[q.ord.k]) || q.mis.kind)), era + ': a squad\'s mission follows its order: ' + [...new Set(sq.map(q => q.job + '/' + (q.ord && q.ord.k) + '→' + q.mis.kind))].slice(0, 12).join(' '));
  const N = S.cmd.map(C => C.repN || {});
  ok(N.every(n => n.contact > 0), era + ': the units report contact up and the commanders read it: ' + JSON.stringify(N));
}

console.log('-- reports --');
{
  const C = H.load({ seed: 4 }), $ = C.$, S = C.sandbox('ww2'), r = S.T.routes[0], mid = r.len / 2, p = $('routeAt')(r, mid);
  S.cmd = [$('cmdOf')(0), $('cmdOf')(1)];
  const q = C.dispatch(1, { kind: 'defend', why: 'teste' }, () => C.addSquad(1, p.x, p.z, 0, mid));
  ok(q.mis.d > 0 && q.mis.why === 'teste' && q.men.every(m => m.mis === q.mis), 'a squad fielded by an order: mission ' + q.mis.kind + ', order ' + q.mis.d + ', its men share it');
  C.setOrd(q, { k: 'ambush', ri: 0, s: mid + 50 });
  ok(q.mis.kind === 'ambush' && q.mis.target.s === mid + 50 && q.mis.st === 'way', 'a new order: the mission is now ' + q.mis.kind + ' at s ' + Math.round(q.mis.target.s));
  C.setOrd(q, { k: 'assault', ri: 1, s: S.T.routes[1].len / 2 });   // another road, far from where they meet: the squad cannot take it
  const inv = S.rep[1].find(x => x.k === 'inviable');
  ok(q.ord.k === 'hold' && !!inv && inv.mis === q.mis.id && inv.data.k === 'assault' && q.mis.kind === 'defend', 'an order it cannot carry out: reported inviable (' + (inv && inv.data.k) + '), it holds and defends');
  C.setOrd(q, { k: 'supply', ri: 0, s: mid, back: q.ord });
  ok(S.rep[1].some(x => x.k === 'need' && x.data.k === 'ammo'), 'sent back to resupply: it reports what it needs (ammo)');
  C.killMan(q.men[1], null);
  const ls = S.rep[1].filter(x => x.k === 'losses');
  ok(ls.length === 1 && ls[0].data.left === q.men.length - 1, 'a man lost: the squad reports its losses, ' + (ls[0] && ls[0].data.left) + ' left');
  for (const m of q.men) if (!m.dead) C.killMan(m, null);
  ok(q.mis.st === 'lost', 'the last one: the mission is lost');
  const u = C.dispatch(1, { why: 'teste' }, () => C.addUnit('tank', 1, 0, 0, S.E.sides[S.fac[1]].tanks[0], false, 0, mid, 0, 0));
  ok(u.mis.kind === 'attack' && u.mis.target.ri === 0 && Math.abs(u.mis.area.x - u.x) < 1, 'a tank by an order: ' + u.mis.kind + ', on road ' + u.mis.target.ri + ', its leash where it entered');
  C.damageUnit(u, 1e4, null);
  ok(u.mis.st === 'lost' && S.rep[1].some(x => x.k === 'losses' && x.mis === u.mis.id), 'destroyed: lost, and reported');
  const n = S.rep[1].length; $('misRead')(1);
  ok(S.rep[1].length === 0 && S.cmd[1].rep.length === n && S.cmd[1].repN.losses >= 2, 'the commander reads the ' + n + ' reports: ' + JSON.stringify(S.cmd[1].repN));
  const draws = []; const R = $('Math').random; $('Math').random = () => { draws.push(1); return R(); };
  C.dispatch(0, { kind: 'reserve' }, () => { $('misBirth')({ team: 0, x: 0, z: 0 }); $('rep')(u, 'contact'); $('misScan')(); $('misRead')(0); });
  $('Math').random = R;
  ok(!draws.length, 'the contract draws nothing from the sim\'s random stream');
}

if (process.env.PARITY) {
  console.log('-- the same battle as ' + process.env.PARITY + ' --');
  for (const [era, mapv, eco] of [['ww2', 1, 0], ['modern', 4, 1]]) {
    const sig = page => { const C = H.load({ seed: 77, page, mapv, eco }), S = solo(C, era); C.run(SECS, () => park(S)); const r = n => Math.round(n * 100) / 100; return JSON.stringify([S.units.map(u => [u.kind, u.team, r(u.x), r(u.z), r(u.hp)]), S.men.map(m => [m.team, r(m.x), r(m.z), r(m.hp)]), S.planes.map(p => [p.team, r(p.x), r(p.y), r(p.z)]), S.squads.length, S.cq && S.cq.tk]); };
    ok(sig(process.env.PARITY) === sig(), era + ' map v' + mapv + ': the same state after ' + SECS + ' s');
  }
}
H.done();
