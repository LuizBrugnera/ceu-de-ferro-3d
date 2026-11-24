'use strict';
/* The idle stock (cf-general-gasto): the AI general invests what piles up over GASTO.over of the cap, keeps the strategic reserve, does not let
   aircraft orders asked over and over (miss) hold every producer, and grows the plan's field with idle stock, inside the population budget.
   ecoAI is asked on views set up by hand (it writes nothing); the economy's step is not run. */
const H = require('./harness'), ok = H.ok;
const C = H.load({ seed: 7, eco: true, mapv: 8 }), $ = C.$, S = C.newState('modern', null, { watch: 1, len: 0 });
const ECO = $('ECO'), GASTO = $('GASTO'), t = 0, d = S.eco.d[t];
C.run(1, null, .1);
const fresh = () => { d.q = []; d.res = {}; d.miss = {}; d.lost = {}; d.en = 1000; d.mt = 1000; };
const cat = k => ECO.unit[k] && ECO.unit[k][3];
const look = () => C.ecoAI(t, C.ecoView(t));
const mk = (id, k, at) => ({ id, k, cat: cat(k), at, p: at === null ? 0 : .3, why: at === null ? 'busy' : '', paid: { en: 0, mt: 0 } });

console.log('-- aircraft asked over and over do not hold the factory --');
{
  fresh();
  ok(C.ecoView(t).sites.some(s => s.k === 'fab' && s.prog >= 1), 'side 0 has a finished factory');
  for (const k of ['fighter', 'cas', 'heli']) d.miss[k] = Array.from({ length: 12 }, () => S.t);   // the air dispatch misses every half second
  d.q = [mk(901, 'fighter', 'hq'), mk(902, 'cas', null)];   // the HQ's one air slot at work, one waiting
  d.en = d.mt = 300;   // under the idle line: ecoAI's own pick only
  const out = look(), m = out.filter(o => o.c === 'make');
  ok(m.length >= 1 && m.every(o => cat(o.k) !== 'air'), 'with the air slot busy and one waiting, the unit order goes to another producer: ' + m.map(o => o.k).join(','));
  GASTO.on = 0;
  const m0 = look().filter(o => o.c === 'make');
  ok(m0.some(o => cat(o.k) === 'air'), 'GASTO.on 0: the old pick (one more aircraft behind the busy slot): ' + m0.map(o => o.k).join(','));
  GASTO.on = 1;
}

console.log('-- idle stock is invested, producer by producer --');
{
  fresh(); d.en = d.mt = 300;
  const low = look().filter(o => /estoque parado/.test(o.why || ''));
  ok(low.length === 0, 'stock 300/300 (under ' + GASTO.over * 100 + '% of the cap): nothing for idle stock');
  fresh();
  const out = look(), g = out.filter(o => /estoque parado/.test(o.why || ''));
  ok(g.length >= 1 && g.length <= GASTO.n, 'stock at the cap: ' + g.length + ' orders for idle stock (at most ' + GASTO.n + '): ' + g.map(o => o.c + ' ' + o.k).join(', '));
  const cats = g.filter(o => o.c === 'make').map(o => cat(o.k));
  ok(new Set(cats).size === cats.length, 'one unit order per idle producer category: ' + cats.join(','));
  ok(!g.some(o => o.c === 'make' && $('STK').k[o.k]), 'no strategic weapon among them (STK has its own rule)');
  const V = C.ecoView(t), all = out.filter(o => o.c === 'make' || o.c === 'build');
  let en = V.stock.en, mt = V.stock.mt; for (const o of all) { const c = V.costs[o.k]; en -= c[0] * (o.n || 1); mt -= c[1] * (o.n || 1); }
  ok(en >= ECO.ai.keep.en && mt >= ECO.ai.keep.mt, 'what is ordered leaves the reserve (' + ECO.ai.keep.en + '/' + ECO.ai.keep.mt + '): ' + Math.round(en) + '/' + Math.round(mt));
  d.q = [mk(903, 'tank', V.sites.find(s => s.k === 'fab').id)];
  ok(!look().some(o => /estoque parado/.test(o.why || '') && o.c === 'make' && cat(o.k) === 'veh'), 'a factory at work gets no idle-stock order');
}

