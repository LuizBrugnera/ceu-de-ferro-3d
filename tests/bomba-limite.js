'use strict';
/* cf-bomba-limite: "deve poder pegar mais de 1 carro bomba e caminhão bomba por vez". A side has several bomb vehicles alive at once: the
   requisition (U) and the general's order (vbied, bomb svbied) refuse only past VBM.cap (car 6, truck 4: was 2 and 1) and STK.cap.k.svbied
   (4 trucks out, 6 owned: was 1 and 2); each still costs its own price; the AI sends a second car and a second truck while the first is out */
const H = require('./harness'), { ok, done } = H, C = H.load({ seed: 7, mapv: 9 }), $ = C.$;
function bare(seed) {
  C.seed(seed); const S = C.watch('modern', { n: 3 }); S.demo = false;
  for (const q of S.squads.slice()) for (const m of q.men) m.gone = true;
  S.squads.length = 0; S.men.length = 0; S.units.length = 0; S.planes.length = 0; if (S.civs) S.civs.length = 0;
  C.plan = () => {}; C.director = () => {};
  return S;
}
const VBM = $('VBM'), STK = $('STK'), t = 2;
console.log('-- the limits --');
ok(VBM.cap.car >= 3 && VBM.cap.truck >= 2, 'alive at once per side: ' + VBM.cap.car + ' car bombs, ' + VBM.cap.truck + ' truck bombs (was 2 and 1)');
ok($('stkCap')('svbied', 'live') >= 2 && $('stkCap')('svbied', 'own') > $('stkCap')('svbied', 'live') && $('stkCap')('strat', 'live') === 1 && $('stkCap')('shahed', 'live') === 1,
  'strategic trucks: ' + $('stkCap')('svbied', 'live') + ' out, ' + $('stkCap')('svbied', 'own') + ' owned; the bomber and the drones still 1 out');
ok($('RQ').cost.vbied === 3 && $('RQ').cost.svbied === 6 && $('BOMB').car.dmg === 1400 && $('BOMB').truck.dmg === 2350 && $('BOMB').truck.r === 155, 'each keeps its price (3 and 6 units of RQ.res) and its burst');
console.log('-- the requisition: one after another --');
{ const S = bare(3), Q = S.cq, b = S.base[t];
  const m = C.addMan('insRifle', t, b.x + 20, b.z, 0); m.ai = null;
  const why = model => { Q.rq[0] = 0; if (S.eco) { S.eco.d[t].en = S.eco.d[t].mt = 900; } for (const k in Q.stock) Q.stock[k].n = 3; return $('rqWhy')(m, 'trn', model, 0); };
  const add = model => { const u = C.addUnit($('TRNS')[model].kind, t, b.x + 400 + Math.random() * 50, b.z + 400, model, false); u.ai = null; return u; };
  const car = [], truck = [];
  for (let i = 0; i < VBM.cap.car; i++) { car.push(why(i & 1 ? 'vbiedPk' : 'vbied')); add(i & 1 ? 'vbiedPk' : 'vbied'); }
  car.push(why('vbied'));
  ok(Q && car.slice(0, -1).every(w => w === '') && car[car.length - 1] === 'vbcap', 'car bombs: ' + VBM.cap.car + ' taken one after another (' + car.slice(0, -1).map(w => w || 'ok').join(', ') + '), the next one ' + car[car.length - 1]);
  for (let i = 0; i < VBM.cap.truck; i++) { truck.push(why('svbied')); add('svbied'); }
  truck.push(why('svbied'));
  ok(truck.slice(0, -1).every(w => w === '') && truck[truck.length - 1] === 'vbcap', 'truck bombs: ' + VBM.cap.truck + ' taken (' + truck.slice(0, -1).map(w => w || 'ok').join(', ') + '), the next one ' + truck[truck.length - 1]); }
console.log('-- the general\'s order: several out --');
{ const S = bare(4), b = S.base[1 - 1], R = [];
  for (let i = 0; i < 3; i++) R.push($('genCmd')(t, { c: 'vbied', k: 'car', x: Math.round(b.x), z: Math.round(b.z) }, 'sys'));
  ok(R.every(r => r && r.ok) && $('vbCount')(t, 'car') === 3, 'three car bombs ordered in a row: ' + R.map(r => (r && r.ok ? 'ok' : r && r.why)).join(', ') + '; ' + $('vbCount')(t, 'car') + ' alive');
  if (S.eco) { const d = S.eco.d[t]; d.res.svbied = [{}, {}, {}].map(() => (d.res.svbied && d.res.svbied[0]) || {}); }
  const T = [];
  for (let i = 0; i < 3; i++) T.push($('genCmd')(t, { c: 'bomb', k: 'svbied', x: Math.round(b.x), z: Math.round(b.z) }, 'sys'));
  ok(T.filter(r => r && r.ok).length >= 2 && $('stkLive')(t, 'svbied').length >= 2, 'strategic truck bombs ordered in a row: ' + T.map(r => (r && r.ok ? 'ok' : r && (r.why || r.err))).join(', ') + '; ' + $('stkLive')(t, 'svbied').length + ' out'); }
console.log('-- the AI: a second truck and a second car while the first is out --');
{ const S = bare(5), b = S.base[0], C0 = (S.cmd && S.cmd[t]) || { t };
  if (S.eco) { const d = S.eco.d[t]; d.res.svbied = [{}, {}].map(() => (d.res.svbied && d.res.svbied[0]) || {}); }
  const a = { x: Math.round(b.x), z: Math.round(b.z), v: 9, o: null }, r1 = $('vbGo')(C0, a, 'teste'), n1 = $('stkLive')(t, 'svbied').length, r2 = $('vbGo')(C0, a, 'teste'), n2 = $('stkLive')(t, 'svbied').length;
  ok(r1 && r2 && n1 === 1 && n2 === 2, 'the AI sends a truck (' + n1 + ' out) and, with another in the reserve, a second one while the first drives (' + n2 + ' out)');
  ok($('INS').bomb.car >= 2, 'the AI general keeps up to ' + $('INS').bomb.car + ' car bombs out at once (was 1)'); }
done();
