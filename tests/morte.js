'use strict';
/* cf-pol2 P2: the player's death says who it was. The banner "Morto em combate" was covered at once by the swap screen, titled "Próximo
   veículo" for a soldier on foot; nobody said who killed him and the camera looked at the body. Now playerDown notes it (S.dn: the killer,
   his name, the weapon in his hands, the distance); for DN.t s the swap screen waits and the camera turns to the killer; the screen then
   names him over its choices (#swapDn) under a title that fits a soldier.
   node tests/morte.js */
const fs = require('fs'), H = require('./harness.js'), { load, ok, done } = H;
const C = load({ seed: 11 }), $ = C.$, INF = $('INF'), DN = $('DN'); C.dnTxt = $('dnTxt'); C.dnOn = $('dnOn');
const S = C.sandbox('modern'); S.over = false; S.waveTimer = S.planT = 1e9;
const B = S.base[0], me = () => { const P = C.addMan(INF.modern[0][0], 0, B.x + 300, B.z + 200, 0); P.ai = null; P.me = 1; S.my = P; S.me = 0; S.cls = 'inf'; S.model = P.id; S.input = {}; S.aim = { h: 0, p: 0, d: { x: 1, y: 0, z: 0 } }; return P; };
let P = me();
const foe = C.addMan(INF.modern[1][0], 1, P.x + 140, P.z, Math.PI); foe.ai = null;
C.killMan(P, foe);
const D = S.dn;
ok(!!D && D.o === foe, 'the death notes its killer (S.dn)');
ok(D && D.nm === (foe.name || foe.def.name) && D.w === foe.arms[foe.w].d.name && Math.abs(D.d - 140) <= 1, 'his name, the weapon in his hands and the distance (' + C.dnTxt(D) + ')');
ok(C.dnOn(), 'for DN.t s the death is on (the swap screen waits, the camera turns)');
ok(S.respawn >= DN.t + DN.pick, 'the way back leaves the screen DN.pick s after that, as it had from the death before (' + S.respawn + ' s)');
ok(S.banner && S.banner.sub.startsWith(C.dnTxt(D) + '. '), 'the banner says it under "Morto em combate", in its own lines (' + (S.banner && S.banner.sub) + ')');
C.run(DN.t + .1); ok(!C.dnOn(), 'and then it is over');
/* a mate's round */
P = me(); const mate = C.addMan(INF.modern[0][0], 0, P.x + 30, P.z, 0); mate.ai = null;
C.killMan(P, mate); ok(S.dn && S.dn.ff && /^Fogo amigo: /.test(C.dnTxt(S.dn)), 'a mate\'s round says friendly fire (' + C.dnTxt(S.dn) + ')');
/* nobody known: nothing named */
P = me(); C.killMan(P, null); ok(S.dn && C.dnTxt(S.dn) === '', 'nobody known: no name, no line');
/* the screen: the title fits a soldier, the line sits over the choices, the screen waits */
const html = fs.readFileSync(H.PAGE, 'utf8');
ok(!/P\.dead \? 'Próximo veículo'/.test(html) && /P\.man \? 'Morto em combate: voltar à batalha'/.test(html), 'the swap screen is no longer "Próximo veículo" for a soldier on foot');
ok(/<p class="swap-dn" id="swapDn" hidden><\/p>/.test(html) && /dk\.textContent = t;/.test(html), 'the killer is named on the swap screen (#swapDn), not under it');
ok(/openSwap = \(g => \(\) => \{ if \(dnOn\(\)\) return; g\(\); \}\)\(openSwap\);/.test(html), 'the swap screen waits while the camera turns to the killer');
done();
