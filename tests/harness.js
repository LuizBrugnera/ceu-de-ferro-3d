'use strict';
/* Loads the DOM-free part of the page's inline script (helpers, tables, simulation, Net) into a fresh vm context.
   PAGE=<path> picks another copy of the page (default: the published one). Each load() is an independent game instance. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const PAGE = process.env.PAGE ? path.resolve(process.env.PAGE) : path.join(ROOT, 'Céu de Ferro 3D.html');
const END = '/* ---------- 3D scene';

function source(file) {
  const html = fs.readFileSync(file || PAGE, 'utf8'), a = html.indexOf("<script>\n'use strict';"), b = html.indexOf(END);
  if (a < 0 || b < 0) throw new Error('sim section not found in ' + (file || PAGE));
  return html.slice(a + 8, b);
}
function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

/* o.seed: deterministic Math.random; o.WebSocket and o.host: for online tests through the real server */
function load(o) {
  o = o || {};
  const ctx = vm.createContext({ console, setTimeout, clearTimeout, WebSocket: o.WebSocket, location: { protocol: 'http:', host: o.host || 'localhost:0' } });
  vm.runInContext(source(o.page) + '\n;globalThis.$ = s => eval(s);', ctx, { filename: 'sim.js' });
  ctx.seed = n => { ctx.$('Math').random = rng(n); };
  if (!o.eco) try { ctx.$('ECO').on = 0; } catch (e) {}   // the economy only where a test asks for it: every older test sees today's battle
  if (!o.ff) try { ctx.$('FF').on = 0; } catch (e) {}   // friendly fire only where a test asks for it or sets FF.on itself
  if (!o.ana) try { ctx.$('ANA').on = 0; } catch (e) {}
  if (!o.lg) try { ctx.$('LG').on = 0; } catch (e) {}   // the physical logistics only where a test asks for it (load({ eco: 1, lg: 1 })): every older economy test sees the battle before them   // the analytics only where a test or tools/balance.js asks for it (load({ ana: true }))
  try { ctx.$('MAPV = ' + (+process.env.MAPV || o.mapv || 1)); } catch (e) {}   // the old map unless a test asks for the road network (MAPV=2 or load({ mapv: 2 }))
  if (o.seed) ctx.seed(o.seed);
  ctx.run = (secs, each, dt) => { dt = dt || 1 / 60; for (let n = Math.round(secs / dt); n-- > 0;) { ctx.step(dt); if (each && each(dt) === false) break; } };
  /* an AI × AI conquest match (the hangar's "Assistir" with nobody in the room): w.len the preset (0 Curta), w.doc the doctrines of side 0 and 1,
     w.min the clock in minutes (default the preset's) */
  ctx.watch = (era, w) => {
    w = w || {}; const CMD = ctx.$('CMD'); if (w.doc) CMD.use = w.doc.slice();
    const S = ctx.newState(era, null, { watch: 1, len: w.len || 0 });
    if (w.min) S.cq.T = S.cq.T0 = w.min * 60;
    return S;
  };
  /* an empty battlefield of that era: nothing spawns by itself */
  ctx.sandbox = era => { const S = ctx.newState(era); S.demo = false; S.over = true; S.units = []; S.planes = []; S.men = []; S.squads = []; return S; };
  return ctx;
}
/* every finite number in the entities of S, or the path of the first that is not */
function nan(S) {
  for (const k of ['planes', 'units', 'bullets', 'bombs', 'missiles', 'men']) for (const o of S[k] || []) for (const f of ['x', 'y', 'z', 'hp', 'h'])
    if (f in o && typeof o[f] === 'number' && !Number.isFinite(o[f])) return k + '.' + f;
  return null;
}
let fails = 0;
const ok = (c, msg) => { if (!c) fails++; console.log((c ? '  ok   ' : '  FAIL ') + msg); return c; };
const done = () => { console.log(fails ? fails + ' FAILED' : 'all passed'); process.exitCode = fails ? 1 : 0; };
module.exports = { load, source, PAGE, ROOT, ok, done, nan, rng };