console.log('-- energy piles up, metal runs short: no order eats into the metal reserve --');
{
  fresh(); d.en = 1000; d.mt = ECO.ai.keep.mt + 15;
  const V = C.ecoView(t), g = look().filter(o => /estoque parado/.test(o.why || ''));
  ok(g.every(o => V.costs[o.k][1] <= 15), 'idle-stock orders cost at most the 15 of metal over the reserve: ' + g.map(o => o.c + ' ' + o.k).join(', '));
  ok(g.every(o => o.c !== 'build' || o.k === 'mine'), 'a site for it is a mine (metal is what is short)');
  const L = (k, st) => C.gsLean(ECO.unit[k], st, C.gsIdle(t, st));
  ok(L('tank', { en: 450, mt: 100 }) < 0 && L('fighter', { en: 450, mt: 100 }) > 0 && L('squad', { en: 450, mt: 100 }) > 0, 'energy ' + $('GASTO').tilt + ' over metal (none idle): a tank leans on the scarce metal (' + L('tank', { en: 450, mt: 100 }).toFixed(2) + '), a fighter and a squad on the energy');
  ok(L('tank', { en: 300, mt: 250 }) === 0 && L('tank', { en: 900, mt: 900 }) === 0, 'balanced stocks, or both idle: no lean');
}

console.log('-- a full reserve stops the orders of its kind --');
{
  fresh();
  const fab = C.ecoView(t).sites.find(s => s.k === 'fab').id, kinds = Object.keys(ECO.unit).filter(k => cat(k) === 'veh' && C.ecoView(t).costs[k]);
  for (const k of kinds) d.res[k] = new Array(ECO.res).fill(fab);   // every vehicle kind at the reserve's room
  d.miss.aa = [S.t, S.t]; d.gs = { a: GASTO.every * GASTO.top, T: S.t }; C.gpPlan(t);   // asked for, and a grown plan that wants more
  const m = look().filter(o => o.c === 'make' && cat(o.k) === 'veh');
  ok(m.length === 0, 'every vehicle kind with ' + ECO.res + ' in reserve: no vehicle order (it would finish and wait as full): ' + m.map(o => o.k).join(','));
}

console.log('-- the plan grows with idle stock, inside the budget --');
{
  fresh();
  const P = C.popOf(t), GP = $('GP'), sum = (f, ks) => ks.reduce((a, k) => a + (f[k] || 0), 0), veh = GP.veh, fly = GP.fly;
  d.gs = { a: 0, T: S.t };
  const f0 = Object.assign({}, C.gpPlan(t).f);
  d.gs.a = GASTO.every * GASTO.top;   // idle for a long while
  const f1 = C.gpPlan(t).f;
  ok(sum(f1, Object.keys(f1)) > sum(f0, Object.keys(f0)), 'idle stock: the field wanted grows ' + sum(f0, Object.keys(f0)) + ' -> ' + sum(f1, Object.keys(f1)));
  ok(sum(f1, veh) <= Math.floor(P.veh * GP.gnd) && sum(f1, fly) <= P.air, 'still fitted to the budget: vehicles ' + sum(f1, veh) + ' <= ' + Math.floor(P.veh * GP.gnd) + ', aircraft ' + sum(f1, fly) + ' <= ' + P.air);
  d.en = d.mt = 200; d.gs.T = S.t - GASTO.every * GASTO.top;   // a long while with no idle stock: back down
  const f2 = C.gpPlan(t).f;
  ok(JSON.stringify(f2) === JSON.stringify(f0), 'without idle stock the level comes back down and the plan is today\'s again');
}
H.done();
