'use strict';
/* The page's script is one <script>: the simulation, then (after the '3D scene' marker) the view. The harness, and everything that runs the game
   without a browser, loads only the simulation, so a simulation that calls a name declared only in the view part works in the browser and throws a
   ReferenceError here. The M5 block (vehicles off the rail) was put after the marker and lgConvoy, OPS.amb and OPS.blk called m5Lg, m5Tank and m5Amb:
   every suite with the logistics or an AI ambush died. This checks, from the source, that no simulation code names a top-level declaration of the
   view part (a typeof guard, a method of the same name and a local of the same name are fine), and that the M5 block runs in the harness.
   Also that no tracked text file keeps a merge's conflict markers (tests/README.md had them committed once). A few seconds */
const H = require('./harness'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'), { ok, done } = H;

console.log('-- the simulation names nothing declared only in the view part --');
{
  const html = fs.readFileSync(H.PAGE, 'utf8'), a = html.indexOf("<script>\n'use strict';"), b = html.indexOf('/* ---------- 3D scene'), e = html.indexOf('</script>', b);
  const clean = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '').replace(/'(?:[^'\\\n]|\\.)*'/g, "''").replace(/`(?:[^`\\]|\\.)*`/g, '``');
  const sim = clean(html.slice(a + 8, b)), view = clean(html.slice(b, e)), TOP = /^(?:async\s+)?(?:function\*?|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm, ids = s => s.match(/[A-Za-z_$][\w$]*/g) || [];
  const bound = new Set(['$']);   // $ is the harness' own (and only in the simulation's regular expressions)
  for (const m of sim.matchAll(/\b(?:const|let|var)\s+([^;]*?)(?:=|\bof\b|\bin\b|;)/g)) ids(m[1]).forEach(n => bound.add(n));
  for (const m of sim.matchAll(/\b(?:const|let|var)\s+[^;]*/g)) for (const d of m[0].matchAll(/(?:^|,)\s*(?:const\s+|let\s+|var\s+)?([A-Za-z_$][\w$]*)\s*=/g)) bound.add(d[1]);
  for (const m of sim.matchAll(/function\s*\*?\s*[\w$]*\s*\(([^)]*)\)/g)) ids(m[1]).forEach(n => bound.add(n));
  for (const m of sim.matchAll(/\(([^()]*)\)\s*=>/g)) ids(m[1]).forEach(n => bound.add(n));
  for (const m of sim.matchAll(/([A-Za-z_$][\w$]*)\s*=>/g)) bound.add(m[1]);
  for (const m of sim.matchAll(/catch\s*\(\s*([\w$]+)/g)) bound.add(m[1]);
  for (const m of sim.matchAll(TOP)) bound.add(m[1]);
  const lines = sim.split('\n'), bad = [];
  for (const m of view.matchAll(TOP)) {
    const n = m[1]; if (bound.has(n)) continue;
    const re = new RegExp('(?<![\\w$.])' + n.replace(/\$/g, '\\$') + '(?![\\w$:])');
    lines.forEach((l, i) => {
      if (!re.test(l) || new RegExp('typeof\\s+' + n + '\\b').test(l) || new RegExp('(?:^|[{,])\\s*' + n + '\\s*\\([^)]*\\)\\s*\\{').test(l)) return;   // guarded, or a method of that name
      bad.push(n + ' (sim line ' + (i + 1) + ')');
    });
  }
  ok(!bad.length, 'no simulation line names a view-only declaration' + (bad.length ? ': ' + [...new Set(bad.map(s => s.split(' ')[0]))].join(', ') + ' — e.g. ' + bad.slice(0, 3).join('; ') : ''));
}

console.log('-- no merge-conflict markers committed --');
{
  let files = [];
  try { files = execFileSync('git', ['ls-files'], { cwd: H.ROOT, encoding: 'utf8' }).split('\n').filter(f => /\.(js|md|html|json|sh|css)$/.test(f)); } catch (e) {}
  const bad = files.filter(f => { try { return /^(<<<<<<< |>>>>>>> )/m.test(fs.readFileSync(path.join(H.ROOT, f), 'utf8')); } catch (e) { return false; } });
  ok(files.length > 0 && !bad.length, 'no tracked file has <<<<<<< or >>>>>>> lines' + (bad.length ? ': ' + bad.join(', ') : ' (' + files.length + ' files)'));
}

console.log('-- M5 and M6 run without a browser --');
{
  const C = H.load({ seed: 3, eco: 1, mapv: 6, lg: 1 });
  ok(['M5', 'm5Lg', 'm5Tank', 'm5Amb', 'm5Atk', 'tripTac'].every(n => C.$('typeof ' + n) !== 'undefined'), 'M5, m5Lg, m5Tank, m5Amb, m5Atk and tripTac are in the harness');
  ok(['MM', 'mmS', 'mmView'].every(n => C.$('typeof ' + n) !== 'undefined'), 'M6 (MM, mmS, mmView) is in the harness');
  const S = C.watch('ww2', { len: 0 }); let err = null;
  try { C.run(150, null, 1 / 20); } catch (e) { err = e; }
  const conv = (S.lg && S.lg.cv ? S.lg.cv.length : 0);
  ok(!err && !H.nan(S), 'an AI × AI match with the physical logistics runs 150 s' + (err ? ': ' + err.message : '') + (conv ? ' (' + conv + ' convoys)' : ''));
}
console.log('-- M5 on a map without a road network --');
{
  const C = H.load({ seed: 3, mapv: 1 }), $ = C.$, S = C.watch('ww2', { len: 0 }); C.run(5, null, 1 / 20);
  const Cm = S.cmd[0], u = S.units.find(v => v.team === 0 && v.ai && !v.net && !v.dead && v.kind === 'tank' && v.rail && !v.fixed);
  ok(!S.T.net && !!u, 'the old map (no network) with an AI tank on an axis');
  if (u) {
    const op = { k: 'atk', id: 1, O: { x: u.x + 800, z: u.z, s: u.s + 800, ri: u.ri }, sq: [{}, {}, {}], by: 'ai', ax: -1, az: 0, walk: false, over: false };
    const tryIt = f => { try { f(); return null; } catch (e) { return e.message; } };
    const e1 = tryIt(() => $('m5Atk')(Cm, op)), e2 = tryIt(() => $('m5Spot')(Cm, op, []));
    u.ai.amb = { x: u.x + 600, z: u.z, T: S.t + 60 }; const e3 = tryIt(() => $('m5Amb')(u)); u.ai.amb = null;
    ok(!e1 && !e2 && !e3, 'the assault\'s armour, its firing place and the ambush tank do not throw (they stay on the old ways)' + [e1, e2, e3].filter(Boolean).map(e => ': ' + e).join(''));
  }
}
done();
