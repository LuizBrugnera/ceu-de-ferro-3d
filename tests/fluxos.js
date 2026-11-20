'use strict';
/* What walking the game's flows in a browser found (cf-pol-fluxos) and is checked here without one. A second.
   - The icon: the page named none, so every browser asked the server for /favicon.ico, which answers only the page, and every load printed
     "Failed to load resource: 404" in the console. The page carries its own (a data: URI), so nothing is asked, from a server or from a file.
   - The analytics: the page sends its match's events (online by the host, Assistir by POST /ana) and the server keeps only the kinds it knows.
     The brain's cb events came after the server's list, and the server refused every batch with one of them: the watch page's console filled
     with 400s and no match ever reached the server's list (Partidas anteriores: "O servidor ainda não guardou nenhuma partida"). Here: every
     kind the page writes is one the server keeps (tests/ana-online.js: a stray one no longer drops its batch). And the watch page sent every
     piece with keepalive, which the browser refuses past 64 KiB in flight: the pieces of the end's flush failed ("Failed to fetch") and the
     match never got its end or its summary. Here: only the last piece goes keepalive, and only when it fits.
   - The hangar stalled for seconds after loading and at each vehicle picked (a CPU profile: 12 of the first 30 s in the turntable's preview).
     Each pack model that arrived (31 of them, one by one, as the battle behind the hangar asks) dropped and rebuilt every card of the carousel,
     planes too, which use none; and every redraw switched the turntable's buffer between the big card's size and the small ones' (setSize,
     up to 1.6 s each on a weak GPU). Here: an arriving model drops only the cards built without it, and the buffer only grows.
   - The HUD wrote over itself: the weapon camera's inset (a bomb, a missile) lay over the vehicle's readout in the upper left; the radio lines
     ran over the title of a vehicle's damage panel; and the warnings under the scoreboard (missile, radar, impact, artillery, base under fire,
     protection) each had a fixed place, crossing each other and the feed. Here: the inset in the free band on the left, the warnings in one
     column with the feed after them, and the radio lines ending above the panel the HUD drew.
   - Partidas anteriores: a match picked from the list opened its review, the item that was clicked went away with the list and the focus fell
     on the page; the review heard Esc only with the focus inside it, so "Fechar (Esc)" did nothing and the review stayed over the hangar.
     Here: Esc closes it from anywhere, and only it; the focus stays in the dialog when a match opens. */
const H = require('./harness'), fs = require('fs'), path = require('path'), vm = require('vm'), { ok, done } = H;
const html = fs.readFileSync(H.PAGE, 'utf8');

