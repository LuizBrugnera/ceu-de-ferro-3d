'use strict';
/* Two labels on the screen (P20 and P21 of the polish board, cf-pol2-fase1). P20: the top strip's counts (the points each side holds) had
   the side's name under them only with three sides; with two, "5 … 5" said nothing of whose they were. Now every count has its side's name.
   P21: the chip "Manche: S puxa" stood on the soldier's screen and in the infantry hangar, where there is no stick. Now invAir says the
   stick there is (a plane or a helicopter picked in the hangar or flown in play), and invChip shows the chip only then */
const fs = require('fs'), vm = require('vm'), H = require('./harness'), ok = H.ok;
const html = fs.readFileSync(H.PAGE, 'utf8');
console.log('page: ' + H.PAGE);
const body = name => { const i = html.indexOf('function ' + name + '('); return i < 0 ? '' : html.slice(i, html.indexOf('\n}\n', i) + 3); };
if (!body('invAir')) { console.log('no invAir: a page before it'); process.exit(0); }

console.log('-- P20: the side\'s name under each count --');
{
  const q = body('hudCq');
  ok(/\n  txt\(sn\(me\), x0 \+ tw, /.test(q) && /txt\(sn\(t\), xt, /.test(q) && !/if \(many\) txt\(sn\(/.test(q), 'hudCq writes the side\'s name under its own count and under each enemy\'s, with two sides as with three');
}

console.log('-- P21: the stick\'s chip --');
{
  const btn = { hidden: false, textContent: 'Manche: S puxa' };
  const ctx = vm.createContext({ playMode: 'demo', S: null, cls: 'inf', invertY: false, $: () => btn });
  vm.runInContext('globalThis.klass = () => cls;\n' + body('invAir') + body('invChip'), ctx);
  const at = (mode, k, my, inv) => { ctx.playMode = mode; ctx.cls = k; ctx.S = my ? { my } : null; ctx.invertY = !!inv; ctx.invChip(); return btn.hidden ? '-' : btn.textContent; };
  ok(at('demo', 'inf') === '-', 'the infantry hangar: no chip');
  ok(at('demo', 'tank') === '-', 'a tank in the hangar: no chip');
  ok(at('demo', 'plane') === 'Manche: S puxa', 'a plane in the hangar: Manche: S puxa');
  ok(at('demo', 'heli', null, 1) === 'Cíclico: W puxa', 'a helicopter in the hangar, inverted: Cíclico: W puxa');
  ok(at('play', 'inf', { man: true }) === '-', 'a soldier in play: no chip');
  ok(at('play', 'inf', { kind: 'tank' }) === '-', 'a ground vehicle in play: no chip');
  ok(at('play', 'inf', { heli: true }) === 'Cíclico: S puxa', 'the soldier who changes to a helicopter gets the chip');
  ok(at('play', 'plane', {}) === 'Manche: S puxa', 'a plane in play: Manche: S puxa');
  ok(at('watch', 'plane', {}) === '-', 'watching: no chip');
  ok(at('demo', 'plane') === 'Manche: S puxa', 'back in the hangar after watching: the chip comes back (the cached state was not left stale)');
  ok(/invChip\(\);   \/\/ the stick's chip follows/.test(body('drawHud')), 'drawHud keeps it in step with what the player is in');
  ok(!/\$\('#btnInv'\)\.hidden = (false|true)/.test(html), 'nothing else shows or hides it');
}
H.done();
