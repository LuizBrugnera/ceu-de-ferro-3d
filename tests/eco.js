'use strict';
/* The economy of the general (slice 1: sites, resources, commands; production still automatic, its cost only recorded). Off is today (the
   battle with the economy off equals the page as it was before it), what the economy starts with, what the commands refuse and why, that
   stock and income run, that the AI builds, the view model's rows, and a site going down. SECS: how long the solo battle runs for the
   off-is-today comparison (default 60); RUN: how long the ww2 economy runs (default 240). BEFORE: the page as it was before the economy
   (default .work/eco/before.html; the comparison is skipped when the file is missing). The harness turns ECO.on off unless load({ eco: true }) */
const fs = require('fs'), path = require('path');
const H = require('./harness'), ok = H.ok, SECS = +process.env.SECS || 60, RUN = +process.env.RUN || 240;
const BEFORE = process.env.BEFORE ? path.resolve(process.env.BEFORE) : path.join(H.ROOT, '.work', 'eco', 'before.html');
/* what the match came to, to the last digit, and where the random stream stands */
const print = (C, S) => {
  let sum = 0; for (const k of ['men', 'units', 'planes']) for (const o of S[k]) sum += o.x * 1.3 + o.z + (o.hp || 0);
  return [S.men.length, S.units.length, S.squads.length, sum.toFixed(6), S.cq.ps.map(v => v.toFixed(4)).join(','), C.$('Math').random().toFixed(12)].join(' ');
};
function battle(o) {
  const C = H.load({ seed: 41, page: o.page });
  const S = C.newState('ww2', C.$('ERAS').ww2.sides[0].fighter, { cls: 'plane' });
  C.run(SECS);
  return print(C, S);
}
const J = v => JSON.stringify(v);

console.log('-- off is today (seed 41, ' + SECS + ' s) --');
if (fs.existsSync(BEFORE)) { const A = battle({}), B = battle({ page: BEFORE }); console.log('   ' + A); ok(A === B, 'with the economy off the battle is the same as before it'); }
else console.log('  skip  no ' + BEFORE + ': the comparison with the page before the economy');
{ const C = H.load({ seed: 41 }), S = C.newState('ww2', C.$('ERAS').ww2.sides[0].fighter, { cls: 'plane' });
  ok(S.eco === null && C.genVM(0, false).eco && J(C.genVM(0, false).eco) === '{"sites":[],"rows":[]}', 'the harness leaves the economy off: no S.eco, an empty slot in the view'); }