console.log('-- the page carries its icon: no /favicon.ico asked of the server --');
{
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  const m = head.match(/<link rel="icon" href="([^"]+)">/);
  ok(!!m, 'a <link rel="icon"> inside <head> (Chrome reads the icon only there: one in the body still asked for /favicon.ico)');
  ok(!!m && m[1].startsWith('data:image/svg+xml,') && /%3Csvg[^"]*%3C\/svg%3E$/.test(m[1]), 'the icon is an inline SVG (data: URI), not a file the server would have to serve');
}

console.log('-- every analytics kind the page writes, the server keeps --');
{
  const srv = fs.readFileSync(path.join(H.ROOT, 'server.js'), 'utf8'), m = srv.match(/kinds: new Set\(\[([^\]]+)\]\)/);
  const kinds = new Set(m ? [...m[1].matchAll(/'(\w+)'/g)].map(x => x[1]) : []);
  const page = new Set([...html.matchAll(/anaPush\(\{ k: '(\w+)'/g), ...html.matchAll(/\{ k: '(\w+)', t: anaR\(/g)].map(x => x[1]));
  const miss = [...page].filter(k => !kinds.has(k));
  ok(page.size >= 10 && !miss.length, 'the page writes ' + [...page].sort().join(' ') + '; the server knows them all' + (miss.length ? ' but ' + miss.join(' ') : ''));
}
console.log('-- a watch page posts its match: keepalive only on the last piece, and only under the browser\'s 64 KiB --');
{
  const a = html.indexOf('const AAR = { key:'), b = html.indexOf('const aarLocal', a), sent = [];
  const ctx = vm.createContext({ location: { protocol: 'http:' }, crypto: require('crypto').webcrypto, ANA: { S: { era: 'modern' } },
    fetch: (u, o) => { sent.push({ u, ka: o.keepalive, n: o.body.length, end: JSON.parse(o.body).end }); return Promise.resolve({ status: 200 }); } });
  ok(a > 0 && b > a, 'the page\'s AAR and ANA.post are where this test reads them');
  vm.runInContext(html.slice(a, b) + ';globalThis.AAR = AAR;', ctx);
  const ev = n => Array.from({ length: n }, (_, i) => ({ k: 'cb', t: i, s: 0, st: 'med', pad: 'x'.repeat(60) }));
  for (let i = 0; i < 12; i++) ctx.ANA.post(ev(80), false);   // a busy flush: twelve pieces of ~7 KB leave together
  ctx.ANA.post(ev(80), true);
  ok(sent.length === 13 && sent.slice(0, 12).every(s => !s.ka) && sent[12].ka && sent[12].end === 1, 'the pieces of a flush go as plain requests (no budget to run out of); the last, small, keepalive');
  const big = sent.length; ctx.ANA.post(ev(900), true);
  ok(sent[big].n >= ctx.AAR.ka && !sent[big].ka && ctx.AAR.ka < 65536, 'a last piece of ' + sent[big].n + ' bytes goes plain: past the budget a keepalive request is refused outright');
}
console.log('-- the hangar: a pack model that arrives rebuilds only the cards that looked for it; the turntable\'s buffer only grows --');
{
  const a = html.indexOf('function packHangar('), b = html.indexOf('\n}', a) + 2, timers = [], killed = [];
  const card = ask => ({ m: { id: ask.join() || 'plane' }, ask: new Set(ask) });
  const F = { m: new Map([['abrams', card(['tk_abrams'])], ['leo2', card(['tk_leo'])], ['m109', card([])]]), dirty: false };
  const P = { m: new Map([['f22', card([])], ['a10', card([])]]), dirty: false };
  const box = { '#planes': { _f: P }, '#swapList': { _f: F } }, kicks = [];
  const ctx = vm.createContext({ PACK: {}, $: s => box[s], kill: o => killed.push(o.id), ttKick: () => kicks.push(1), setTimeout: f => timers.push(f), clearTimeout: () => {} });
  ok(a > 0 && b > a, 'packHangar is where this test reads it');
  vm.runInContext(html.slice(a, b), ctx);
  ctx.packHangar('soldier'); ctx.packHangar('tk_abrams'); ctx.packHangar('p_crate'); timers.splice(0).forEach(f => f());
  ok(killed.join() === 'tk_abrams' && !F.m.has('abrams') && F.m.has('leo2') && F.m.has('m109') && F.dirty, 'a burst of soldier, tk_abrams and p_crate: only the Abrams card (built without tk_abrams) is dropped and its carousel redrawn');
  ok(P.m.size === 2 && !P.dirty, 'the planes\' carousel, which uses no pack model, is left alone');
  ctx.packHangar('w_m4'); timers.splice(0).forEach(f => f());
  ok(kicks.length === 1, 'nothing to redraw: no redraw asked (' + kicks.length + ' in all)');
  const p0 = html.indexOf('function preview('), pv = html.slice(p0, html.indexOf('\n}\n', p0));
  ok(/if \(W > TT\.w \|\| H > TT\.h\) TT\.r\.setSize/.test(pv) && (pv.match(/setSize\(/g) || []).length === 1 && /drawImage\(TT\.r\.domElement, 0, TT\.h - H, W, H, 0, 0, W, H\)/.test(pv), 'preview: setSize only when a card is bigger than the buffer, and the card copied from the corner it was drawn in');
  const t0 = html.indexOf('function ttSpin('), tt = html.slice(t0, html.indexOf('\n}\n', t0));
  ok(/PACK\.ask = new Set\(\)/.test(tt) && /ask: PACK\.ask/.test(tt) && /if \(PACK\.ask\) PACK\.ask\.add\(id\)/.test(html), 'a card built by the turntable keeps the pack models it asked for (PACK.ask, filled by packGet)');
}
console.log('-- the HUD does not write over itself --');
{
  const a = html.indexOf('WCAM.rect = () => {'), b = html.indexOf('\n};', a) + 3;
  const W = vm.createContext({ WCAM: { full: false }, clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)), cw: 0, ch: 0 });
  vm.runInContext(html.slice(a, b), W);
  for (const [cw, ch] of [[1280, 753], [1920, 1033], [1280, 673], [1366, 721]]) {
    W.cw = cw; W.ch = ch; const r = W.WCAM.rect(), u = Math.max(.62, Math.min(1, cw / 1000));
    ok(r.y >= 250 * u && r.y + r.h <= ch - 164 * u - 60 * u && r.x >= 12 && r.w >= 160, cw + '×' + ch + ': the weapon camera at ' + r.x + ',' + r.y + ' ' + r.w + '×' + r.h + ', under the readout (' + Math.round(250 * u) + ') and above the radio lines and the damage panel (' + Math.round(ch - 224 * u) + ')');
  }
  const c = html.indexOf('function hudWarn('), d = html.indexOf('\n}\n', c) + 3, lines = [];
  const X = vm.createContext({ cw: 1280, ch: 753, FOE: 'red', AF: { on: 1 }, S: { warn: 1, rwr: [{ k: 2, n: 'SA-11', h: 2 }, { k: 1, n: 'Pantsir', h: 10 }] }, txt: (s, x, y, size) => lines.push([s, y, size]) });
  if (c > 0) vm.runInContext(html.slice(c, d), X);
  const end = typeof X.hudWarn === 'function' ? X.hudWarn({ flares: 30 }, 1, 'x', true, 100) : -1;
  ok(lines.length === 4 && lines.every((l, i) => !i || l[1] - lines[i - 1][1] >= lines[i - 1][2]) && end - lines[3][1] >= lines[3][2], 'the warnings under the scoreboard stack, one line each (' + lines.map(l => Math.round(l[1])).join(', ') + '), and the next free line is after them (' + end + ')');
  const dh = html.slice(html.indexOf('let wy = hudWarn('), html.indexOf("if (paused) txt('PAUSADO'"));
  ok(/S\.feed\.forEach\([^\n]*wy \+ i \* 19 \* u/.test(dh) && !/ty \+ (36|58|76|94) \* u/.test(dh), 'the impact, artillery, base and protection lines take the next free line, and the feed comes after them');
  const hh = html.slice(html.indexOf('function helpHud('), html.indexOf('\n}\n', html.indexOf('function helpHud(')));
  ok(/const low = hudLow; hudLow = 0;/.test(hh) && /low - 16 \* u - \(n - 1\) \* 16 \* u/.test(hh) && /hudLow = y0;/.test(html) && /if \(y0 > ch \/ 2\) hudLow = y0;/.test(html), 'the radio lines end above the panel the soldier\'s and the vehicle\'s HUD drew this frame');
}
console.log('-- the review (Partidas anteriores) closes with Esc wherever the focus is --');
{
  const i = html.indexOf("addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#aar').hidden)"), j = html.indexOf('\n', i), L = [], closed = [];
  const aar = { hidden: false }, ctx = vm.createContext({ $: s => (s === '#aar' ? aar : null), aarClose: () => { closed.push(1); aar.hidden = true; }, addEventListener: (type, f, cap) => L.push({ type, f, cap }) });
  if (i > 0) vm.runInContext(html.slice(i, j), ctx);
  const key = k => { const e = { key: k, stopped: false, stopPropagation() { this.stopped = true; }, preventDefault() {} }; for (const l of L) if (l.type === 'keydown') l.f(e); return e; };
  ok(L.length === 1 && L[0].cap === true, 'one keydown listener on the window, in the capture phase (before the general\'s view and the game hear the key)');
  const e1 = key('Escape'), e2 = key('Escape'), e3 = (aar.hidden = false, key('a'));
  ok(closed.length === 1 && e1.stopped && !e2.stopped && !e3.stopped, 'Esc with the review open closes it and stops there; with it closed, or another key, it does nothing');
  const it = html.slice(html.indexOf('async function aarPast('), html.indexOf('function aarOpen('));
  ok(/await go\(\); \(\$\('#aarBack'\)\.hidden \? \$\('#aarClose'\) : \$\('#aarBack'\)\)\.focus\(\)/.test(it), 'a match picked from the list: the focus goes to the review\'s own buttons');
}
done();
