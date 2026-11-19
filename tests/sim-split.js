'use strict';
/* the page's script is split at "3D scene": the part before it (the simulation, Net, the tables) must run headless (harness.js, tools/balance.js,
   the MCP's real-host tests). A name declared only after the marker (the DOM, the scene, the HUD) works in the browser, where the script is one,
   and throws a ReferenceError headless: at load when the sim section touches it at top level, or mid-match when a sim function calls it.
   Checks: the sim section loads; no name declared at top level after the marker is used in the sim section's code (comments and strings left
   out), unless behind typeof; and a short AI × AI match on the road network with the economy, logistics and the general's manoeuvres runs. Seconds */
const fs = require('fs'), H = require('./harness'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf("<script>\n'use strict';"), b = html.indexOf('/* ---------- 3D scene'), e = html.indexOf('</script>', b);
/* the code with comments, strings and regex literals blanked (lines kept) */
function code(s) {
  let o = '', i = 0, prev = '';
  while (i < s.length) {
    const c = s[i], d = s[i + 1];
    if (c === '/' && d === '/') { while (i < s.length && s[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const j = s.indexOf('*/', i + 2); o += s.slice(i, j + 2).replace(/[^\n]/g, ' '); i = j + 2; continue; }
    if (c === '"' || c === "'" || c === '`' || (c === '/' && /[(,=:[!&|?{};+\-*%<>~^]$|^$|\breturn$/.test(prev))) {
      let j = i + 1, cls = false;
      for (; j < s.length; j++) {
        if (s[j] === '\\') { j++; continue; }
        if (c === '/') { if (s[j] === '[') cls = true; else if (s[j] === ']') cls = false; else if (s[j] === '/' && !cls) break; else if (s[j] === '\n') break; continue; }
        if (s[j] === c) break;
      }
      o += ' ' + s.slice(i + 1, j).replace(/[^\n]/g, ' ') + ' '; i = j + 1; prev = 'x'; continue;
    }
    o += c; i++; if (!/\s/.test(c)) prev = (prev + c).slice(-6);
  }
  return o;
}
let loaded = null;
try { loaded = H.load({ seed: 3 }); } catch (err) { console.log('  ' + String(err && err.stack || err).split('\n').slice(0, 3).join('\n  ')); }
ok(!!loaded, 'the sim section loads headless (harness.js)');
const sim = code(html.slice(a + 8, b)), rest = code(html.slice(b, e)), after = new Set(), before = new Set();
for (const m of rest.matchAll(/^(?:async\s+)?(?:function\*?\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=)/gm)) after.add(m[1] || m[2]);
for (const m of sim.matchAll(/(?:function\*?\s+([A-Za-z_$][\w$]*)|(?:const|let|var|class)\s+([A-Za-z_$][\w$]*))/g)) before.add(m[1] || m[2]);
/* the sim's own bindings shadow a later name: parameters, a declaration's later names (const a = 1, b = 2) */
for (const m of sim.matchAll(/(?:function\*?\s*[\w$]*\s*\(([^()]*)\)|\(([^()]*)\)\s*=>|([A-Za-z_$][\w$]*)\s*=>)/g)) for (const q of (m[1] || m[2] || m[3] || '').split(/[^\w$]+/)) if (q) before.add(q);
for (const m of sim.matchAll(/,\s*([A-Za-z_$][\w$]*)\s*=(?![=>])/g)) before.add(m[1]);
const bad = [];
for (const n of after) {
  if (before.has(n)) continue;
  /* a use: the name read or called, not a property (.n, n:), not a method's definition (n(...) {), not on a line that asks typeof n first */
  const q = n.replace(/\$/g, '\\$'), re = new RegExp('(?<![\\w$.])' + q + '(?![\\w$])(?!\\s*:)(?!\\s*\\([^()]*\\)\\s*\\{)'), guard = new RegExp('typeof\\s+' + q + '(?![\\w$])');
  const at = sim.split('\n').findIndex(l => re.test(l) && !guard.test(l));
  if (at >= 0) bad.push(n + ' (sim line ' + (at + 1) + ')');
}
ok(!bad.length, 'no name declared only after the 3D marker is used in the sim section' + (bad.length ? ': ' + bad.join(', ') : ''));
if (loaded) {
  const c = H.load({ seed: 11, eco: 1, lg: 1, mapv: 4 });
  let err = null;
  try { c.watch('modern', { len: 0, min: 6 }); c.run(60, null, 1 / 20); } catch (x) { err = x; }
  ok(!err, 'a 1-minute AI × AI match on map 4 with the economy and logistics runs headless' + (err ? ': ' + String(err.stack || err).split('\n').slice(0, 2).join(' / ') : ''));
}
done();