/* the checks of one economy at t 0 and for a while on */
function section(era, secs) {
  console.log('-- on: ' + era + ' (' + secs + ' s) --');
  const C = H.load({ seed: 41, eco: true }), $ = C.$, ECO = $('ECO'), S = C.newState(era, $('ERAS')[era].sides[0].fighter, { cls: 'plane' });
  ok(!!S.eco, 'the economy exists in a solo conquest');
  if (!S.eco) return null;
  const npt = S.cq.p.filter(p => p.base < 0).length;   // and one for each point but the bases (ECO.pt, cf-economia-expansao)
  ok(S.eco.dep.filter(q => q.half >= 0).length === 8 && S.eco.dep.filter(q => q.pt >= 0).length === npt && S.eco.dep.every((q, i) => q.i === i), 'eight deposits, four a half, and one a point (' + npt + ')');
  for (const t of [0, 1]) {
    const L = S.eco.l.filter(e => e.team === t && !e.dead), mine = L.find(e => e.k === 'mine');
    ok(L.length === 3 && L.every(e => e.prog === 1), 'side ' + t + ': ' + L.length + ' sites, all built (' + L.map(e => e.k).join(' ') + ')');
    ok(!!mine && S.eco.dep.some(q => Math.hypot(q.x - mine.x, q.z - mine.z) <= ECO.dep), 'side ' + t + ': its mine stands on a deposit');
    ok(L.every(e => S.wob[e.id - S.T.nid] === e.o && S.os[e.id] === 0), 'side ' + t + ': the sites are world objects');
  }
  ok(J(JSON.parse(J(C.ecoView(0)))) === J(C.ecoView(0)) && J(JSON.parse(J(C.ecoView(1)))) === J(C.ecoView(1)), 'the view is plain JSON: it survives a round trip');
  const v = C.ecoView(0); ok(v.stock.en === ECO.start.en && v.sites.length === 3 && v.q.length === 0 && v.dep.length === S.eco.dep.length && !!v.costs.squad, 'the view: stock ' + v.stock.en + '/' + v.stock.mt + ', ' + v.sites.length + ' sites, the era\'s costs');
  const sp = C.ecoAsk(0, { q: 'spots', k: 'pow' });
  ok(sp.length > 0 && sp.length <= 5 && sp.every(s => Number.isFinite(s.x) && Number.isFinite(s.sc) && typeof s.why === 'string' && s.why), 'ecoAsk spots: ' + sp.length + ' places, the best "' + (sp[0] && sp[0].why) + '"');
  ok(sp.every(s => C.ecoAsk(0, { q: 'why', k: 'pow', x: s.x, z: s.z, a: s.a }) === ''), 'ecoAsk why: the places it offers have no reason against');
  const same = C.ecoAsk(0, { q: 'spots', k: 'pow' }); ok(J(same) === J(sp), 'the same question, the same places');
  /* what the commands refuse */
  const at = sp[0] || { x: S.base[0].x, z: S.base[0].z }, n0 = S.eco.d[0].q.length;
  ok(C.ecoCmd(0, { c: 'build', k: 'mine', x: at.x, z: at.z }, 'ai').why === 'dep', 'a mine off any deposit: dep');
  let w = null; for (let x = 100; x < S.W && !w; x += 150) for (let z = -S.HW + 100; z < S.HW && !w; z += 150) if (C.hgt(x, z) <= S.T.WL) w = { x, z };
  ok(!!w && C.ecoCmd(0, { c: 'build', k: 'pow', x: w.x, z: w.z }, 'ai').why === 'water', 'a usina on water: water');
  ok(C.ecoCmd(0, { c: 'build', k: 'pow', x: -50, z: 0 }, 'ai').why === 'map', 'a usina off the map: map');
  ok(C.ecoCmd(0, { c: 'make', k: 'heli', n: 1 }, 'ai').why === (era === 'ww2' ? 'era' : ''), era === 'ww2' ? 'a helicopter in ww2: era' : 'a helicopter in modern is allowed');
  ok(C.ecoCmd(0, { c: 'make', k: 'nothing' }, 'ai').why === 'kind', 'an unknown kind: kind');
  ok(C.ecoCmd(0, { c: 'make', k: 'squad' }, 'me').why === 'ctl' && C.ecoCmd(0, { c: 'scout', x: 5000, z: 0 }, 'mcp').why === 'ctl', 'a command by a controller that is not this side\'s: ctl');
  ok(C.ecoCmd(0, { c: 'draw', k: 'squad' }, 'ai').why === 'ctl', 'a draw by anyone but the dispatchers: ctl');
  ok(S.eco.d[0].q.length === n0 || era === 'modern', 'a refused command changes nothing');
  /* the orders */
  const r = C.ecoCmd(0, { c: 'make', k: 'squad', n: 2, why: 'teste' }, 'ai'), q = S.eco.d[0].q;
  ok(r.ok && q.length === n0 + 2 + (era === 'modern' ? 1 : 0), 'make: two orders queued');
  ok(C.ecoCmd(0, { c: 'cancel', id: r.id }, 'ai').ok && C.ecoCmd(0, { c: 'cancel', id: 99999 }, 'ai').why === 'id', 'cancel: an own order goes, an unknown one is refused');
  return { C, S, $, ECO };
}

