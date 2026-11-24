'use strict';
/* The build mode's lines (P12 and P14 of the polish board, cf-pol2-fase1). P12: the base's line said "botão direito ou N: cancelar" while
   N goes on to the next work (the bar's keys line says so): now "botão direito: sair", as every other work. P14: the bar names what each
   work costs, but not what the side has: obrStock writes the side's energy and metal under the bar, and the base's kits, red when the side
   cannot start the work in hand */
const fs = require('fs'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8');
const C = H.load({ seed: 78, eco: 1 }), $ = C.$;
if (typeof $('obrStock') !== 'function') { console.log('no obrStock: a page before it'); process.exit(0); }

console.log('-- P12: the base\'s line --');
ok(!/N: cancelar/.test(html) && /'Clique: começar a obra aqui  ·  botão direito: sair'/.test(html), 'the base says "botão direito: sair", nothing says N cancels');

console.log('-- P14: what the side has, under the bar --');
{
  const S = C.newState('ww2', 'schutze', { cls: 'inf', mouse: true }), P = S.my, d = S.eco && S.eco.d[P.team], st = $('obrStock'), BLD = $('BLD'), FORT = $('FORT');
  if (!d) ok(false, 'the economy is on in this match');
  else {
    d.en = 120.4; d.mt = 80.6; P.kit = 1;
    const [t, bt] = st(P, { k: 1 }), [b, bb] = st(P, { b: 1 });
    ok(t === 'SEU LADO TEM 120 ENERGIA · 81 METAL' && !bt, 'the trench: ' + t);
    ok(b === t + '  ·  KIT DE BASE ×1' && bb === $('obrInfo')(P, { b: 1 }).bad, 'the base adds the kits: ' + b);
    d.en = FORT.trench.cost[0] - 1; const [, short] = st(P, { k: 1 });
    ok(short, 'red when the side has less than the trench costs (' + d.en + ' energia for ' + FORT.trench.cost[0] + ')');
    d.en = 1e4; d.mt = 1e4; P.kit = 0; const [, nokit] = st(P, { b: 1 });
    ok(nokit, 'red for the base without a kit');
    ok(BLD.cost && FORT.bags.cost, 'base and sandbags have a cost to compare against');
  }
}
{
  const C2 = H.load({ seed: 78 }), S = C2.newState('ww2', 'schutze', { cls: 'inf', mouse: true }), P = S.my;
  if (S.eco && S.eco.d) S.eco = null;
  P.kit = 2; const [b] = C2.$('obrStock')(P, { b: 1 }), [t] = C2.$('obrStock')(P, { k: 1 });
  ok(b === 'KIT DE BASE ×2' && t === '', 'with no economy: only the base\'s kits ("' + b + '"), nothing for the trench');
}
H.done();