{ /* ww2: the long run */
  const X = section('ww2', RUN); if (X) {
    const { C, S, $, ECO } = X; let bad = 0, nanN = 0;
    const win = []; C.run(RUN, () => {
      const T = Math.floor(S.t); if (T === win.length) { win.push(T); for (const t of [0, 1]) { const d = S.eco.d[t]; if (!(d.en >= 0 && d.en <= ECO.cap.en && d.mt >= 0 && d.mt <= ECO.cap.mt)) bad++; if (!Number.isFinite(d.en + d.mt + d.inc.en + d.inc.mt + d.use.en + d.bill.en)) nanN++; } }
    });
    ok(bad === 0 && nanN === 0, 'the stocks stayed within [0, ' + ECO.cap.en + '] and finite, sampled each second (' + win.length + ' samples)');
    const v0 = C.ecoView(0), v1 = C.ecoView(1);
    ok(v0.inc.en > 0 && v0.inc.mt > 0 && v1.inc.en > 0, 'income runs: side 0 +' + v0.inc.en + ' E +' + v0.inc.mt + ' M a minute, side 1 +' + v1.inc.en + ' E');
    if (ECO.gate) ok(v0.bill.en === 0 && S.eco.d[0].made > 0, 'gate on: nothing is billed (the units are paid in production): ' + S.eco.d[0].made + ' made');
    else ok(v0.bill.en > 0, 'the field\'s cost is recorded: ' + v0.bill.en + ' E + ' + v0.bill.mt + ' M a minute (the hooks of the dispatchers)');
    for (const t of [0, 1]) {
      const L = S.glog ? S.glog.l[t].filter(e => e.k === 'eco') : [], live = S.eco.l.filter(e => e.team === t && !e.dead);
      ok(L.some(e => /^Constr/.test(e.s)), 'side ' + t + ' logged a build: ' + (L.find(e => /^Constr/.test(e.s)) || { s: '-' }).s);
      ok(live.length >= 4, 'side ' + t + ' has ' + live.length + ' live sites (' + live.map(e => e.k + (e.prog < 1 ? '*' : '')).join(' ') + ')');
    }
    const V = C.genVM(0, false);
    ok(V.eco.rows.some(r => (r.label + ': ' + r.value).startsWith('Energia')) && V.eco.rows.some(r => r.label === 'Instalações'), 'the view model has the economy rows: ' + V.eco.rows.slice(0, 3).map(r => r.label + ': ' + r.value).join(' | '));
    const own = V.eco.sites.filter(s => s.t === 0), fnd = V.eco.sites.filter(s => s.t !== 0), kn0 = S.eco.d[0].kn;   // since slice 3 the enemy's sites side 0 has found (kn) are shown too, never the others
    ok(own.length >= 4 && own.length === S.eco.l.filter(e => e.team === 0).length && V.eco.dep.length === S.eco.dep.length && V.eco.sites.every(s => Number.isFinite(s.x))
      && fnd.length === Object.keys(kn0).length && fnd.every(s => s.t === 1 && s.age >= 0 && Object.values(kn0).some(k => k.k === s.k && Math.abs(k.x - s.x) < 1 && Math.abs(k.z - s.z) < 1)),
      'the view model shows its own sites, the deposits, and of the enemy\'s only those side 0 has found (' + own.length + ' own, ' + fnd.length + ' found)');
    ok(C.genVM(0, true).eco.sites.some(s => s.t === 1), 'all: the enemy\'s sites too');
    /* a site goes down */
    const pow = S.eco.l.find(e => e.team === 1 && e.k === 'pow' && !e.dead), inc0 = S.eco.d[1].inc.en;
    ok(!!pow, 'side 1 has a usina to lose');
    if (pow) {
      C.hitObj(pow.o, 1e5, null);
      ok(pow.dead, 'a usina hit hard is dead');
      ok(S.glog.l[1].some(e => e.k === 'eco' && /^Perdemos/.test(e.s)), 'its side wrote "' + (S.glog.l[1].filter(e => /^Perdemos/.test(e.s)).pop() || { s: '-' }).s + '"');
      C.run(1); ok(S.eco.d[1].inc.en < inc0 && S.eco.d[1].inc.en >= (ECO.hq.en + C.ecoPtInc(1).en) * 60 - 1e-6, 'its income dropped on the next pass: ' + Math.round(inc0) + ' -> ' + Math.round(S.eco.d[1].inc.en) + ' a minute');
    }
  }
}
{ /* modern: the same checks for a minute */
  const X = section('modern', 60); if (X) {
    const { C, S, ECO } = X; let bad = 0;
    C.run(60, () => { for (const t of [0, 1]) { const d = S.eco.d[t]; if (!(d.en >= 0 && d.en <= ECO.cap.en && d.mt >= 0 && d.mt <= ECO.cap.mt)) bad++; } });
    ok(bad === 0 && C.ecoView(0).inc.en > 0, 'modern: the stocks stayed within bounds and income runs');
    ok(['lav', 'heli', 'drone'].every(k => C.ecoCmd(0, { c: 'make', k, n: 1 }, 'ai').ok || S.eco.d[0].q.length >= ECO.q), 'modern: lav, heli and drone are valid kinds');
  }
}
H.done();
